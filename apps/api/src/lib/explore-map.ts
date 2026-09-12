import type { ActivityDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  buildExploreCardPresentation,
  buildExploreFeaturedPerson,
  resolveActivityHostAvatar,
  resolveActivityHostDisplayName,
  resolveActivityHostUserId,
} from '@uaetrail/shared-types';
import type { Location } from '../domain/types.js';
import { resolveJoinMode } from '../domain/activity-join-mode.js';
import { listPublishedActivitiesForExploreMap } from './activities-store.js';
import { listActiveLocations } from './location-query.js';
import { buildActivityDto, toLocationDto } from './mappers.js';
import { buildExploreActivityDisplay } from './explore-display.js';
import { findMerchantProfilesByUserIds, listPublicMerchantsForMap, loadMerchantOwnerDisplaysByAdminIds } from './shop-store.js';
import { listPublicAgenciesForMap, listPublicShopsForMap } from './tenant-store.js';
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

export { invalidateExploreMapCache };

const venuePath = (activityType: string, id: string): string => {
  const kind = activityType.toLowerCase();
  if (kind === 'camping') return `/camp/${id}`;
  if (kind === 'event' || kind === 'community_activity') return `/event/${id}`;
  return `/trail/${id}`;
};

const venueKind = (activityType: string): 'hiking' | 'camping' | 'event' => {
  const kind = activityType.toLowerCase();
  if (kind === 'camping') return 'camping';
  if (kind === 'event' || kind === 'community_activity') return 'event';
  return 'hiking';
};

const isCarpoolActivity = (activity: ActivityDTO): boolean =>
  activity.activityType === 'carpool';

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

