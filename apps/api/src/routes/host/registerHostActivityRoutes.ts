import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { z } from 'zod';
import { mountActivityRoutes } from '../../lib/activity-routes.js';
import { ActivityStatus, ActivityType, NotificationType, RewardAction } from '../../domain/enums.js';
import { createAuditLog } from '../../lib/audit.js';
import { ApiError } from '../../lib/api-error.js';
import { buildActivityDto } from '../../lib/mappers.js';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { requireOrgRole } from '../../middleware/tenant.js';
import { ORG_ACTIVITY_EDIT_ROLES, ORG_ACTIVITY_PUBLISH_ROLES } from '../../lib/org-permissions.js';
import { validate } from '../../middleware/validate.js';
import { notifyAdminsActivityPublished } from '../../services/platform-admin-events.js';
import { awardPoints } from '../../services/rewards.js';
import { findAuthUserById } from '../../lib/auth-users.js';
import {
  ensureActivityGroupChat,
  syncActivityGroupChatWallPolicyFromActivity,
} from '../../services/activity-group-chat.js';
import { mapActivityIdsToGroupChatIds } from '../../lib/social-groups-store.js';
import {
  assertRideshareActivityFields,
  assertNoLegacyLinkedRideshareFields,
  assertLocationMatchesActivityType,
  fromPrismaActivityType,
  sharedActivityTypeSchema,
  toPrismaActivityType,
} from '../../domain/activity-type.js';
import {
  cancelActivityById,
  createActivityDetailed,
  deleteDraftActivityById,
  duplicateTenantActivity,
  findTenantById,
  findTenantCountryCode,
  findTenantActivityById,
  findTenantActivityForEdit,
  findTenantActivityWithParticipants,
  listTenantActivityHistoryWithParticipation,
  listTenantActivitiesDetailed,
  publishActivityById,
  updateActivityDetailed,
} from '../../lib/activities-store.js';
import type { ActivityWithTenantRelations } from '../../lib/activity-read-assembler.js';
import { activityDetailPath } from '../../lib/member-routes.js';
import { createNotificationsMany } from '../../lib/notifications-store.js';
import { assertMemberCanPublishActivities } from '../../services/member-publish-gate.js';
import { registerHostDemandFulfillLegacyRoutes } from './registerHostDemandFulfillLegacy.js';
import { registerHostActivityRequestRoutes } from './registerHostActivityRequestRoutes.js';
import { registerHostTeamRoutes } from './registerHostTeamRoutes.js';
import { registerHostActivityParticipantRoutes } from './registerHostActivityParticipantRoutes.js';
import { idParamSchema } from './host-route-schemas.js';
import { parseLocalDateTime } from '../../lib/datetime.js';
import {
  activityPricePackagesSchema,
  normalizeActivityPricing,
  parseStoredPricePackages,
} from '../../lib/activity-pricing.js';
import {
  notifyParticipantsOfScheduleChange,
  scheduleInstantChanged,
} from '../../services/activity-schedule.js';
import {
  assertActivityHost,
  assertActivityHostPatch,
  resolveActivityLocation,
} from '../../services/host-activity.js';
import { assertActivityPricingAllowed } from '../../domain/activity-pricing.js';
import { assertActivityJoinInstructions } from '../../domain/activity-join-instructions.js';
import { resolveJoinMode } from '../../domain/activity-join-mode.js';
import { resolveParticipationModeForJoinMode } from '@uaetrail/shared-types';

const optionalHttpUrlSchema = z
  .string()
  .max(2000)
  .optional()
  .nullable()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  })
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid http(s) URL' }
  );

const outingCategorySchema = z.enum(['hiking', 'camping', 'events', 'rideshare', 'activities']);
const outingTopicSchema = z.enum([
  'climbing',
  'trail_run',
  'road_run',
  'swim',
  'workshop',
  'community',
]);

