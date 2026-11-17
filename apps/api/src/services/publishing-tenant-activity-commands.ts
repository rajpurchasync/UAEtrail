import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  activityCatalogAllows,
  activityCatalogDenialMessage,
  resolveParticipationModeForJoinMode,
  resolvePublishingProfileKind,
} from '@uaetrail/shared-types';
import { ActivityStatus, ActivityType, NotificationType, RewardAction } from '../domain/enums.js';
import {
  assertNoLegacyLinkedRideshareFields,
  assertRideshareActivityFields,
  assertLocationMatchesActivityType,
  fromPrismaActivityType,
  toPrismaActivityType,
} from '../domain/activity-type.js';
import { assertActivityPricingAllowed } from '../domain/activity-pricing.js';
import { assertActivityJoinInstructions } from '../domain/activity-join-instructions.js';
import { resolveJoinMode } from '../domain/activity-join-mode.js';
import { inferTenantPublishingPurpose } from '../domain/tenant-publishing.js';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { normalizeActivityPricing } from '../lib/activity-pricing.js';
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
  publishActivityById,
  resumeActivityById,
  suspendActivityById,
  updateActivityDetailed,
} from '../lib/activities-store.js';
import { findAuthUserById } from '../lib/auth-users-store.js';
import { parseLocalDateTime } from '../lib/datetime.js';
import { resolvePublishedActivityEndAt } from '../lib/activity-publish-schedule.js';
import { buildActivityDto } from '../lib/mappers.js';
import { findActivityPrivateById, mergeActivityPrivateCrewFields } from '../lib/activity-private-store.js';
import { parseActivityPrivateCrewFieldsFromPublishingBody } from '../lib/activity-private-publishing.js';
import { activityDetailPath } from '../lib/member-routes.js';
import { createNotificationsMany } from '../lib/notifications-store.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { resolveOwnedProfileType } from '../lib/tenant-store.js';
import type {
  OperatorTenantActivityCreateInput,
  OperatorTenantActivityPatchInput,
} from '../lib/publishing-tenant-activity-schemas.js';
import {
  ensureActivityGroupChat,
  syncActivityGroupChatWallPolicyFromActivity,
  syncActivityGroupChatPhotoFromActivity,
} from './activity-group-chat.js';
import {
  notifyParticipantsOfScheduleChange,
  scheduleInstantChanged,
} from './activity-schedule.js';
import { assertMemberCanPublishActivities } from './member-publish-gate.js';
import { resolveMemberStatus } from './member-status.js';
import { notifyAdminsActivityPublished } from './platform-admin-events.js';
import { awardPoints } from './rewards.js';
import {
  assertActivityHost,
  assertActivityHostPatch,
  resolveActivityLocation,
} from './host-activity.js';
import { buildPublishingTenantActivityDto } from './publishing-tenant-activity-read.js';
import { resolveRideshareVehicleForActivityPublish } from './me-vehicles-publish.js';
import { syncActivityGuides } from './activity-guides.js';