const buildExploreMapPayloadUncached = async (): Promise<{ items: ExploreMapItemDTO[] }> => {
  const [activityEvents, locationsResult, merchants, agencies, shopTenants, demandItems] = await Promise.all([
    listPublishedActivitiesForExploreMap(250),
    listActiveLocations({ page: 1, pageSize: 250 }),
    listPublicMerchantsForMap(),
    listPublicAgenciesForMap(250),
    listPublicShopsForMap(250),
    listActiveParticipantIntentsForMap(200)
  ]);

  const activityDtos = activityEvents.map((event) => buildActivityDto(event));
  const items: ExploreMapItemDTO[] = [];

  for (let index = 0; index < activityDtos.length; index += 1) {
    const activity = activityDtos[index];
    const event = activityEvents[index];
    if (resolveJoinMode(event.joinMode, event.requirements) === 'private') continue;
    const carpool = isCarpoolActivity(activity);
    const fromCoords = resolveFromCoords(activity, event.location);
    const toCoords = carpool ? resolveToCoords(activity) : null;
    const display = buildExploreActivityDisplay(activity);
    items.push({
      id: `activity:${activity.id}`,
      kind: carpool ? 'carpool' : activity.activityType,
      source: 'activity',
      title: activity.title,
      subtitle: carpool
        ? [display.fromLabel, display.toLabel].filter(Boolean).join(' → ') || activity.locationName
        : activity.locationName,
      latitude: fromCoords?.latitude ?? null,
      longitude: fromCoords?.longitude ?? null,
      toLatitude: toCoords?.latitude ?? null,
      toLongitude: toCoords?.longitude ?? null,
      path: `/activity/${activity.id}`,
      featuredPerson: buildExploreFeaturedPerson({
        userId: resolveActivityHostUserId(activity),
        displayName: resolveActivityHostDisplayName(activity),
        avatarUrl: resolveActivityHostAvatar(activity),
        role: 'host',
      }),
      hostName: activity.hostName ?? null,
      hostAvatar: resolveActivityHostAvatar(activity),
      date: activity.date,
      time: activity.time,
      slotsAvailable: activity.slotsAvailable,
      slotsTotal: activity.slotsTotal,
      participantPreviews: activity.participantPreviews,
      image: activity.images?.[0] ?? activity.bannerUrl ?? null,
      carPoolEnabled: carpool,
      priceLabel: display.priceLabel,
      priceDisplay: display.priceDisplay,
      fromLabel: display.fromLabel,
      toLabel: display.toLabel,
      activity
    });
  }

  for (const location of locationsResult.items) {
    if (String(location.activityType).toUpperCase() === 'CARPOOL') continue;

    const dto = toLocationDto(location);
    const kind = venueKind(dto.activityType);
    const latitude = dto.latitude ?? null;
    const longitude = dto.longitude ?? null;

    items.push({
      id: `venue:${dto.id}`,
      kind,
      source: 'venue',
      title: dto.name,
      subtitle: dto.region,
      latitude,
      longitude,
      path: venuePath(dto.activityType, dto.id),
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
      },
    });
  }

  const ownerDisplays = await loadMerchantOwnerDisplaysByAdminIds([
    ...merchants
      .map(({ merchant }) => merchant.adminIds)
      .filter((ids): ids is string[] => Array.isArray(ids) && ids.length > 0),
    ...shopTenants.filter((shop) => shop.ownerId).map((shop) => [shop.ownerId!]),
  ]);
  const merchantByOwnerId = await findMerchantProfilesByUserIds(shopTenants.map((shop) => shop.ownerId));

  for (const shop of shopTenants) {
    if (shop.latitude == null || shop.longitude == null) continue;
    const merchant = shop.ownerId ? merchantByOwnerId.get(shop.ownerId) ?? null : null;
    const owner = shop.ownerId ? ownerDisplays.get(shop.ownerId) ?? null : null;
    items.push({
      id: `shop:${merchant?.id ?? shop.id}`,
      kind: 'shop',
      source: 'shop',
      title: shop.name,
      subtitle: shop.region ?? null,
      about: merchant?.description ?? shop.description ?? null,
      latitude: shop.latitude,
      longitude: shop.longitude,
      path: merchant ? `/merchant/${merchant.id}` : `/operator/${shop.slug}`,
      image: shop.logoUrl ?? merchant?.logo ?? null,
      merchantId: merchant?.id,
      tenantId: shop.id,
      websiteUrl: shop.website ?? null,
      contactPhone: merchant?.contactPhone ?? null,
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

  for (const { merchant, products } of merchants) {
    if (products.length === 0) continue;
    if (items.some((item) => item.merchantId === merchant.id)) continue;
    const owner = ownerDisplays.get(merchant.adminIds?.[0] ?? '') ?? null;
    items.push({
      id: `shop:${merchant.id}`,
      kind: 'shop',
      source: 'shop',
      title: merchant.shopName,
      subtitle: merchant.region ?? null,
      about: merchant.description ?? null,
      latitude: merchant.latitude,
      longitude: merchant.longitude,
      path: `/merchant/${merchant.id}`,
      image: merchant.logo ?? products[0]?.images[0] ?? null,
      merchantId: merchant.id,
      productId: products[0]?.id,
      priceAed: products[0]?.priceAed ?? null,
      contactPhone: merchant.contactPhone ?? null,
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

    // Product catalogue pins deferred — one shop pin per merchant; catalogue comes later.
  }

  for (const agency of agencies) {
    if (agency.latitude == null || agency.longitude == null) continue;
    items.push({
      id: `agency:${agency.id}`,
      kind: 'agency',
      source: 'agency',
      title: agency.name,
      subtitle: agency.region ?? agency.services ?? 'Tour agency',
      latitude: agency.latitude,
      longitude: agency.longitude,
      path: `/operator/${agency.slug}`,
      image: agency.logoUrl ?? null,
      websiteUrl: agency.website ?? null,
      tenantId: agency.id,
    });
  }

  items.push(...demandItems);

  const locationIds = items
    .filter((item) => item.source === 'venue')
    .map((item) => item.locationCard?.id ?? item.id.replace(/^venue:/, ''));
  const tenantIds = items
    .filter((item) => item.source === 'shop' || item.source === 'agency')
    .map((item) => item.tenantId ?? item.id.replace(/^(shop|agency):/, ''));

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
    if (item.source === 'shop' || item.source === 'agency') {
      const id = item.tenantId ?? item.id.replace(/^(shop|agency):/, '');
      const stat = tenantStats.get(id);
      if (stat) {
        item.averageRating = stat.averageRating;
        item.reviewCount = stat.reviewCount;
      }
    }
  }

  return { items };
};