const eventCreateSchema = z.object({
  activityType: sharedActivityTypeSchema,
  locationId: z.string().min(1),
  title: z.string().min(4).max(120),
  description: z.string().min(1).max(5000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  meetingPoint: z.string().max(200).optional(),
  meetingLat: z.number().min(-90).max(90).optional(),
  meetingLng: z.number().min(-180).max(180).optional(),
  startPoint: z.string().max(500).optional(),
  startLat: z.number().min(-90).max(90).optional(),
  startLng: z.number().min(-180).max(180).optional(),
  parkingPoint: z.string().max(200).optional(),
  parkingLat: z.number().min(-90).max(90).optional(),
  parkingLng: z.number().min(-180).max(180).optional(),
  meetingDifferent: z.boolean().optional(),
  rideshareEnabled: z.boolean().optional(),
  rideshareFree: z.boolean().optional(),
  ridesharePriceAed: z.number().int().min(0).optional(),
  rideshareSeats: z.number().int().min(1).optional(),
  rideshareDetails: z.string().max(1000).optional(),
  rideshareFromPoint: z.string().max(200).optional(),
  rideshareFromLat: z.number().min(-90).max(90).optional(),
  rideshareFromLng: z.number().min(-180).max(180).optional(),
  rideshareToPoint: z.string().max(200).optional(),
  rideshareToLat: z.number().min(-90).max(90).optional(),
  rideshareToLng: z.number().min(-180).max(180).optional(),
  paymentTerms: z.string().max(1000).optional(),
  itinerary: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  joinMode: z.enum(['open', 'private']).optional(),
  participationMode: z.enum(['rsvp', 'approval']).optional(),
  groupChatPostPolicy: z.enum(['all_participants', 'host_only']).optional(),
  price: z.number().int().min(0).default(0),
  pricePackages: activityPricePackagesSchema.optional(),
  capacity: z.number().int().positive(),
  images: z.array(z.string()).default([]),
  bannerUrl: optionalHttpUrlSchema,
  signupUrl: optionalHttpUrlSchema,
  hostId: z.string().optional(),
  pricingMode: z.enum(['free', 'shared', 'paid']).optional(),
  outingCategory: outingCategorySchema.optional(),
  outingTopic: outingTopicSchema.optional(),
  clonedFromActivityId: z.string().uuid().optional(),
  linkedActivityId: z.string().uuid().nullable().optional(),
  linkedRideshareActivityId: z.string().uuid().nullable().optional(),
})
  .superRefine((data, ctx) => {
    if (data.activityType === 'rideshare') return;
    if (data.description.trim().length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Description must be at least 20 characters.',
        path: ['description'],
      });
    }
  });

const eventPatchSchema = eventCreateSchema.innerType().partial();

const buildHostActivityResponse = async (event: ActivityWithTenantRelations): Promise<ActivityDTO> => {
  const dto = buildActivityDto(event);
  if (!event.linkedRideshareActivityId) return dto;

  const linked = await findTenantActivityForEdit(event.linkedRideshareActivityId, event.tenantId);
  if (!linked) return dto;

  return {
    ...dto,
    linkedRideshare: buildActivityDto(linked),
  };
};