export const createPublishingTenantActivity = async (input: {
  tenantId: string;
  actorId: string;
  platformAdmin: boolean;
  body: OperatorTenantActivityCreateInput;
}): Promise<{ data: ActivityDTO & { groupChatId: string | null } }> => {
  await assertMemberCanPublishActivities(input.actorId, {
    platformAdmin: input.platformAdmin,
    pricingMode: input.body.pricingMode,
  });
  const body = input.body;

  const location = await resolveActivityLocation(body.locationId, input.actorId, {
    platformAdmin: input.platformAdmin,
  });
  assertLocationMatchesActivityType(location.activityType, body.activityType);
  assertNoLegacyLinkedRideshareFields(body.activityType, body);
  assertRideshareActivityFields(body);

  const tenant = await findTenantById(input.tenantId);
  if (!tenant) {
    throw new ApiError(404, 'tenant_not_found', 'Host organization not found.');
  }

  const hostId = body.hostId ?? input.actorId;
  await assertActivityHost(input.tenantId, hostId, tenant, { platformAdmin: input.platformAdmin });

  const countryCode = tenant.countryCode ?? location.countryCode ?? 'AE';
  const hostStatus = await resolveMemberStatus(input.actorId);
  const publishingProfileKind = resolvePublishingProfileKind({
    ownedType: resolveOwnedProfileType(tenant),
    publishingTier: inferTenantPublishingPurpose(tenant),
  });
  const pricing = normalizeActivityPricing({
    price: body.price,
    pricingMode: body.pricingMode,
  });
  const isRideshare = body.activityType === 'rideshare';
  const rideshareVehicle = isRideshare
    ? await resolveRideshareVehicleForActivityPublish(input.actorId, body.rideshareVehicleId)
    : null;
  assertActivityPricingAllowed({
    hostTiers: hostStatus.hostTiers,
    publishingProfileKind,
    pricingMode: body.pricingMode ?? pricing.pricingMode,
    priceAed: pricing.priceAed,
    sharedAmountAed: isRideshare
      ? body.rideshareFree === false
        ? body.ridesharePriceAed ?? body.price ?? 0
        : null
      : (body.pricingMode ?? pricing.pricingMode) === 'shared'
        ? pricing.priceAed
        : null,
  });

  const created = await createActivityDetailed({
    tenant: { connect: { id: input.tenantId } },
    location: { connect: { id: body.locationId } },
    createdBy: { connect: { id: input.actorId } },
    host: { connect: { id: hostId } },
    activityType: toPrismaActivityType(body.activityType),
    title: body.title,
    description: body.description,
    startAt: parseLocalDateTime(body.date, body.time, countryCode),
    endAt: resolvePublishedActivityEndAt(body, countryCode),
    meetingPoint: body.meetingPoint,
    meetingLat: body.meetingLat,
    meetingLng: body.meetingLng,
    startPoint: body.startPoint,
    startLat: body.startLat,
    startLng: body.startLng,
    parkingPoint: body.parkingPoint,
    parkingLat: body.parkingLat,
    parkingLng: body.parkingLng,
    originLat: body.originLat,
    originLng: body.originLng,
    originLabel: body.originLabel,
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
    rideshareSeats: isRideshare
      ? body.rideshareSeats ?? body.capacity
      : body.rideshareEnabled
        ? body.rideshareSeats ?? null
        : null,
    rideshareDetails: isRideshare
      ? body.rideshareDetails ?? null
      : body.rideshareEnabled
        ? body.rideshareDetails
        : null,
    rideshareVehicleId: rideshareVehicle?.rideshareVehicleId ?? null,
    rideshareVehicle: rideshareVehicle?.rideshareVehicle ?? null,
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
    priceAed: pricing.priceAed,
    pricePackages: [],
    pricingMode: pricing.pricingMode,
    capacity: body.capacity,
    waitlist: body.waitlist !== false,
    outingCategory: body.outingCategory ?? null,
    outingTopic: body.outingTopic ?? null,
    linkedActivityId: body.linkedActivityId ?? null,
    linkedRideshareActivityId: body.linkedRideshareActivityId ?? null,
    groupChatPostPolicy: body.groupChatPostPolicy ?? null,
  });

  await createAuditLog({
    actorId: input.actorId,
    action: 'activity.create',
    entityType: 'activity',
    entityId: created.id,
    tenantId: input.tenantId,
    metadata: body.clonedFromActivityId ? { sourceActivityId: body.clonedFromActivityId } : undefined,
  });

  await syncActivityGuides({
    activityId: created.id,
    actorUserId: input.actorId,
    guideUserIds: body.guideUserIds ?? [],
    publishingProfileKind,
  });

  const privateCrew = parseActivityPrivateCrewFieldsFromPublishingBody(body);
  if (privateCrew) {
    await mergeActivityPrivateCrewFields({ activityId: created.id, ...privateCrew });
  }

  const groupChatId = await ensureActivityGroupChat(created.id);
  const refreshed = await findTenantActivityForEdit(created.id, input.tenantId);
  const dto = await buildPublishingTenantActivityDto(refreshed ?? created);

  return { data: { ...dto, groupChatId: groupChatId ?? null } };
};

