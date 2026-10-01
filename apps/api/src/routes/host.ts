import { ActivityStatus, ActivityType, MembershipRole, NotificationType, RequestStatus, RewardAction, TenantType, UserRole } from '../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { mountActivityRoutes } from '../lib/activity-routes.js';
import { registerPlaceAlias } from '../lib/route-place-alias.js';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { toLocationDto, buildActivityDto } from '../lib/mappers.js';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireOrgRole, requireTenantContext } from '../middleware/tenant.js';
import {
  ORG_ACTIVITY_EDIT_ROLES,
  ORG_ACTIVITY_PUBLISH_ROLES,
  ORG_TEAM_MANAGE_ROLES,
} from '../lib/org-permissions.js';
import { notifyRequestDecision } from '../lib/email.js';
import { validate } from '../middleware/validate.js';
import { awardPoints } from '../services/rewards.js';
import { notifyAdminsActivityPublished } from '../services/platform-admin-events.js';
import { findAuthUserById } from '../lib/auth-users.js';
import { ensureActivityGroupChat } from '../services/activity-group-chat.js';
import { mapActivityIdsToGroupChatIds } from '../lib/social-groups-store.js';
import { performParticipantCheckIn } from '../services/checkin.js';
import { buildLocationCreateData } from '../services/location-submit.js';
import {
  assertRideshareActivityFields,
  assertNoLegacyLinkedRideshareFields,
  assertLocationMatchesActivityType,
  fromPrismaActivityType,
  sharedActivityTypeSchema,
  toPrismaActivityType
} from '../domain/activity-type.js';
import { locationSubmitBodySchema } from '../domain/location-submit.js';
import { findAuthUserByEmail, updateAuthUserCore } from '../lib/auth-users.js';
import {
  cancelActivityById,
  createActivityDetailed,
  createLocationRecord,
  deleteDraftActivityById,
  duplicateTenantActivity,
  findTenantActivityBasic,
  findTenantById,
  findTenantCountryCode,
  findTenantActivityById,
  findTenantActivityForEdit,
  findTenantActivityWithParticipants,
  listSubmittedLocationsByUser,
  listTenantActivityHistoryWithParticipation,
  listTenantActivitiesDetailed,
  publishActivityById,
  updateActivityDetailed
} from '../lib/activities-store.js';
import type { ActivityWithTenantRelations } from '../lib/activity-read-assembler.js';
import {
  applyTenantActivityRequestDecision,
  clearActivityParticipantCheckIn,
  countTenantActivityRequests,
  findActivityParticipantByIdAndActivity,
  findTenantActivityRequestForDecision,
  listActivityParticipantsWithUsers,
  listTenantActivityRequestsDetailed
} from '../lib/activity-engagement-store.js';
import { createNotificationsMany } from '../lib/notifications-store.js';
import { buildJoinApprovedBody, buildJoinRejectedBody } from '../lib/notification-copy.js';
import { dispatchNotification } from '../services/notifications.js';
import {
  deleteTenantMembership,
  findCompanyGuideMembershipForUser,
  findTenantMembershipById,
  listTenantMembershipsWithUsers,
  setTenantMembershipActiveState,
  updateTenantMembershipRole,
  upsertTenantMembership
} from '../lib/tenant-access.js';
import { fulfillParticipantIntent } from '../lib/participant-intents-store.js';

const idParamSchema = z.object({ id: z.string().min(1) });
const intentIdParamSchema = z.object({ intentId: z.string().min(1) });
const membershipIdSchema = z.object({ membershipId: z.string().min(1) });

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
const requestDecisionSchema = z
  .object({
    status: z.enum(['approved', 'rejected']),
    organizerNote: z.string().max(300).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== 'rejected') return;
    const note = data.organizerNote?.trim();
    if (!note || note.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A short note is required when declining a join request.',
        path: ['organizerNote'],
      });
    }
  });

const teamCreateSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(80).optional(),
  role: z.enum(['tenant_admin', 'tenant_guide'])
});

const teamPatchSchema = z.object({
  role: z.enum(['tenant_admin', 'tenant_guide']).optional(),
  isActive: z.boolean().optional()
});