/** Host console **activity** CRUD, publish, and history (`/host/activities/*`). */
export const registerHostActivityRoutes = (hostRouter: Router): void => {
  const hostActivitiesRouter = createRouter();

hostActivitiesRouter.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const pg = paginationSchema.parse(req.query);
    const { items: events, total } = await listTenantActivitiesDetailed({
      tenantId,
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize,
      orderBy: { startAt: 'asc' }
    });

    const groupChatIds = await mapActivityIdsToGroupChatIds(events.map((event) => event.id));
    res.json(paginatedResponse(
      events.map((event) => ({
        ...buildActivityDto(event),
        groupChatId: groupChatIds.get(event.id) ?? null,
      })),
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
});

hostActivitiesRouter.post('/', requireOrgRole(ORG_ACTIVITY_EDIT_ROLES), validate({ body: eventCreateSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const platformAdmin = Boolean(req.tenantContext!.actingAsPlatformAdmin);
    await assertMemberCanPublishActivities(req.auth!.userId, { platformAdmin });
    const body = req.body as z.infer<typeof eventCreateSchema>;

    const location = await resolveActivityLocation(body.locationId, req.auth!.userId, { platformAdmin });
    assertLocationMatchesActivityType(location.activityType, body.activityType);
    assertNoLegacyLinkedRideshareFields(body.activityType, body);
    assertRideshareActivityFields(body);

    const tenant = await findTenantById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'tenant_not_found', 'Host organization not found.');
    }

    const hostId = body.hostId ?? req.auth!.userId;
    await assertActivityHost(tenantId, hostId, tenant, { platformAdmin });

    const countryCode = tenant.countryCode ?? location.countryCode ?? 'AE';
    const pricing = normalizeActivityPricing({
      price: body.price,
      pricePackages: body.pricePackages,
      pricingMode: body.pricingMode,
    });
    const isRideshare = body.activityType === 'rideshare';
    assertActivityPricingAllowed({
      tenantType: tenant.type,
      pricingMode: body.pricingMode,
      pricing,
      sharedAmountAed: isRideshare
        ? body.rideshareFree === false
          ? body.ridesharePriceAed ?? body.price ?? 0
          : null
        : body.pricingMode === 'shared'
          ? pricing.priceAed
          : null,
    });

    const created = await createActivityDetailed({
      tenant: { connect: { id: tenantId } },
      location: { connect: { id: body.locationId } },
      createdBy: { connect: { id: req.auth!.userId } },
      host: { connect: { id: hostId } },
      activityType: toPrismaActivityType(body.activityType),
      title: body.title,
      description: body.description,
      startAt: parseLocalDateTime(body.date, body.time, countryCode),
      endAt: body.endDate && body.endTime ? parseLocalDateTime(body.endDate, body.endTime, countryCode) : undefined,
      meetingPoint: body.meetingPoint,
      meetingLat: body.meetingLat,
      meetingLng: body.meetingLng,
      startPoint: body.startPoint,
      startLat: body.startLat,
      startLng: body.startLng,
      parkingPoint: body.parkingPoint,
      parkingLat: body.parkingLat,
      parkingLng: body.parkingLng,
      meetingDifferent: body.meetingDifferent ?? false,
      rideshareEnabled: isRideshare ? true : (body.rideshareEnabled ?? false),
      rideshareFree: isRideshare
        ? body.rideshareFree ?? body.price === 0
        : body.rideshareEnabled
          ? (body.rideshareFree ?? true)
          : null,
      ridesharePriceAed: isRideshare
        ? body.rideshareFree === false
          ? body.ridesharePriceAed ?? body.price ?? 0
          : null
        : body.rideshareEnabled && body.rideshareFree === false
          ? body.ridesharePriceAed ?? 0
          : null,
      rideshareSeats: isRideshare ? body.rideshareSeats ?? body.capacity : body.rideshareEnabled ? body.rideshareSeats ?? null : null,
      rideshareDetails: isRideshare ? body.rideshareDetails ?? null : body.rideshareEnabled ? body.rideshareDetails : null,
      paymentTerms: body.paymentTerms,
      itinerary: body.itinerary,
      requirements: body.requirements,
      joinMode: resolveJoinMode(body.joinMode, body.requirements),
      participationMode: resolveParticipationModeForJoinMode({
        joinMode: resolveJoinMode(body.joinMode, body.requirements),
        participationMode: body.participationMode,
        requirements: body.requirements,
      }),
      images: body.images,
      bannerUrl: body.bannerUrl ?? null,
      signupUrl: body.signupUrl ?? null,
      priceAed: pricing.priceAed,
      pricePackages: pricing.pricePackages,
      pricingMode: pricing.pricingMode,
      capacity: body.capacity,
      outingCategory: body.outingCategory ?? null,
      outingTopic: body.outingTopic ?? null,
      linkedActivityId: body.linkedActivityId ?? null,
      linkedRideshareActivityId: body.linkedRideshareActivityId ?? null,
      groupChatPostPolicy: body.groupChatPostPolicy ?? null,
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'activity.create',
      entityType: 'activity',
      entityId: created.id,
      tenantId,
      metadata: body.clonedFromActivityId ? { sourceActivityId: body.clonedFromActivityId } : undefined,
    });

    const groupChatId = await ensureActivityGroupChat(created.id);

    const refreshed = await findTenantActivityForEdit(created.id, tenantId);
    const dto = await buildHostActivityResponse(refreshed ?? created);

    res.status(201).json({
      data: { ...dto, groupChatId: groupChatId ?? null },
    });
  } catch (error) {
    next(error);
  }
});