export const updatePublishingTenantActivity = async (input: {
  tenantId: string;
  actorId: string;
  platformAdmin: boolean;
  activityId: string;
  body: OperatorTenantActivityPatchInput;
}): Promise<{ data: ActivityDTO }> => {
  const { tenantId, activityId, body } = input;

  const existing = await findTenantActivityForEdit(activityId, tenantId);
  if (!existing) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const nextActivityType =
    body.activityType ?? fromPrismaActivityType(existing.activityType ?? ActivityType.HIKING);
  assertNoLegacyLinkedRideshareFields(nextActivityType, body);
  if (!activityCatalogAllows(existing.status, 'edit')) {
    throw new ApiError(
      400,
      'activity_not_editable',
      activityCatalogDenialMessage('edit', existing.status)
    );
  }
  if (body.capacity !== undefined && body.capacity < existing.participants.length) {
    throw new ApiError(
      400,
      'capacity_too_low',
      `Capacity cannot be less than current participants (${existing.participants.length}).`
    );
  }

  if (body.hostId) {
    await assertActivityHostPatch(tenantId, body.hostId, { platformAdmin: input.platformAdmin });
  }

  if (body.locationId && body.activityType) {
    const location = await resolveActivityLocation(body.locationId, input.actorId, {
      platformAdmin: input.platformAdmin,
    });
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
    body.price !== undefined || body.pricingMode !== undefined
      ? normalizeActivityPricing({
          price: body.price ?? existing.priceAed,
          pricingMode: body.pricingMode ?? existing.pricingMode ?? undefined,
        })
      : null;

  const nextPaidMode =
    pricing?.pricingMode === 'paid' ||
    body.pricingMode === 'paid' ||
    existing.pricingMode === 'paid' ||
    existing.priceBreakdown?.mode === 'paid'
      ? 'paid'
      : pricing?.pricingMode ?? body.pricingMode ?? existing.pricingMode;
  if (nextPaidMode === 'paid') {
    await assertMemberCanPublishActivities(input.actorId, {
      platformAdmin: input.platformAdmin,
      pricingMode: 'paid',
    });
  }

  if (pricing) {
    const tenant = await findTenantById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'tenant_not_found', 'Host organization not found.');
    }
    const hostStatus = await resolveMemberStatus(input.actorId);
    const publishingProfileKind = resolvePublishingProfileKind({
      ownedType: resolveOwnedProfileType(tenant),
      publishingTier: inferTenantPublishingPurpose(tenant),
    });
    const isRideshare =
      body.activityType === 'rideshare' ||
      String(existing.activityType ?? '').toLowerCase() === 'rideshare';
    assertActivityPricingAllowed({
      hostTiers: hostStatus.hostTiers,
      publishingProfileKind,
      pricingMode: body.pricingMode ?? pricing.pricingMode,
      priceAed: pricing.priceAed,
      sharedAmountAed: isRideshare
        ? body.rideshareFree === false
          ? body.ridesharePriceAed ?? body.price ?? existing.ridesharePriceAed ?? 0
          : null
        : (body.pricingMode ?? pricing.pricingMode) === 'shared'
          ? pricing.priceAed
          : null,
    });
  }

  if (existing.status === ActivityStatus.PUBLISHED) {
    const nextRequirements = body.requirements ?? existing.requirements ?? [];
    assertActivityJoinInstructions(nextRequirements);
  }

  const updated = await updateActivityDetailed(activityId, {
    location: body.locationId ? { connect: { id: body.locationId } } : undefined,
    title: body.title,
    description: body.description,
    startAt: nextStartAt,
    endAt: resolvePublishedActivityEndAt(body, countryCode),
    meetingPoint: body.meetingPoint,
    meetingLat: body.meetingLat,
    meetingLng: body.meetingLng,
    startPoint: body.startPoint,
    startLat: body.startLat,
    startLng: body.startLng,
    parkingPoint: body.parkingPoint,
    parkingLat: body.parkingLat,
    parkingLng: body.parkingLng,
    originLat: body.originLat,
    originLng: body.originLng,
    originLabel: body.originLabel,
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
    ...(pricing
      ? {
          priceAed: pricing.priceAed,
          pricePackages: [],
          pricingMode: pricing.pricingMode,
        }
      : body.price !== undefined
        ? { priceAed: body.price }
        : {}),
    ...(body.pricingMode !== undefined ? { pricingMode: body.pricingMode } : {}),
    capacity: body.capacity,
    waitlist: body.waitlist,
    host: body.hostId
      ? { connect: { id: body.hostId } }
      : body.hostId === null
        ? { disconnect: true }
        : undefined,
    outingCategory: body.outingCategory,
    outingTopic: body.outingTopic,
    linkedActivityId: body.linkedActivityId,
    linkedRideshareActivityId: body.linkedRideshareActivityId,
    groupChatPostPolicy: body.groupChatPostPolicy,
  });

  if (body.groupChatPostPolicy !== undefined) {
    await syncActivityGroupChatWallPolicyFromActivity(activityId);
  }

  if (body.images !== undefined || body.bannerUrl !== undefined) {
    await syncActivityGroupChatPhotoFromActivity(activityId);
  }

  await createAuditLog({
    actorId: input.actorId,
    action: 'activity.update',
    entityType: 'activity',
    entityId: activityId,
    tenantId,
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
      countryCode,
    });
  }

  if (body.guideUserIds) {
    await syncActivityGuides({
      activityId,
      actorUserId: input.actorId,
      guideUserIds: body.guideUserIds,
    });
  }

  const privateCrew = parseActivityPrivateCrewFieldsFromPublishingBody(body);
  if (privateCrew) {
    await mergeActivityPrivateCrewFields({ activityId, ...privateCrew });
  }

  const refreshed = await findTenantActivityForEdit(activityId, tenantId);
  return { data: await buildPublishingTenantActivityDto(refreshed ?? updated) };
};

