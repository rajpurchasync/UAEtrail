import type { ActivityDTO, ExploreMapItemDTO, ShopPresence } from '@uaetrail/shared-types';
import {
  buildExploreCardPresentation,
  buildExploreFeaturedPerson,
  buildExploreMapPlanProjection,
  exploreMapKindToPlanMapKind,
  EXPLORE_SHOPS_LIST_PATH,
  placeDetailPath,
  resolveActivityHostAvatar,
  resolveActivityHostDisplayName,
  resolveActivityHostUserId,
  resolveEntityPath,
  resolveActivityOutingTopic,
  resolveParticipationMode,
  shopPublicPath,
} from '@uaetrail/shared-types';
import type { Location } from '../domain/types.js';
import { resolveJoinMode } from '../domain/activity-join-mode.js';
import { listPublishedActivitiesForExploreMap } from './activities-store.js';
import { listActiveLocations } from './location-query.js';
import { buildActivityDto, toLocationDto } from './mappers.js';
import { buildExploreActivityDisplay } from './explore-display.js';
import {
  findMerchantProfilesByTenantIds,
  loadMerchantOwnerDisplaysByAdminIds,
} from './shop-store.js';
import { listPublicShopTenantsForExplore } from './tenant-store.js';
import { listActiveParticipantIntentsForMap } from './participant-intents-store.js';
import { getReviewStatsByTargets } from './social-data.js';
import { ReviewTargetType } from '../domain/enums.js';
import { getRedisClient } from './redis.js';
import {
  EXPLORE_MAP_CACHE_TTL_SEC,
  EXPLORE_MAP_REDIS_KEY,
  invalidateExploreMapCache,
  readExploreMapMemoryCache,
  writeExploreMapMemoryCache,
} from './explore-map-cache.js';
import { resolveVenueExploreLabels } from './venue-display-names.js';
import { isWithinUaeFocusArea } from './uae-bbox.js';
import { listPublishedAreas } from './areas-store.js';

export { invalidateExploreMapCache };

const resolveShopPresence = (latitude: number | null, longitude: number | null): ShopPresence =>
  latitude != null && longitude != null ? 'physical' : 'online';

const venueKind = (activityType: string): 'hiking' | 'camping' | 'event' => {
  const kind = activityType.toLowerCase();
  if (kind === 'camping') return 'camping';
  if (kind === 'event' || kind === 'community_activity') return 'event';
  return 'hiking';
};

const isRideshareActivity = (activity: ActivityDTO): boolean =>
  activity.activityType === 'rideshare';

const resolveFromCoords = (
  activity: ActivityDTO,
  location?: Pick<Location, 'latitude' | 'longitude'> | null
): { latitude: number; longitude: number } | null => {
  const latitude =
    activity.displayLatitude ??
    activity.meetingLat ??
    activity.startLat ??
    activity.parkingLat ??
    activity.locationLatitude ??
    location?.latitude ??
    null;
  const longitude =
    activity.displayLongitude ??
    activity.meetingLng ??
    activity.startLng ??
    activity.parkingLng ??
    activity.locationLongitude ??
    location?.longitude ??
    null;

  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
};

const resolveToCoords = (activity: ActivityDTO): { latitude: number; longitude: number } | null => {
  if (activity.startLat == null || activity.startLng == null) return null;
  return { latitude: activity.startLat, longitude: activity.startLng };
};

/** Link rides ↔ parent plans on explore payload (badges, peek, bidirectional navigation). */
const attachLinkedRideshareMetadata = (items: ExploreMapItemDTO[]): void => {
  const byParent = new Map<string, ExploreMapItemDTO['linkedRideshareActivities']>();

  for (const item of items) {
    if (item.source !== 'activity' || item.kind !== 'rideshare') continue;
    const parentId = item.activity?.linkedActivityId;
    const activityId = item.activity?.id;
    if (!parentId || !activityId) continue;

    const row = {
      activityId,
      exploreItemId: item.id,
      title: item.title,
      path: item.path,
      subtitle: item.subtitle ?? null,
    };
    const bucket = byParent.get(parentId) ?? [];
    bucket.push(row);
    byParent.set(parentId, bucket);
  }

  for (const item of items) {
    if (item.source !== 'activity' || item.kind === 'rideshare') continue;
    const parentId = item.activity?.id;
    if (!parentId) continue;

    const linked = byParent.get(parentId);
    if (!linked?.length) continue;

    item.linkedRideshareActivities = linked;
    item.rideshareEnabled = true;
  }

  for (const item of items) {
    if (item.source !== 'activity' || item.kind !== 'rideshare' || !item.activity) continue;
    const parentId = item.activity.linkedActivityId;
    if (!parentId) continue;
    const parentItem = items.find((entry) => entry.activity?.id === parentId);
    if (!parentItem?.activity) continue;
    item.activity = {
      ...item.activity,
      linkedParentActivity: {
        id: parentItem.activity.id,
        title: parentItem.title,
        activityType: parentItem.activity.activityType,
      },
    };
  }
};

