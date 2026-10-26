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
import { scheduleExploreMapCacheInvalidation } from '../lib/explore-map-cache-schedule.js';
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
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { dispatchNotification } from './notifications.js';
import { notifyUserAdminAction } from './admin-notifications.js';

export type AdminPlaceWriteInput = {
  name: string;
  region: string;
  areaLabel?: string | null;
  areaId?: string | null;
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

export const createAdminPlaceRecord = async (input: { actorId: string; body: AdminPlaceWriteInput }) => {
  const body = input.body;
  const areaLabel = body.areaLabel?.trim() || null;
  const baseTags = body.tags ?? [];
  const created = await createAdminLocation({
    name: body.name,
    region: body.region,
    areaLabel,
    areaId: body.areaId?.trim() || null,
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
    tags: mergeVenueAreaTag(baseTags, areaLabel),
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
  const deactivating = nextStatus === LocationStatus.INACTIVE && existing.status === LocationStatus.ACTIVE;

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
    body.areaLabel !== undefined ? body.areaLabel?.trim() || null : existing.areaLabel ?? null;
  const baseTagsForUpdate = body.tags !== undefined ? body.tags : existing.tags;
  const tagsWithArea =
    body.areaLabel !== undefined ? mergeVenueAreaTag(baseTagsForUpdate, nextAreaLabel) : baseTagsForUpdate;
  const tagsForUpdate = isCatalogVenue
    ? withCatalogAdminEditedTag(tagsWithArea)
    : body.tags !== undefined || body.areaLabel !== undefined
      ? tagsWithArea
      : undefined;

  const updated = await updateAdminLocation(placeId, {
    name: body.name,
    region: body.region,
    areaLabel: body.areaLabel !== undefined ? nextAreaLabel : undefined,
    areaId: body.areaId !== undefined ? body.areaId?.trim() || null : undefined,
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

  scheduleExploreMapCacheInvalidation('admin.place_update_map_cache');

  await createAuditLog({
    actorId: input.actorId,
    action: activating ? 'location.approve' : 'location.update',
    entityType: 'location',
    entityId: updated.id,
  });

  const catalogSubmitterId = resolveCatalogSubmitterUserId(updated);
  if (activating && catalogSubmitterId) {
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
  }

  if (deactivating && catalogSubmitterId) {
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
  }

  return toLocationDto(updated, { admin: true });
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

  await deleteAdminLocation(input.placeId);

  await createAuditLog({
    actorId: input.actorId,
    action: 'location.delete',
    entityType: 'location',
    entityId: input.placeId,
  });

  scheduleExploreMapCacheInvalidation('admin.place_delete_map_cache');
};