export const deleteOrCancelPublishingTenantActivity = async (input: {
  tenantId: string;
  actorId: string;
  activityId: string;
}) => {
  const event = await findTenantActivityWithParticipants(input.activityId, input.tenantId);
  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  if (activityCatalogAllows(event.status, 'delete_draft')) {
    const deleted = await deleteDraftActivityById(event.id, input.tenantId);
    if (!deleted) {
      throw new ApiError(400, 'activity_not_deletable', activityCatalogDenialMessage('delete_draft'));
    }
    await createAuditLog({
      actorId: input.actorId,
      action: 'activity.delete',
      entityType: 'activity',
      entityId: event.id,
      tenantId: input.tenantId,
    });
    return { mode: 'deleted' as const };
  }

  await cancelActivityById(event.id);

  if (event.participants.length > 0) {
    await createNotificationsMany(
      event.participants.map((p) => ({
        userId: p.userId,
        title: 'Activity Cancelled',
        body: `Sorry — the host had to cancel "${event.title}".`,
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
    actorId: input.actorId,
    action: 'activity.cancel',
    entityType: 'activity',
    entityId: event.id,
    tenantId: input.tenantId,
  });
  return { mode: 'cancelled' as const };
};

export const duplicatePublishingTenantActivity = async (input: {
  tenantId: string;
  actorId: string;
  activityId: string;
}) => {
  const duplicated = await duplicateTenantActivity(
    input.activityId,
    input.tenantId,
    input.actorId
  );
  await createAuditLog({
    actorId: input.actorId,
    action: 'activity.duplicate',
    entityType: 'activity',
    entityId: duplicated.id,
    tenantId: input.tenantId,
    metadata: { sourceActivityId: input.activityId },
  });
  const groupChatId = await ensureActivityGroupChat(duplicated.id);
  const priv = await findActivityPrivateById(duplicated.id);
  return { data: { ...buildActivityDto(duplicated, { activityPrivate: priv }), groupChatId: groupChatId ?? null } };
};

export const suspendPublishingTenantActivity = async (input: {
  tenantId: string;
  actorId: string;
  activityId: string;
}) => {
  const event = await findTenantActivityWithParticipants(input.activityId, input.tenantId);
  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  if (!activityCatalogAllows(event.status, 'suspend')) {
    throw new ApiError(400, 'activity_not_published', activityCatalogDenialMessage('suspend'));
  }

  await suspendActivityById(event.id);

  if (event.participants.length > 0) {
    await createNotificationsMany(
      event.participants.map((p) => ({
        userId: p.userId,
        title: 'Outing temporarily hidden',
        body: `"${event.title}" is paused by the host and is no longer on the map. You’ll get an update if it resumes.`,
        type: NotificationType.ACTIVITY,
        meta: {
          kind: 'activity_suspended',
          activityId: event.id,
          path: activityDetailPath(event.id),
        },
      }))
    );
  }

  await createAuditLog({
    actorId: input.actorId,
    action: 'activity.suspend',
    entityType: 'activity',
    entityId: event.id,
    tenantId: input.tenantId,
  });
  return { message: 'Activity suspended.' };
};

export const resumePublishingTenantActivity = async (input: {
  tenantId: string;
  actorId: string;
  platformAdmin: boolean;
  activityId: string;
}) => {
  const event = await findTenantActivityById(input.activityId, input.tenantId);
  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  if (!activityCatalogAllows(event.status, 'resume')) {
    throw new ApiError(400, 'activity_not_suspended', activityCatalogDenialMessage('resume'));
  }

  const paidMode =
    event.pricingMode === 'paid' || event.priceBreakdown?.mode === 'paid' ? 'paid' : event.pricingMode;
  await assertMemberCanPublishActivities(input.actorId, {
    platformAdmin: input.platformAdmin,
    pricingMode: paidMode,
  });

  await resumeActivityById(event.id);

  await createAuditLog({
    actorId: input.actorId,
    action: 'activity.resume',
    entityType: 'activity',
    entityId: event.id,
    tenantId: input.tenantId,
  });
  return { message: 'Activity resumed.', activityId: event.id };
};

export const publishPublishingTenantActivity = async (input: {
  tenantId: string;
  actorId: string;
  platformAdmin: boolean;
  activityId: string;
}) => {
  const event = await findTenantActivityById(input.activityId, input.tenantId);
  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  const paidMode =
    event.pricingMode === 'paid' || event.priceBreakdown?.mode === 'paid' ? 'paid' : event.pricingMode;
  await assertMemberCanPublishActivities(input.actorId, {
    platformAdmin: input.platformAdmin,
    pricingMode: paidMode,
  });
  if (!activityCatalogAllows(event.status, 'publish')) {
    throw new ApiError(400, 'activity_not_draft', activityCatalogDenialMessage('publish'));
  }
  assertActivityJoinInstructions(event.requirements ?? []);
  const memberStatus = await resolveMemberStatus(input.actorId);
  try {
    const { assertCommunityRideshareCanPublish } = await import('../lib/rideshare-destination-publish.js');
    await assertCommunityRideshareCanPublish(event, memberStatus.hostTiers);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid rideshare destination.';
    throw new ApiError(400, 'rideshare_destination_invalid', message);
  }
  const updated = await publishActivityById(event.id);
  await createAuditLog({
    actorId: input.actorId,
    action: 'activity.publish',
    entityType: 'activity',
    entityId: event.id,
    tenantId: input.tenantId,
  });
  const hostUserId = updated.hostId ?? updated.createdById;
  scheduleSideEffect(ensureActivityGroupChat(updated.id), 'host.publish_ensure_group_chat');
  if (hostUserId) {
    scheduleSideEffect(
      awardPoints({
        userId: hostUserId,
        action: RewardAction.ACTIVITY_PUBLISHED,
        referenceId: updated.id,
        label: `Published activity: ${updated.title}`,
      }),
      'host.publish_rewards'
    );
  }
  const hostUser = hostUserId ? await findAuthUserById(hostUserId) : null;
  const hostLabel = hostUser?.profile?.displayName?.trim() || hostUser?.email || 'A host';
  notifyAdminsActivityPublished({
    activityId: updated.id,
    title: updated.title,
    hostLabel,
  });
  return { message: 'Activity published.', activityId: updated.id };
};