hostActivitiesRouter.patch('/:id', requireOrgRole(ORG_ACTIVITY_EDIT_ROLES), validate({ params: idParamSchema, body: eventPatchSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const platformAdmin = Boolean(req.tenantContext!.actingAsPlatformAdmin);
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const body = req.body as z.infer<typeof eventPatchSchema>;

    const existing = await findTenantActivityForEdit(id, tenantId);
    if (!existing) {
      throw new ApiError(404, 'activity_not_found', 'Activity not found.');
    }

    const nextActivityType =
      body.activityType ?? fromPrismaActivityType(existing.activityType ?? ActivityType.HIKING);
    assertNoLegacyLinkedRideshareFields(nextActivityType, body);
    if (existing.status === ActivityStatus.CANCELLED || existing.status === ActivityStatus.SUSPENDED) {
      throw new ApiError(400, 'activity_not_editable', `Cannot edit an activity that is ${existing.status.toLowerCase()}.`);
    }
    if (body.capacity !== undefined && body.capacity < existing.participants.length) {
      throw new ApiError(400, 'capacity_too_low', `Capacity cannot be less than current participants (${existing.participants.length}).`);
    }

    if (body.hostId) {
      await assertActivityHostPatch(tenantId, body.hostId, { platformAdmin });
    }

    if (body.locationId && body.activityType) {
      const location = await resolveActivityLocation(body.locationId, req.auth!.userId, { platformAdmin });
      assertLocationMatchesActivityType(location.activityType, body.activityType);
    } else if (body.locationId) {
      throw new ApiError(400, 'activity_type_required', 'Activity type is required when changing location.');
    } else if (body.activityType) {
      assertLocationMatchesActivityType(existing.location.activityType, body.activityType);
    }

    const tenantMeta = await findTenantCountryCode(tenantId);
    const countryCode = tenantMeta?.countryCode ?? 'AE';

    const nextStartAt =
      body.date && body.time ? parseLocalDateTime(body.date, body.time, countryCode) : undefined;
    const startChanged =
      nextStartAt !== undefined &&
      scheduleInstantChanged(existing.startAt, nextStartAt, countryCode);

    const pricing =
      body.price !== undefined || body.pricePackages !== undefined
        ? normalizeActivityPricing({
            price: body.price ?? existing.priceAed,
            pricePackages: body.pricePackages ?? parseStoredPricePackages(existing.pricePackages),
            pricingMode: body.pricingMode ?? existing.pricingMode ?? undefined,
          })
        : null;

    if (pricing) {
      const tenant = await findTenantById(tenantId);
      if (tenant) {
        const isRideshare =
          body.activityType === 'rideshare' ||
          String(existing.activityType ?? '').toLowerCase() === 'rideshare';
        assertActivityPricingAllowed({
          tenantType: tenant.type,
          pricingMode: body.pricingMode ?? pricing.pricingMode,
          pricing,
          sharedAmountAed: isRideshare
            ? body.rideshareFree === false
              ? body.ridesharePriceAed ?? body.price ?? existing.ridesharePriceAed ?? 0
              : null
            : (body.pricingMode ?? pricing.pricingMode) === 'shared'
              ? pricing.priceAed
              : null,
        });
      }
    }

    if (existing.status === ActivityStatus.PUBLISHED) {
      const nextRequirements = body.requirements ?? existing.requirements ?? [];
      assertActivityJoinInstructions(nextRequirements);
    }

    const updated = await updateActivityDetailed(id, {
      location: body.locationId ? { connect: { id: body.locationId } } : undefined,
      title: body.title,
      description: body.description,
      startAt: nextStartAt,
      endAt: body.endDate && body.endTime ? parseLocalDateTime(body.endDate, body.endTime, countryCode) : undefined,
      meetingPoint: body.meetingPoint,
      meetingLat: body.meetingLat,
      meetingLng: body.meetingLng,
      startPoint: body.startPoint,
      startLat: body.startLat,
      startLng: body.startLng,
      parkingPoint: body.parkingPoint,
      parkingLat: body.parkingLat,
      parkingLng: body.parkingLng,
      meetingDifferent: body.meetingDifferent,
      rideshareEnabled: body.rideshareEnabled,
      rideshareFree: body.rideshareFree,
      ridesharePriceAed: body.ridesharePriceAed,
      rideshareSeats: body.rideshareSeats,
      rideshareDetails: body.rideshareDetails,
      paymentTerms: body.paymentTerms,
      itinerary: body.itinerary,
      requirements: body.requirements,
      joinMode:
        body.joinMode !== undefined
          ? resolveJoinMode(body.joinMode, body.requirements ?? existing.requirements)
          : body.requirements !== undefined
            ? resolveJoinMode(existing.joinMode, body.requirements)
            : undefined,
      participationMode: (() => {
        const nextJoinMode =
          body.joinMode !== undefined
            ? resolveJoinMode(body.joinMode, body.requirements ?? existing.requirements)
            : body.requirements !== undefined
              ? resolveJoinMode(existing.joinMode, body.requirements)
              : resolveJoinMode(existing.joinMode, existing.requirements);
        const nextRequirements = body.requirements ?? existing.requirements;
        const storedParticipation =
          body.participationMode !== undefined
            ? body.participationMode
            : body.requirements !== undefined
              ? existing.participationMode
              : undefined;
        if (
          body.participationMode === undefined &&
          body.joinMode === undefined &&
          body.requirements === undefined
        ) {
          return undefined;
        }
        return resolveParticipationModeForJoinMode({
          joinMode: nextJoinMode,
          participationMode: storedParticipation,
          requirements: nextRequirements,
        });
      })(),
      images: body.images,
      bannerUrl: body.bannerUrl,
      signupUrl: body.signupUrl,
      ...(pricing
        ? {
            priceAed: pricing.priceAed,
            pricePackages: pricing.pricePackages,
            pricingMode: pricing.pricingMode,
          }
        : body.price !== undefined
          ? { priceAed: body.price }
          : {}),
      ...(body.pricingMode !== undefined ? { pricingMode: body.pricingMode } : {}),
      capacity: body.capacity,
      host: body.hostId ? { connect: { id: body.hostId } } : body.hostId === null ? { disconnect: true } : undefined,
      outingCategory: body.outingCategory,
      outingTopic: body.outingTopic,
      linkedActivityId: body.linkedActivityId,
      linkedRideshareActivityId: body.linkedRideshareActivityId,
      groupChatPostPolicy: body.groupChatPostPolicy,
    });

    if (body.groupChatPostPolicy !== undefined) {
      await syncActivityGroupChatWallPolicyFromActivity(id);
    }

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'activity.update',
      entityType: 'activity',
      entityId: id,
      tenantId
    });

    if (
      startChanged &&
      existing.status === ActivityStatus.PUBLISHED &&
      nextStartAt &&
      existing.participants.length > 0
    ) {
      await notifyParticipantsOfScheduleChange({
        activityId: existing.id,
        activityTitle: updated.title,
        participantUserIds: existing.participants.map((p) => p.userId),
        previousStartAt: existing.startAt,
        newStartAt: nextStartAt,
        countryCode
      });
    }

    const refreshed = await findTenantActivityForEdit(id, tenantId);

    res.json({
      data: await buildHostActivityResponse(refreshed ?? updated)
    });
  } catch (error) {
    next(error);
  }
});