import { parseLocalDateTime } from '../lib/datetime.js';
import {
  activityPricePackagesSchema,
  normalizeActivityPricing,
  parseStoredPricePackages,
} from '../lib/activity-pricing.js';
import {
  notifyParticipantsOfScheduleChange,
  scheduleInstantChanged
} from '../services/activity-schedule.js';
import {
  assertActivityHost,
  assertActivityHostPatch,
  resolveActivityLocation
} from '../services/host-activity.js';
import { assertActivityPricingAllowed } from '../domain/activity-pricing.js';
import { assertActivityJoinInstructions } from '../domain/activity-join-instructions.js';
import { resolveJoinMode } from '../domain/activity-join-mode.js';
import { resolveParticipationModeForJoinMode } from '@uaetrail/shared-types';

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

const membershipRoleToPrisma = (role: 'tenant_admin' | 'tenant_guide'): MembershipRole =>
  role === 'tenant_admin' ? MembershipRole.TENANT_ADMIN : MembershipRole.TENANT_GUIDE;

export const hostRouter = Router();

hostRouter.use(requireAuth, requireVerifiedEmail, requireTenantContext);

const tenantActivitiesRouter = Router();

tenantActivitiesRouter.get('/', async (req, res, next) => {
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

tenantActivitiesRouter.post('/', requireOrgRole(ORG_ACTIVITY_EDIT_ROLES), validate({ body: eventCreateSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const platformAdmin = Boolean(req.tenantContext!.actingAsPlatformAdmin);
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

tenantActivitiesRouter.patch('/:id', requireOrgRole(ORG_ACTIVITY_EDIT_ROLES), validate({ params: idParamSchema, body: eventPatchSchema }), async (req, res, next) => {
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
    });

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

tenantActivitiesRouter.delete('/:id', requireOrgRole(ORG_ACTIVITY_PUBLISH_ROLES), validate({ params: idParamSchema }), async (req, res, next) => {
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
          body: `Sorry — the host had to cancel "${event.title}".`,
          type: NotificationType.ACTIVITY,
          meta: { activityId: event.id }
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

tenantActivitiesRouter.post('/:id/duplicate', requireOrgRole(ORG_ACTIVITY_EDIT_ROLES), validate({ params: idParamSchema }), async (req, res, next) => {
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

tenantActivitiesRouter.post('/:id/publish', requireOrgRole(ORG_ACTIVITY_PUBLISH_ROLES), validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
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
    void awardPoints({
      userId: hostUserId,
      action: RewardAction.ACTIVITY_PUBLISHED,
      referenceId: updated.id,
      label: `Published activity: ${updated.title}`
    }).catch(() => undefined);
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

const hostRequestsQuerySchema = paginationSchema.extend({
  activityId: z.string().min(1).optional(),
});

hostRouter.get('/requests', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const query = hostRequestsQuerySchema.parse(req.query);
    const { activityId, page, pageSize } = query;
    const [requests, total] = await Promise.all([
      listTenantActivityRequestsDetailed({
        tenantId,
        skip: (page - 1) * pageSize,
        take: pageSize,
        activityId,
      }),
      countTenantActivityRequests(tenantId, activityId)
    ]);
    res.json(paginatedResponse(
      requests.map((request) => ({
        id: request.id,
        status: request.status.toLowerCase(),
        note: request.note,
        organizerNote: request.organizerNote,
        cancelReason: request.cancelReason,
        cancelMessage: request.cancelMessage,
        cancelledAt: request.cancelledAt,
        createdAt: request.createdAt,
        user: {
          id: request.user.id,
          email: request.user.email,
          displayName: request.user.profile?.displayName ?? request.user.email
        },
        activity: (() => {
          const startAt = request.activity.startAt;
          const startIso =
            startAt instanceof Date
              ? startAt.toISOString()
              : startAt
                ? String(startAt)
                : undefined;
          return {
            id: request.activity.id,
            title: request.activity.title,
            locationName: request.activity.location.name,
            startAt: startIso,
            date: startIso?.slice(0, 10),
          };
        })()
      })),
      total,
      { page, pageSize }
    ));
  } catch (error) {
    next(error);
  }
});

hostRouter.patch('/requests/:id', requireOrgRole(ORG_ACTIVITY_EDIT_ROLES), validate({ params: idParamSchema, body: requestDecisionSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const { status, organizerNote } = req.body as z.infer<typeof requestDecisionSchema>;

    const request = await findTenantActivityRequestForDecision(id, tenantId);

    if (!request) {
      throw new ApiError(404, 'request_not_found', 'Join request not found.');
    }
    if (request.status !== RequestStatus.PENDING) {
      throw new ApiError(400, 'request_finalized', 'Only pending requests can be processed.');
    }

    if (status === 'approved') {
      await applyTenantActivityRequestDecision({
        requestId: request.id,
        activityId: request.activityId,
        userId: request.userId,
        reviewerId: req.auth!.userId,
        decision: 'approved',
        organizerNote
      });

      const groupId = await ensureActivityGroupChat(request.activityId);

      await dispatchNotification({
        userId: request.userId,
        title: "You're in!",
        body: buildJoinApprovedBody(organizerNote),
        type: NotificationType.REQUEST_UPDATE,
        meta: {
          kind: 'join_request_approved',
          activityId: request.activityId,
          requestId: request.id,
          groupId: groupId ?? null,
          organizerNote: organizerNote?.trim() || null,
          path: groupId
            ? `/groups?group=${groupId}`
            : '/trips?segment=upcoming&tab=joined'
        }
      });
    } else {
      await applyTenantActivityRequestDecision({
        requestId: request.id,
        activityId: request.activityId,
        userId: request.userId,
        reviewerId: req.auth!.userId,
        decision: 'rejected',
        organizerNote
      });

      await dispatchNotification({
        userId: request.userId,
        title: 'Update on your activity request',
        body: buildJoinRejectedBody(organizerNote),
        type: NotificationType.REQUEST_UPDATE,
        meta: {
          kind: 'join_request_rejected',
          activityId: request.activityId,
          requestId: request.id,
          organizerNote: organizerNote?.trim() || null,
          path: '/trips?segment=upcoming&tab=joined',
        }
      });
    }

    await createAuditLog({
      actorId: req.auth!.userId,
      action: `request.${status}`,
      entityType: 'activity_request',
      entityId: request.id,
      tenantId
    });

    const userName = request.user.profile?.displayName ?? request.user.email.split('@')[0];
    const activityDate = request.activity.startAt.toISOString().slice(0, 10);
    notifyRequestDecision({
      to: request.user.email,
      userName,
      activityTitle: request.activity.title,
      activityDate,
      approved: status === 'approved',
      note: organizerNote
    }).catch(() => undefined);

    res.json({ message: `Request ${status}.` });
  } catch (error) {
    next(error);
  }
});

hostRouter.get('/team', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const members = await listTenantMembershipsWithUsers(tenantId);

    res.json({
      data: members.map((member) => ({
        id: member.id,
        userId: member.userId,
        email: member.user.email,
        displayName: member.user.profile?.displayName ?? member.user.email,
        role: member.role.toLowerCase(),
        createdAt: member.createdAt,
        isActive: member.isActive ?? true
      }))
    });
  } catch (error) {
    next(error);
  }
});

hostRouter.post(
  '/team',
  requireOrgRole(ORG_TEAM_MANAGE_ROLES),
  validate({ body: teamCreateSchema }),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const body = req.body as z.infer<typeof teamCreateSchema>;
      const role = membershipRoleToPrisma(body.role);

      const tenant = await findTenantById(tenantId);
      if (!tenant) {
        throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');
      }

      const user = await findAuthUserByEmail(body.email);
      if (!user) {
        throw new ApiError(
          404,
          'user_not_found',
          'This person must sign up and sign in on UAE Trail before you can add them to your team.'
        );
      }

      if (role === MembershipRole.TENANT_GUIDE && tenant.type === TenantType.COMPANY) {
        const existingCompanyGuideMembership = await findCompanyGuideMembershipForUser(user._id, tenantId);
        if (existingCompanyGuideMembership) {
          throw new ApiError(400, 'guide_tenant_conflict', 'Guide is already assigned to another company tenant.');
        }
      }

      const membership = await upsertTenantMembership({ tenantId, userId: user._id, role });

      await createAuditLog({
        actorId: req.auth!.userId,
        action: 'team.upsert_member',
        entityType: 'tenant_membership',
        entityId: membership.id,
        tenantId
      });

      res.status(201).json({
        data: {
          id: membership.id,
          userId: user._id,
          email: user.email,
          displayName: user.profile?.displayName ?? user.email,
          role: membership.role.toLowerCase(),
          isNewUser: false
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

hostRouter.patch(
  '/team/:membershipId',
  requireOrgRole(ORG_TEAM_MANAGE_ROLES),
  validate({ params: membershipIdSchema, body: teamPatchSchema }),
  async (req, res, next) => {
    try {
      const { membershipId } = req.params as z.infer<typeof membershipIdSchema>;
      const { role, isActive } = req.body as z.infer<typeof teamPatchSchema>;
      const tenantId = req.tenantContext!.tenantId;

      const membership = await findTenantMembershipById(tenantId, membershipId);
      if (!membership) {
        throw new ApiError(404, 'membership_not_found', 'Team member not found.');
      }

      let updated: { id: string; role: MembershipRole; isActive: boolean } | null = null;
      if (role) {
        const updatedRoleMembership = await updateTenantMembershipRole(membership.id, membershipRoleToPrisma(role));
        updated = {
          id: updatedRoleMembership.id,
          role: updatedRoleMembership.role,
          isActive: (updatedRoleMembership as { isActive?: boolean }).isActive ?? true
        };
        await updateAuthUserCore({
          userId: membership.userId,
          role: role === 'tenant_admin' ? UserRole.TENANT_ADMIN : UserRole.TENANT_GUIDE
        });
      }

      if (isActive !== undefined) {
        updated = await setTenantMembershipActiveState(membership.id, isActive);
      }

      await createAuditLog({
        actorId: req.auth!.userId,
        action: isActive !== undefined ? 'team.update_status' : 'team.update_role',
        entityType: 'tenant_membership',
        entityId: membership.id,
        tenantId
      });

      res.json({
        data: {
          id: membership.id,
          role: updated?.role?.toLowerCase() ?? membership.role.toLowerCase(),
          isActive: updated?.isActive ?? (membership as { isActive?: boolean }).isActive ?? true
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

hostRouter.delete(
  '/team/:membershipId',
  requireOrgRole(ORG_TEAM_MANAGE_ROLES),
  validate({ params: membershipIdSchema }),
  async (req, res, next) => {
    try {
      const { membershipId } = req.params as z.infer<typeof membershipIdSchema>;
      const tenantId = req.tenantContext!.tenantId;

      const membership = await findTenantMembershipById(tenantId, membershipId);
      if (!membership) {
        throw new ApiError(404, 'membership_not_found', 'Team member not found.');
      }

      if (membership.role === MembershipRole.TENANT_OWNER) {
        throw new ApiError(400, 'owner_cannot_be_removed', 'The tenant owner cannot be removed.');
      }

      const removed = await deleteTenantMembership(membership.id);
      if (!removed) {
        throw new ApiError(500, 'membership_delete_failed', 'Failed to remove team member.');
      }

      await createAuditLog({
        actorId: req.auth!.userId,
        action: 'team.remove_member',
        entityType: 'tenant_membership',
        entityId: membership.id,
        tenantId
      });

      res.json({ data: { removed: true } });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Participant Check-in ───────────────────────────────────────────────────

const participantIdSchema = z.object({
  id: z.string().min(1),
  participantId: z.string().min(1)
});

tenantActivitiesRouter.get('/:id/participants', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params as z.infer<typeof idParamSchema>;

    const activity = await findTenantActivityBasic(id, tenantId);
    if (!activity) throw new ApiError(404, 'activity_not_found', 'Activity not found.');

    const participants = await listActivityParticipantsWithUsers(id);

    res.json({
      data: {
        activityId: id,
        activityTitle: activity.title,
        capacity: activity.capacity,
        participants: participants.map((p) => ({
          id: p.id,
          userId: p.userId,
          displayName: p.user.profile?.displayName ?? p.user.email,
          email: p.user.email,
          phone: p.user.profile?.phone ?? null,
          avatarUrl: p.user.profile?.avatarUrl ?? null,
          checkedInAt: p.checkedInAt,
          joinedAt: p.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

tenantActivitiesRouter.post('/:id/participants/:participantId/checkin', requireOrgRole(ORG_ACTIVITY_EDIT_ROLES), validate({ params: participantIdSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id, participantId } = req.params as z.infer<typeof participantIdSchema>;

    const result = await performParticipantCheckIn({
      activityId: id,
      participantId,
      actorUserId: req.auth!.userId,
      tenantId
    });

    res.json({
      message: result.alreadyCheckedIn ? 'Participant already checked in.' : 'Participant checked in.',
      checkedInAt: result.checkedInAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
});

tenantActivitiesRouter.delete('/:id/participants/:participantId/checkin', requireOrgRole(ORG_ACTIVITY_EDIT_ROLES), validate({ params: participantIdSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id, participantId } = req.params as z.infer<typeof participantIdSchema>;

    const activity = await findTenantActivityById(id, tenantId);
    if (!activity) throw new ApiError(404, 'activity_not_found', 'Activity not found.');

    const participant = await findActivityParticipantByIdAndActivity(participantId, id);
    if (!participant) throw new ApiError(404, 'participant_not_found', 'Participant not found.');

    await clearActivityParticipantCheckIn(participantId);

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'participant.undo_checkin',
      entityType: 'activity_participant',
      entityId: participantId,
      tenantId
    });

    res.json({ message: 'Check-in undone.' });
  } catch (error) {
    next(error);
  }
});

// ─── Location Submission ────────────────────────────────────────────────────

registerPlaceAlias(hostRouter, 'get', '/locations', async (req, res, next) => {
  try {
    const locations = await listSubmittedLocationsByUser(req.auth!.userId);
    res.json({ data: locations.map((l) => toLocationDto(l)) });
  } catch (error) {
    next(error);
  }
});

registerPlaceAlias(hostRouter, 'post', '/locations', requireOrgRole(ORG_ACTIVITY_EDIT_ROLES), validate({ body: locationSubmitBodySchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof locationSubmitBodySchema>;

    const created = await createLocationRecord(buildLocationCreateData(body, req.auth!.userId));

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'location.submit',
      entityType: 'location',
      entityId: created.id,
      tenantId: req.tenantContext!.tenantId
    });

    void awardPoints({
      userId: req.auth!.userId,
      action: RewardAction.LOCATION_SUBMITTED,
      referenceId: created.id,
      label: `Submitted location: ${created.name}`
    }).catch(() => undefined);

    res.status(201).json({ data: toLocationDto(created) });
  } catch (error) {
    next(error);
  }
});

// ─── Activity History ──────────────────────────────────────────────────────────

tenantActivitiesRouter.get('/history', async (req, res, next) => {
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

const fulfillIntentBodySchema = z.object({
  activityId: z.string().min(1)
});

hostRouter.post(
  '/participant-intents/:intentId/fulfill',
  requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
  validate({ params: intentIdParamSchema, body: fulfillIntentBodySchema }),
  async (req, res, next) => {
    try {
      const { intentId } = req.params as z.infer<typeof intentIdParamSchema>;
      const { activityId } = req.body as z.infer<typeof fulfillIntentBodySchema>;
      const tenantId = req.tenantContext!.tenantId;
      const activity = await findTenantActivityBasic(activityId, tenantId);
      if (!activity) {
        throw new ApiError(404, 'activity_not_found', 'Activity not found.');
      }
      const intent = await fulfillParticipantIntent(intentId, activityId);
      if (!intent) {
        throw new ApiError(404, 'intent_not_found', 'Community request not found.');
      }
      res.json(intent);
    } catch (error) {
      next(error);
    }
  }
);

mountActivityRoutes(hostRouter, tenantActivitiesRouter);
