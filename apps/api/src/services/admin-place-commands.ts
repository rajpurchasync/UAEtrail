import {
  Accessibility,
  ActivityType,
  Difficulty,
  LocationStatus,
  NotificationType,
  RewardAction,
} from '../domain/enums.js';
import {
  mergeVenueAreaTag,
  placeDetailPath,
  resolveCatalogSubmitterUserId,
} from '@uaetrail/shared-types';
import { activityDetailPath } from '../lib/member-routes.js';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { toLocationDto } from '../lib/mappers.js';
import { invalidatePublishedDestinationsCache } from '../lib/destination-resolution.js';
import { findDestinationById, updateAdminDestination } from '../lib/destinations-store.js';
import { scheduleExploreMapCacheInvalidation } from '../lib/explore-map-cache-schedule.js';
import { withPlaceDestinationMeta } from '../lib/place-destination-meta.js';
import { awardPoints } from './rewards.js';
import {
  locationHasCatalogImportTag,
  withCatalogAdminEditedTag,
  VENUE_CATALOG_EXTERNAL_SOURCE,
} from '../lib/venue-catalog.js';
import {
  countActiveEventsByLocationId,
  createAdminLocation,
  deleteAdminLocation,
  findAdminLocationById,
  updateAdminLocation,
} from '../lib/admin-store.js';
import { EXPLORE_VENUES_LIST_PATH } from '../lib/member-routes.js';
import { catalogDestinationIdUpdate } from '@uaetrail/shared-types';
import { assertActiveListedPlaceHasCatalogGeo } from '../lib/listed-catalog-geo-gate.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { dispatchNotification } from './notifications.js';
import { notifyUserAdminAction } from './admin-notifications.js';
import { recordCatalogEditOutcome } from './catalog-edit-ranking.js';

export type AdminPlaceWriteInput = {
  name: string;
  region: string;
  placeHubLabel?: string | null;
  destinationId?: string | null;
  parentPlaceId?: string | null;
  activityType: string;
  description: string;
  difficulty?: 'easy' | 'moderate' | 'hard';
  season: string[];
  childFriendly?: boolean;
  maxGroupSize?: number;
  accessibility?: 'car-accessible' | 'remote';
  images: string[];
  featured?: boolean;
  status?: 'draft' | 'active' | 'inactive';
  distance?: number;
  duration?: number;
  elevation?: number;
  campingType?: 'self-guided' | 'operator-led';
  latitude?: number | null;
  longitude?: number | null;
  highlights?: string[];
  surfaceType?: string[];
  tags?: string[];
  parkingLink?: string | null;
  parkingLat?: number | null;
  parkingLng?: number | null;
  accessibleBy?: string[];
  countryCode?: string;
  gpxKey?: string | null;
  guidePdfKey?: string | null;
  guideMarkdown?: string | null;
  guidePreview?: string | null;
  unlockPriceAed?: number;
};

const toPrismaActivityType = (activityType: string): ActivityType => {
  const normalized = activityType.toLowerCase();
  if (normalized === 'hiking') return ActivityType.HIKING;
  if (normalized === 'camping') return ActivityType.CAMPING;
  if (normalized === 'shop') return ActivityType.SHOP;
  return ActivityType.EVENT;
};

const toPrismaDifficulty = (difficulty?: 'easy' | 'moderate' | 'hard'): Difficulty | undefined => {
  if (!difficulty) return undefined;
  if (difficulty === 'easy') return Difficulty.EASY;
  if (difficulty === 'moderate') return Difficulty.MODERATE;
  return Difficulty.HARD;
};

const toPrismaAccessibility = (
  accessibility?: 'car-accessible' | 'remote'
): Accessibility | undefined => {
  if (!accessibility) return undefined;
  return accessibility === 'car-accessible' ? Accessibility.CAR_ACCESSIBLE : Accessibility.REMOTE;
};

const toPrismaLocationStatus = (status?: 'draft' | 'active' | 'inactive'): LocationStatus | undefined => {
  if (!status) return undefined;
  if (status === 'draft') return LocationStatus.DRAFT;
  return status === 'active' ? LocationStatus.ACTIVE : LocationStatus.INACTIVE;
};

const resolveAdminParentPlaceId = async (input: {
  parentPlaceId?: string | null;
  placeId?: string;
  areaId?: string | null;
}): Promise<string | null> => {
  const trimmed = input.parentPlaceId?.trim() || null;
  if (!trimmed) return null;
  if (input.placeId && trimmed === input.placeId) {
    throw new ApiError(400, 'invalid_parent_place', 'A catalog route cannot be its own place hub.');
  }
  const parent = await findAdminLocationById(trimmed);
  if (!parent) {
    throw new ApiError(404, 'parent_place_not_found', 'Place hub not found.');
  }
  if (parent.parentPlaceId?.trim()) {
    throw new ApiError(
      400,
      'invalid_parent_place',
      'Place hub must be a top-level hub row (no parent hub on the hub row).'
    );
  }
  const areaId = input.areaId?.trim() || null;
  const parentArea = parent.areaId?.trim() || null;
  if (areaId && parentArea && areaId !== parentArea) {
    throw new ApiError(
      400,
      'parent_area_mismatch',
      'Place hub must be in the same curated area as this route.'
    );
  }
  return trimmed;
};