hostActivitiesRouter.delete('/:id', requireOrgRole(ORG_ACTIVITY_PUBLISH_ROLES), validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const event = await findTenantActivityWithParticipants(id, tenantId);
    if (!event) {
      throw new ApiError(404, 'activity_not_found', 'Activity not found.');
    }

    if (event.status === ActivityStatus.DRAFT) {
      const deleted = await deleteDraftActivityById(event.id, tenantId);
      if (!deleted) {
        throw new ApiError(400, 'activity_not_deletable', 'Only draft activities can be deleted.');
      }
      await createAuditLog({
        actorId: req.auth!.userId,
        action: 'activity.delete',
        entityType: 'activity',
        entityId: event.id,
        tenantId
      });
      res.status(204).send();
      return;
    }

    await cancelActivityById(event.id);

    // Notify all participants about the cancellation
    if (event.participants.length > 0) {
      await createNotificationsMany(
        event.participants.map((p) => ({
          userId: p.userId,
          title: 'Activity Cancelled',
          body: `Sorry ÎÃÃ¶ the host had to cancel "${event.title}".`,
          type: NotificationType.ACTIVITY,
          meta: {
            kind: 'activity_cancelled',
            activityId: event.id,
            path: activityDetailPath(event.id),
          },
        }))
      );
    }

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'activity.cancel',
      entityType: 'activity',
      entityId: event.id,
      tenantId
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

hostActivitiesRouter.post('/:id/duplicate', requireOrgRole(ORG_ACTIVITY_EDIT_ROLES), validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const duplicated = await duplicateTenantActivity(id, tenantId, req.auth!.userId);
    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'activity.duplicate',
      entityType: 'activity',
      entityId: duplicated.id,
      tenantId,
      metadata: { sourceActivityId: id }
    });
    const groupChatId = await ensureActivityGroupChat(duplicated.id);
    res.status(201).json({ data: { ...buildActivityDto(duplicated), groupChatId: groupChatId ?? null } });
  } catch (error) {
    next(error);
  }
});