export const buildExploreMapPayload = async (): Promise<{ items: ExploreMapItemDTO[] }> => {
  const now = Date.now();
  const memoryCached = readExploreMapMemoryCache<{ items: ExploreMapItemDTO[] }>(now);
  if (memoryCached) {
    return memoryCached;
  }

  const redis = await getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(EXPLORE_MAP_REDIS_KEY);
      if (cached) {
        const payload = JSON.parse(cached) as { items: ExploreMapItemDTO[] };
        writeExploreMapMemoryCache(payload, now);
        return payload;
      }
    } catch {
      /* fall through to rebuild */
    }
  }

  const payload = await buildExploreMapPayloadUncached();
  writeExploreMapMemoryCache(payload, now);

  if (redis) {
    try {
      await redis.setEx(EXPLORE_MAP_REDIS_KEY, EXPLORE_MAP_CACHE_TTL_SEC, JSON.stringify(payload));
    } catch {
      /* non-fatal */
    }
  }

  return payload;
};

const attachExploreItemArea = (
  item: ExploreMapItemDTO,
  areaId: string | null | undefined,
  areaSlugById: Map<string, string>
): ExploreMapItemDTO => {
  if (!areaId) return item;
  return { ...item, areaId, areaSlug: areaSlugById.get(areaId) ?? null };
};