export const createAdminPlaceRecord = async (input: { actorId: string; body: AdminPlaceWriteInput }) => {
  const body = input.body;
  const placeHubLabel = body.placeHubLabel?.trim() || null;
  const baseTags = body.tags ?? [];
  const parentPlaceId = await resolveAdminParentPlaceId({
    parentPlaceId: body.parentPlaceId,
    areaId: body.destinationId?.trim() || null,
  });
  const created = await createAdminLocation({
    name: body.name,
    region: body.region,
    placeHubLabel,
    destinationId: body.destinationId?.trim() || null,
    parentPlaceId,
    activityType: toPrismaActivityType(body.activityType),
    description: body.description,
    difficulty: toPrismaDifficulty(body.difficulty),
    season: body.season,
    childFriendly: body.childFriendly ?? false,
    maxGroupSize: body.maxGroupSize,
    accessibility: toPrismaAccessibility(body.accessibility),
    images: body.images,
    featured: body.featured ?? false,
    status: toPrismaLocationStatus(body.status) ?? LocationStatus.ACTIVE,
    distance: body.distance,
    duration: body.duration,
    elevation: body.elevation,
    campingType: body.campingType,
    latitude: body.latitude,
    longitude: body.longitude,
    highlights: body.highlights ?? [],
    surfaceType: body.surfaceType ?? [],
    tags: mergeVenueAreaTag(baseTags, placeHubLabel),
    parkingLink: body.parkingLink,
    parkingLat: body.parkingLat ?? undefined,
    parkingLng: body.parkingLng ?? undefined,
    accessibleBy: body.accessibleBy ?? [],
    countryCode: body.countryCode?.toUpperCase() ?? 'AE',
  });
  await createAuditLog({
    actorId: input.actorId,
    action: 'location.create',
    entityType: 'location',
    entityId: created.id,
  });
  scheduleExploreMapCacheInvalidation('admin.place_create_map_cache');
  return toLocationDto(created, { admin: true });
};