hostActivitiesRouter.post('/:id/publish', requireOrgRole(ORG_ACTIVITY_PUBLISH_ROLES), validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const platformAdmin = Boolean(req.tenantContext!.actingAsPlatformAdmin);
    await assertMemberCanPublishActivities(req.auth!.userId, { platformAdmin });
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const event = await findTenantActivityById(id, tenantId);
    if (!event) {
      throw new ApiError(404, 'activity_not_found', 'Activity not found.');
    }
    if (event.status !== ActivityStatus.DRAFT) {
      throw new ApiError(400, 'activity_not_draft', 'Only draft activities can be published.');
    }
    assertActivityJoinInstructions(event.requirements ?? []);
    const updated = await publishActivityById(event.id);
    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'activity.publish',
      entityType: 'activity',
      entityId: event.id,
      tenantId
    });
    const hostUserId = updated.hostId ?? updated.createdById;
    void ensureActivityGroupChat(updated.id).catch(() => undefined);
    if (hostUserId) {
      void awardPoints({
        userId: hostUserId,
        action: RewardAction.ACTIVITY_PUBLISHED,
        referenceId: updated.id,
        label: `Published activity: ${updated.title}`,
      }).catch(() => undefined);
    }
    const hostUser = hostUserId ? await findAuthUserById(hostUserId) : null;
    const hostLabel = hostUser?.profile?.displayName?.trim() || hostUser?.email || 'A host';
    notifyAdminsActivityPublished({
      activityId: updated.id,
      title: updated.title,
      hostLabel,
    });
    res.json({ message: 'Activity published.', activityId: updated.id });
  } catch (error) {
    next(error);
  }
});

registerHostActivityRequestRoutes(hostRouter);
registerHostTeamRoutes(hostRouter);

registerHostActivityParticipantRoutes(hostActivitiesRouter);

hostActivitiesRouter.get('/history', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const pg = paginationSchema.parse(req.query);
    const { items: events, total } = await listTenantActivityHistoryWithParticipation({
      tenantId,
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize
    });

    res.json(paginatedResponse(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        locationName: e.location.name,
        activityType: fromPrismaActivityType(e.location.activityType),
        startAt: e.startAt,
        status: e.status.toLowerCase(),
        capacity: e.capacity,
        participantCount: e.participants.length,
        checkedInCount: e.participants.filter((p) => p.checkedInAt !== null).length
      })),
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
});
registerHostDemandFulfillLegacyRoutes(hostRouter);

  mountActivityRoutes(hostRouter, hostActivitiesRouter);
};