const buildExploreMapPayloadUncached = async (): Promise<{ items: ExploreMapItemDTO[] }> => {
  const [activityEvents, locationsResult, shopTenants, demandItems, publishedAreas] = await Promise.all([
    listPublishedActivitiesForExploreMap(250),
    listActiveLocations({ page: 1, pageSize: 1200 }),
    listPublicShopTenantsForExplore(250),
    listActiveParticipantIntentsForMap(200),
    listPublishedAreas(),
  ]);

  const areaSlugById = new Map(publishedAreas.map((area) => [area.id, area.slug]));
  const merchantByTenantId = await findMerchantProfilesByTenantIds(shopTenants.map((shop) => shop.id));

  const activityDtos = activityEvents.map((event) => buildActivityDto(event));
  const items: ExploreMapItemDTO[] = [];

  for (let index = 0; index < activityDtos.length; index += 1) {
    const activity = activityDtos[index];
    const event = activityEvents[index];
    const activityMode = event.activityMode === 'seeking' ? 'seeking' : 'hosted';
    if (resolveJoinMode(event.joinMode, event.requirements) === 'private') continue;
    const rideshare = isRideshareActivity(activity);
    const hikingDual =
      !rideshare &&
      activity.meetingDifferent === true &&
      activity.startLat != null &&
      activity.startLng != null &&
      activity.meetingLat != null &&
      activity.meetingLng != null;
    const fromCoords = hikingDual
      ? { latitude: activity.startLat as number, longitude: activity.startLng as number }
      : resolveFromCoords(activity, event.location);
    const toCoords = rideshare
      ? resolveToCoords(activity)
      : hikingDual
        ? { latitude: activity.meetingLat as number, longitude: activity.meetingLng as number }
        : null;
    const display = buildExploreActivityDisplay(activity);
    items.push(
      attachExploreItemArea(
        {
      id: `activity:${activity.id}`,
      kind: rideshare ? 'rideshare' : activity.activityType,
      source: 'activity',
      activityMode,
      title: activity.title,
      subtitle: rideshare
        ? [display.fromLabel, display.toLabel].filter(Boolean).join(' → ') || activity.locationName
        : activity.locationName,
      latitude: fromCoords?.latitude ?? null,
      longitude: fromCoords?.longitude ?? null,
      toLatitude: toCoords?.latitude ?? null,
      toLongitude: toCoords?.longitude ?? null,
      path: resolveEntityPath({ kind: 'activity', id: activity.id }),
      featuredPerson: buildExploreFeaturedPerson({
        userId: resolveActivityHostUserId(activity),
        displayName: resolveActivityHostDisplayName(activity),
        avatarUrl: resolveActivityHostAvatar(activity),
        role: activityMode === 'seeking' ? 'requester' : 'host',
      }),
      ...(activityMode === 'seeking' && event.participantIntentId
        ? {
            participantIntentId: event.participantIntentId,
            requesterUserId: resolveActivityHostUserId(activity),
          }
        : {}),
      hostName: activity.hostName ?? null,
      hostAvatar: resolveActivityHostAvatar(activity),
      date: activity.date,
      time: activity.time,
      slotsAvailable: activity.slotsAvailable,
      slotsTotal: activity.slotsTotal,
      participantPreviews: activity.participantPreviews,
      image: activity.images?.[0] ?? activity.bannerUrl ?? null,
      rideshareEnabled: rideshare || Boolean(activity.rideshareEnabled),
      priceLabel: display.priceLabel,
      priceDisplay: display.priceDisplay,
      fromLabel: display.fromLabel,
      toLabel: display.toLabel,
      activity
    },
        activity.areaId,
        areaSlugById
      )
    );
  }

  for (const location of locationsResult.items) {
    if (String(location.activityType).toUpperCase() === 'RIDESHARE') continue;

    const dto = toLocationDto(location);
    if (dto.activityType === 'shop') {
      const latitude = dto.latitude ?? null;
      const longitude = dto.longitude ?? null;
      if (
        latitude != null &&
        longitude != null &&
        !isWithinUaeFocusArea(latitude, longitude)
      ) {
        continue;
      }

      items.push(
        attachExploreItemArea(
          {
            id: `venue:${dto.id}`,
            kind: 'shop',
            source: 'venue',
            title: dto.name,
            subtitle: dto.region ?? null,
            latitude,
            longitude,
            path: placeDetailPath(dto.activityType, dto.id),
            image: dto.images?.[0] ?? null,
            about: dto.description,
          },
          dto.areaId,
          areaSlugById
        )
      );
      continue;
    }

    const kind = venueKind(dto.activityType);
    if (kind !== 'hiking' && kind !== 'camping') continue;

    const latitude = dto.latitude ?? null;
    const longitude = dto.longitude ?? null;
    if (
      latitude != null &&
      longitude != null &&
      !isWithinUaeFocusArea(latitude, longitude)
    ) {
      continue;
    }

    const venueLabels = resolveVenueExploreLabels(
      dto.name,
      location.tags,
      dto.region,
      location.areaLabel ?? dto.areaLabel ?? null
    );

    items.push(
      attachExploreItemArea(
        {
      id: `venue:${dto.id}`,
      kind,
      source: 'venue',
      title: venueLabels.title,
      subtitle: venueLabels.subtitle,
      latitude,
      longitude,
      path: placeDetailPath(dto.activityType, dto.id),
      image: dto.images?.[0] ?? null,
      about: dto.description,
      locationCard: {
        id: dto.id,
        activityType: kind,
        region: dto.region,
        description: dto.description,
        difficulty: dto.difficulty,
        distance: dto.distance,
        duration: dto.duration,
        elevation: dto.elevation,
        childFriendly: dto.childFriendly,
        accessibility: dto.accessibility,
        campingType: dto.campingType,
        maxGroupSize: dto.maxGroupSize,
        season: dto.season ?? [],
        surfaceType: dto.surfaceType ?? [],
        images: dto.images ?? [],
        featured: dto.featured,
        parkingLat: dto.parkingLat ?? null,
        parkingLng: dto.parkingLng ?? null,
        parkingPoint: location.parkingLink ?? null,
      },
    },
        dto.areaId,
        areaSlugById
      )
    );
  }

  const ownerDisplays = await loadMerchantOwnerDisplaysByAdminIds(
    shopTenants.filter((shop) => shop.ownerId).map((shop) => [shop.ownerId])
  );

  for (const shop of shopTenants) {
    const merchant = merchantByTenantId.get(shop.id) ?? null;
    const owner = shop.ownerId ? ownerDisplays.get(shop.ownerId) ?? null : null;
    const latitude = shop.latitude ?? merchant?.latitude ?? null;
    const longitude = shop.longitude ?? merchant?.longitude ?? null;
    const shopPresence = resolveShopPresence(latitude, longitude);
    const websiteUrl = shop.website ?? merchant?.websiteUrl ?? null;

    if (shopPresence === 'online' && !websiteUrl && !merchant?.description && !shop.description) continue;

    items.push({
      id: `shop:${shop.id}`,
      kind: 'shop',
      source: 'shop',
      title: merchant?.shopName ?? shop.name,
      subtitle: shopPresence === 'online' ? 'Online partner' : shop.region ?? merchant?.region ?? null,
      about: merchant?.description ?? shop.description ?? null,
      latitude,
      longitude,
      path: shopPublicPath({ merchantId: merchant?.id, slug: shop.slug }, EXPLORE_SHOPS_LIST_PATH),
      image: shop.logoUrl ?? merchant?.logo ?? null,
      merchantId: merchant?.id,
      tenantId: shop.id,
      websiteUrl,
      contactPhone: merchant?.contactPhone ?? null,
      shopPresence,
      discoverFeatured: shop.discoverFeatured ?? false,
      featuredPerson: buildExploreFeaturedPerson({
        userId: owner?.userId,
        displayName: owner?.name,
        avatarUrl: owner?.avatarUrl,
        role: 'contact',
      }),
      hostName: owner?.name ?? null,
      hostAvatar: owner?.avatarUrl ?? null,
      requesterUserId: owner?.userId ?? null,
    });
  }

  items.push(
    ...demandItems.map((item) => attachExploreItemArea(item, item.areaId, areaSlugById))
  );

  attachLinkedRideshareMetadata(items);

  for (const item of items) {
    if (item.source === 'activity' && item.activity) {
      Object.assign(
        item,
        { activityMode: item.activityMode ?? 'hosted' },
        buildExploreMapPlanProjection({
          source: 'activity',
          mapKind: exploreMapKindToPlanMapKind(item.kind),
          participationMode: resolveParticipationMode(
            item.activity.participationMode,
            item.activity.requirements
          ),
          storedOutingCategory: item.activity.outingCategory ?? null,
          storedOutingTopic: resolveActivityOutingTopic(
            item.activity.outingTopic,
            item.activity.requirements
          ),
        })
      );
      continue;
    }
    if (item.source === 'venue' || item.source === 'shop') {
      Object.assign(
        item,
        buildExploreMapPlanProjection({
          source: item.source,
          mapKind: exploreMapKindToPlanMapKind(item.kind),
        })
      );
    }
  }

  const locationIds = items
    .filter((item) => item.source === 'venue')
    .map((item) => item.locationCard?.id ?? item.id.replace(/^venue:/, ''));
  const tenantIds = items
    .filter((item) => item.source === 'shop')
    .map((item) => item.tenantId ?? item.id.replace(/^shop:/, ''));

  const [locationStats, tenantStats] = await Promise.all([
    getReviewStatsByTargets(ReviewTargetType.LOCATION, locationIds),
    getReviewStatsByTargets(ReviewTargetType.TENANT, tenantIds),
  ]);

  for (const item of items) {
    item.presentation = buildExploreCardPresentation(item);
    if (item.source === 'venue') {
      const id = item.locationCard?.id ?? item.id.replace(/^venue:/, '');
      const stat = locationStats.get(id);
      if (stat) {
        item.averageRating = stat.averageRating;
        item.reviewCount = stat.reviewCount;
      }
      continue;
    }
    if (item.source === 'shop') {
      const id = item.tenantId ?? item.id.replace(/^shop:/, '');
      const stat = tenantStats.get(id);
      if (stat) {
        item.averageRating = stat.averageRating;
        item.reviewCount = stat.reviewCount;
      }
    }
  }

  return { items };
};