export const updateAdminPlaceRecord = async (input: {
  actorId: string;
  placeId: string;
  body: Partial<AdminPlaceWriteInput>;
}) => {
  const { placeId, body } = input;
  const existing = await findAdminLocationById(placeId);
  if (!existing) {
    throw new ApiError(404, 'location_not_found', 'Location not found.');
  }

  const nextStatus = toPrismaLocationStatus(body.status);
  const activating =
    nextStatus === LocationStatus.ACTIVE &&
    (existing.status === LocationStatus.DRAFT || existing.status === LocationStatus.INACTIVE);
  const activatingFromDraft =
    nextStatus === LocationStatus.ACTIVE && existing.status === LocationStatus.DRAFT;
  const deactivating = nextStatus === LocationStatus.INACTIVE && existing.status === LocationStatus.ACTIVE;
  const rejectingDraft =
    nextStatus === LocationStatus.INACTIVE && existing.status === LocationStatus.DRAFT;

  if (activating) {
    const mergedImages = body.images ?? existing.images ?? [];
    if (mergedImages.length < 1 || !mergedImages[0]?.trim()) {
      throw new ApiError(
        400,
        'cover_image_required',
        'Active catalog places must include at least one cover image URL before approval.'
      );
    }

    const activityType = body.activityType
      ? toPrismaActivityType(body.activityType)
      : existing.activityType;
    const difficulty = body.difficulty ? toPrismaDifficulty(body.difficulty) : existing.difficulty;
    const parkingLink = body.parkingLink !== undefined ? body.parkingLink : existing.parkingLink;
    const latitude = body.latitude !== undefined ? body.latitude : existing.latitude;
    const longitude = body.longitude !== undefined ? body.longitude : existing.longitude;

    if (activityType !== ActivityType.SHOP) {
      if (
        (activityType === ActivityType.HIKING || activityType === ActivityType.EVENT) &&
        !difficulty
      ) {
        throw new ApiError(
          400,
          'difficulty_required',
          'Trail and community event locations require a difficulty level before approval.'
        );
      }
      if (!parkingLink && (latitude == null || longitude == null)) {
        throw new ApiError(
          400,
          'parking_required',
          'Add a parking link or map coordinates before approving this location.'
        );
      }
    } else if (latitude == null || longitude == null) {
      throw new ApiError(
        400,
        'coords_required',
        'Community shop pins need a map location before approval.'
      );
    }
  }

  const isCatalogVenue =
    existing.externalSource === VENUE_CATALOG_EXTERNAL_SOURCE || locationHasCatalogImportTag(existing.tags);
  const nextAreaLabel =
    body.placeHubLabel !== undefined ? body.placeHubLabel?.trim() || null : existing.placeHubLabel ?? null;
  const baseTagsForUpdate = body.tags !== undefined ? body.tags : existing.tags;
  const tagsWithArea =
    body.placeHubLabel !== undefined ? mergeVenueAreaTag(baseTagsForUpdate, nextAreaLabel) : baseTagsForUpdate;
  const tagsForUpdate = isCatalogVenue
    ? withCatalogAdminEditedTag(tagsWithArea)
    : body.tags !== undefined || body.placeHubLabel !== undefined
      ? tagsWithArea
      : undefined;

  const nextAreaId =
    body.destinationId !== undefined
      ? body.destinationId?.trim() || null
      : existing.destinationId?.trim() || existing.areaId?.trim() || null;
  const parentPlaceId =
    body.parentPlaceId !== undefined
      ? await resolveAdminParentPlaceId({
          parentPlaceId: body.parentPlaceId,
          placeId,
          areaId: nextAreaId,
        })
      : undefined;

  const updated = await updateAdminLocation(placeId, {
    name: body.name,
    region: body.region,
    placeHubLabel: body.placeHubLabel !== undefined ? nextAreaLabel : undefined,
    ...(body.destinationId !== undefined
      ? catalogDestinationIdUpdate(body.destinationId?.trim() || null)
      : {}),
    parentPlaceId,
    countryCode: body.countryCode?.toUpperCase(),
    activityType: body.activityType ? toPrismaActivityType(body.activityType) : undefined,
    description: body.description,
    difficulty: toPrismaDifficulty(body.difficulty),
    season: body.season,
    childFriendly: body.childFriendly,
    maxGroupSize: body.maxGroupSize,
    accessibility: toPrismaAccessibility(body.accessibility),
    images: body.images,
    featured: body.featured,
    status: nextStatus,
    ...(activating ? { registryListed: true } : {}),
    distance: body.distance,
    duration: body.duration,
    elevation: body.elevation,
    campingType: body.campingType,
    latitude: body.latitude,
    longitude: body.longitude,
    highlights: body.highlights,
    surfaceType: body.surfaceType,
    tags: tagsForUpdate,
    parkingLink: body.parkingLink,
    parkingLat: body.parkingLat !== undefined ? body.parkingLat : undefined,
    parkingLng: body.parkingLng !== undefined ? body.parkingLng : undefined,
    accessibleBy: body.accessibleBy,
    gpxKey: body.gpxKey,
    guidePdfKey: body.guidePdfKey,
    guideMarkdown: body.guideMarkdown,
    guidePreview: body.guidePreview,
    unlockPriceAed: body.unlockPriceAed,
  });

  if (activating) {
    assertActiveListedPlaceHasCatalogGeo(updated);
    const linkedDestinationId = (updated.destinationId ?? existing.destinationId)?.trim();
    if (linkedDestinationId) {
      const linkedDestination = await findDestinationById(linkedDestinationId);
      if (linkedDestination?.status === 'draft') {
        await updateAdminDestination(linkedDestination.id, { status: 'published' });
        invalidatePublishedDestinationsCache();
      }
    }
  }

  scheduleExploreMapCacheInvalidation('admin.place_update_map_cache');

  await createAuditLog({
    actorId: input.actorId,
    action: activating ? 'location.approve' : 'location.update',
    entityType: 'location',
    entityId: updated.id,
  });

  const catalogSubmitterId = resolveCatalogSubmitterUserId(updated);
  if (activating && catalogSubmitterId) {
    if (activatingFromDraft) {
      recordCatalogEditOutcome(catalogSubmitterId, 'success');
    }
    const locationDto = toLocationDto(updated, { admin: true });
    const activityTypeWire = locationDto.activityType;
    const publicPath = placeDetailPath(activityTypeWire, updated.id);
    const venueLabel =
      activityTypeWire === 'shop'
        ? 'shop pin'
        : activityTypeWire === 'camping'
          ? 'camp spot'
          : activityTypeWire === 'event'
            ? 'venue'
            : 'trail';
    const venueTitle =
      activityTypeWire === 'shop'
        ? 'Shop pin approved'
        : venueLabel === 'trail'
          ? 'Trail'
          : venueLabel === 'camp spot'
            ? 'Camp spot'
            : 'Venue';
    await dispatchNotification({
      userId: catalogSubmitterId,
      title: activityTypeWire === 'shop' ? venueTitle : `${venueTitle} approved`,
      body:
        activityTypeWire === 'shop'
          ? `"${updated.name}" is live on Explore so others can find this shop nearby.`
          : `"${updated.name}" is live on Explore. Open your ${venueLabel} page or use it when you organize a plan.`,
      type: NotificationType.SYSTEM,
      meta: {
        locationId: updated.id,
        activityType: activityTypeWire,
        kind: 'location_approved',
        path: publicPath,
      },
    });
    scheduleSideEffect(
      awardPoints({
        userId: catalogSubmitterId,
        action: RewardAction.LOCATION_PUBLISHED,
        referenceId: updated.id,
        label: `Location approved: ${updated.name}`,
      }),
      'admin.location_approved_rewards'
    );

    scheduleSideEffect(
      (async () => {
        const { publishDraftRidesharesPendingDestinationPlace } = await import(
          '../lib/rideshare-destination-publish.js'
        );
        const rideIds = await publishDraftRidesharesPendingDestinationPlace(updated.id);
        for (const activityId of rideIds) {
          await dispatchNotification({
            userId: catalogSubmitterId,
            title: 'Your ride is live',
            body: `"${updated.name}" is approved — your linked ride is now on the explore map.`,
            type: NotificationType.SYSTEM,
            meta: {
              activityId,
              kind: 'rideshare_destination_live',
              path: activityDetailPath(activityId),
            },
          });
        }
      })(),
      'admin.rideshare_pending_destination_publish'
    );

    scheduleSideEffect(
      (async () => {
        const { publishDraftActivitiesPendingVenuePlace } = await import(
          '../lib/pending-venue-publish.js'
        );
        const { listTenantMembershipsWithUsers } = await import('../lib/tenant-access.js');
        const hits = await publishDraftActivitiesPendingVenuePlace(updated.id);
        const notified = new Set<string>();
        for (const hit of hits) {
          const recipients = new Set<string>([
            catalogSubmitterId,
            hit.hostUserId,
            ...hit.notifyUserIds,
          ]);
          try {
            const members = await listTenantMembershipsWithUsers(hit.tenantId);
            for (const member of members) {
              if (member.isActive !== false && member.userId) recipients.add(member.userId);
            }
          } catch {
            /* still notify host + submitter */
          }
          for (const userId of recipients) {
            if (notified.has(`${userId}:${hit.activityId}`)) continue;
            notified.add(`${userId}:${hit.activityId}`);
            await dispatchNotification({
              userId,
              title: 'Your outing is live',
              body: `"${updated.name}" is approved — “${hit.title}” is now on the explore map and in search.`,
              type: NotificationType.SYSTEM,
              meta: {
                activityId: hit.activityId,
                locationId: updated.id,
                kind: 'activity_venue_live',
                path: activityDetailPath(hit.activityId),
              },
            });
          }
        }
      })(),
      'admin.pending_venue_publish'
    );
  }

  if (rejectingDraft && catalogSubmitterId) {
    recordCatalogEditOutcome(catalogSubmitterId, 'fail');
    await notifyUserAdminAction({
      userId: catalogSubmitterId,
      title: 'Location not approved',
      body: `"${updated.name}" was not approved for listing. Contact support if you have questions.`,
      meta: {
        locationId: updated.id,
        kind: 'location_rejected',
        path: EXPLORE_VENUES_LIST_PATH,
      },
    });
  } else if (deactivating && catalogSubmitterId) {
    await notifyUserAdminAction({
      userId: catalogSubmitterId,
      title: 'Location delisted',
      body: `"${updated.name}" was removed from the public map. Contact support if you have questions.`,
      meta: {
        locationId: updated.id,
        kind: 'location_delisted',
        path: EXPLORE_VENUES_LIST_PATH,
      },
    });
  }

  return withPlaceDestinationMeta(toLocationDto(updated, { admin: true }));
};

export const deleteAdminPlaceRecord = async (input: { actorId: string; placeId: string }) => {
  const location = await findAdminLocationById(input.placeId);
  if (!location) {
    throw new ApiError(404, 'location_not_found', 'Location not found.');
  }

  const activeEventCount = await countActiveEventsByLocationId(input.placeId);
  if (activeEventCount > 0) {
    throw new ApiError(
      400,
      'location_has_events',
      `Cannot delete location: ${activeEventCount} active event(s) reference it.`
    );
  }

  if (location.status === LocationStatus.DRAFT) {
    recordCatalogEditOutcome(resolveCatalogSubmitterUserId(location), 'fail');
  }

  await deleteAdminLocation(input.placeId);

  await createAuditLog({
    actorId: input.actorId,
    action: 'location.delete',
    entityType: 'location',
    entityId: input.placeId,
  });

  scheduleExploreMapCacheInvalidation('admin.place_delete_map_cache');
};
