import type { ActivityDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { Location } from '../domain/types.js';
import { listPublishedActivitiesForExploreMap } from './activities-store.js';
import { listActiveLocations } from './location-query.js';
import { buildActivityDto, toLocationDto } from './mappers.js';
import { buildExploreActivityDisplay } from './explore-display.js';
import { findMerchantProfileByUserId, listPublicMerchantsForMap } from './shop-store.js';
import { listPublicAgenciesForMap, listPublicShopsForMap } from './tenant-store.js';
import { listActiveParticipantIntentsForMap } from './participant-intents-store.js';

const venuePath = (activityType: string, id: string): string => {
  const kind = activityType.toLowerCase();
  if (kind === 'camping') return `/camp/${id}`;
  if (kind === 'event' || kind === 'community_activity') return `/event-spot/${id}`;
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
    activity.meetingLat ??
    activity.startLat ??
    activity.parkingLat ??
    activity.locationLatitude ??
    location?.latitude ??
    null;
  const longitude =
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
  const [activityEvents, locationsResult, merchants, agencies, shopTenants, demandItems] = await Promise.all([
    listPublishedActivitiesForExploreMap(250),
    listActiveLocations({ page: 1, pageSize: 250 }),
    listPublicMerchantsForMap(),
    listPublicAgenciesForMap(250),
    listPublicShopsForMap(250),
    listActiveParticipantIntentsForMap(200)
  ]);

  const activityDtos = activityEvents.map((event) => buildActivityDto(event));
  const activityCoordsByLocationId = new Map<string, { latitude: number; longitude: number }>();
  const locationIdsWithActivities = new Set<string>();

  for (let index = 0; index < activityEvents.length; index += 1) {
    const event = activityEvents[index];
    const activity = activityDtos[index];
    const coords = resolveFromCoords(activity, event.location);
    if (coords && event.locationId) {
      activityCoordsByLocationId.set(event.locationId, coords);
      locationIdsWithActivities.add(event.locationId);
    }
  }

  const items: ExploreMapItemDTO[] = [];

  for (let index = 0; index < activityDtos.length; index += 1) {
    const activity = activityDtos[index];
    const event = activityEvents[index];
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
      hostName: activity.hostName ?? activity.organizerName ?? null,
      hostAvatar: activity.hostAvatar ?? activity.organizerAvatar ?? null,
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
    if (locationIdsWithActivities.has(location.id)) continue;
    if (String(location.activityType).toUpperCase() === 'CARPOOL') continue;

    const dto = toLocationDto(location);
    const kind = venueKind(dto.activityType);
    let latitude = dto.latitude ?? null;
    let longitude = dto.longitude ?? null;

    const activityCoords = activityCoordsByLocationId.get(location.id);

    if (
      activityCoords &&
      latitude != null &&
      longitude != null &&
      Math.abs(latitude - activityCoords.latitude) < 0.0001 &&
      Math.abs(longitude - activityCoords.longitude) < 0.0001
    ) {
      latitude += 0.004;
      longitude += 0.003;
    }

    items.push({
      id: `venue:${dto.id}`,
      kind,
      source: 'venue',
      title: dto.name,
      subtitle: dto.region,
      latitude,
      longitude,
      path: venuePath(dto.activityType, dto.id),
      image: dto.images?.[0] ?? null
    });
  }

  for (const shop of shopTenants) {
    if (shop.latitude == null || shop.longitude == null) continue;
    const merchant = await findMerchantProfileByUserId(shop.ownerId);
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
      websiteUrl: shop.website ?? null,
      contactPhone: merchant?.contactPhone ?? null
    });
  }

  for (const { merchant, products } of merchants) {
    if (products.length === 0) continue;
    if (items.some((item) => item.merchantId === merchant.id)) continue;
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
      contactPhone: merchant.contactPhone ?? null
    });

    for (const product of products) {
      items.push({
        id: `product:${product.id}`,
        kind: 'shop',
        source: 'shop',
        title: product.name,
        subtitle: merchant.shopName,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        path: `/product/${product.id}`,
        image: product.images[0] ?? merchant.logo ?? null,
        merchantId: merchant.id,
        productId: product.id,
        priceAed: product.priceAed
      });
    }
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
    });
  }

  items.push(...demandItems);

  return { items };
};
