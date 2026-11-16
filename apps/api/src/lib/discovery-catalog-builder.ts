import type { ActivityDTO, ExploreMapItemDTO, PlaceKind, ShopPresence } from '@uaetrail/shared-types';
import {
  amenityChipLabelForFacilityKind,
  buildDiscoveryCardPresentation,
  buildExploreFeaturedPerson,
  buildExploreMapPlanProjection,
  FACILITY_MAP_SOURCE,
  PLACE_MAP_SOURCE,
  exploreMapKindToPlanMapKind,
  isGeographyMapSource,
  isPlaceMapSource,
  type ExploreMapPlanSource,
  EXPLORE_SHOPS_LIST_PATH,
  exploreMapPeekPath,
  isFacilityPlaceKind,
  PLACE_KIND_LABELS,
  readVenueAmenityChipLabels,
  facilityDetailPath,
  placeDetailPath,
  placeKindFromLocationRow,
  resolveActivityHostAvatar,
  resolveActivityHeadlinePersonName,
  resolveActivityHostUserId,
  resolveEntityPath,
  resolveActivityOutingTopic,
  resolveParticipationMode,
  shopPublicPath,
} from '@uaetrail/shared-types';
import type { Facility } from '../domain/facility.js';
import type { Location } from '../domain/types.js';
import { resolveJoinMode } from '../domain/activity-join-mode.js';
import { listPublishedActivitiesForExploreMap } from './activities-store.js';
import { listActiveLocationsForExploreMap } from './location-query.js';
import { buildActivityDto, toLocationDto } from './mappers.js';
import { buildExploreActivityDisplay } from './explore-display.js';
import {
  findMerchantProfilesByTenantIds,
  loadMerchantOwnerDisplaysByAdminIds,
} from './shop-store.js';
import { listPublicShopTenantsForExplore } from './tenant-store.js';
import { getReviewStatsByTargets } from './social-reviews-store.js';
import { ReviewTargetType } from '../domain/enums.js';
import { resolveVenueExploreLabels } from './venue-display-names.js';
import { isWithinUaeFocusArea } from './uae-bbox.js';
import { listPublishedAreas } from './areas-store.js';
import { buildAvailabilityFixedMapItems } from './availability-fixed-map-items.js';
import { listFacilitiesForExploreMap } from './facilities-store.js';
import { resolveAreaIdFromPoint } from './area-resolution.js';
import { overlayCatalogDefaultsOnLocation } from './venue-catalog.js';

const catalogTimestampIso = (
  ...candidates: Array<Date | string | null | undefined>
): string | undefined => {
  for (const candidate of candidates) {
    if (candidate == null) continue;
    if (candidate instanceof Date) {
      if (Number.isFinite(candidate.getTime())) return candidate.toISOString();
      continue;
    }
    if (typeof candidate === 'string' && candidate.trim()) {
      const ms = Date.parse(candidate);
      if (Number.isFinite(ms)) return new Date(ms).toISOString();
    }
  }
  return undefined;
};

const catalogPostedAtField = (
  ...candidates: Array<Date | string | null | undefined>
): Pick<ExploreMapItemDTO, 'catalogPostedAt'> | Record<string, never> => {
  const catalogPostedAt = catalogTimestampIso(...candidates);
  return catalogPostedAt ? { catalogPostedAt } : {};
};

const catalogUpdatedAtField = (
  ...candidates: Array<Date | string | null | undefined>
): Pick<ExploreMapItemDTO, 'catalogUpdatedAt'> | Record<string, never> => {
  const catalogUpdatedAt = catalogTimestampIso(...candidates);
  return catalogUpdatedAt ? { catalogUpdatedAt } : {};
};

type ParentAmenityRollup = { labels: string[]; kinds: PlaceKind[] };

/** Amenities belong on the parent trail/camp — not as first-class list cards. */
const collectParentPlaceAmenities = (facilities: Facility[]): Map<string, ParentAmenityRollup> => {
  const byParent = new Map<string, ParentAmenityRollup>();
  for (const facility of facilities) {
    const parentId = facility.parentPlaceId?.trim();
    if (!parentId) continue;
    const kind = facility.facilityKind;
    const label = amenityChipLabelForFacilityKind(kind);
    if (!label) continue;
    const current = byParent.get(parentId) ?? { labels: [], kinds: [] };
    if (!current.kinds.includes(kind)) current.kinds.push(kind);
    if (!current.labels.includes(label)) current.labels.push(label);
    byParent.set(parentId, current);
  }
  return byParent;
};

const resolveLocationAmenities = (
  tags: string[] | undefined,
  placeId: string,
  byParent: Map<string, ParentAmenityRollup>
): { amenityLabels: string[]; amenityKinds: PlaceKind[] } => {
  const fromTags = readVenueAmenityChipLabels(tags);
  const fromParent = byParent.get(placeId);
  return {
    amenityLabels: [...new Set([...fromTags, ...(fromParent?.labels ?? [])])],
    amenityKinds: [...(fromParent?.kinds ?? [])],
  };
};

const resolveShopPresence = (latitude: number | null, longitude: number | null): ShopPresence =>
  latitude != null && longitude != null ? 'physical' : 'online';

/** Map place kind. Wire `hiking` is a trail in product copy (`/trail/:id`). */
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
        date: parentItem.activity.date,
        time: parentItem.activity.time,
        endDate: parentItem.activity.endDate ?? null,
        endTime: parentItem.activity.endTime ?? null,
        description: parentItem.activity.description?.trim()
          ? parentItem.activity.description.trim().slice(0, 220)
          : null,
      },
    };
  }
};

const attachExploreItemArea = (
  item: ExploreMapItemDTO,
  areaId: string | null | undefined,
  areaSlugById: Map<string, string>,
  areaNameById: Map<string, string>,
  fallbackAreaLabel?: string | null
): ExploreMapItemDTO => {
  const label = fallbackAreaLabel?.trim() || null;
  if (!areaId && !label) return item;
  const slug = areaId ? areaSlugById.get(areaId) ?? null : null;
  const hubName = areaId ? areaNameById.get(areaId) ?? null : null;
  return {
    ...item,
    areaId: areaId ?? null,
    areaSlug: slug,
    areaName: hubName ?? label,
    geoRef: item.geoRef ?? item.activity?.geoRef ?? null,
  };
};

/** Shared catalog assembly (cacheable). Viewer access is applied in `explore-map-viewer-access.ts`. */
/** Assemble hosted activities, catalog geography, shops, and fixed availability for `GET /explore/map`. */
export const buildDiscoveryCatalogMapPayload = async (): Promise<{ items: ExploreMapItemDTO[] }> => {
  const [activityEvents, locationsResult, facilityRows, shopTenants, publishedAreas] =
    await Promise.all([
      listPublishedActivitiesForExploreMap(250),
      listActiveLocationsForExploreMap(800),
      listFacilitiesForExploreMap(800),
      listPublicShopTenantsForExplore(250),
      listPublishedAreas(),
    ]);

  const amenitiesByParentId = collectParentPlaceAmenities(facilityRows);
  const areaSlugById = new Map(publishedAreas.map((area) => [area.id, area.slug]));
  const areaNameById = new Map(publishedAreas.map((area) => [area.id, area.name]));
  const availabilityItemsPromise = buildAvailabilityFixedMapItems({
    areaSlugById,
    areaNameById,
  });
  const merchantByTenantId = await findMerchantProfilesByTenantIds(shopTenants.map((shop) => shop.id));

  const activityDtos = activityEvents.map((event) => buildActivityDto(event));
  const items: ExploreMapItemDTO[] = [];

  for (let index = 0; index < activityDtos.length; index += 1) {
    const activity = activityDtos[index];
    const event = activityEvents[index];
    if (event.activityMode === 'seeking') continue;
    const activityMode = 'hosted';
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
    const pinLatitude =
      fromCoords?.latitude ??
      activity.displayLatitude ??
      activity.locationLatitude ??
      event.location?.latitude ??
      null;
    const pinLongitude =
      fromCoords?.longitude ??
      activity.displayLongitude ??
      activity.locationLongitude ??
      event.location?.longitude ??
      null;
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
          latitude: pinLatitude,
          longitude: pinLongitude,
          toLatitude: toCoords?.latitude ?? null,
          toLongitude: toCoords?.longitude ?? null,
          path: resolveEntityPath({ kind: 'activity', id: activity.id }),
          featuredPerson: buildExploreFeaturedPerson({
            userId: resolveActivityHostUserId(activity),
            displayName: resolveActivityHeadlinePersonName({
              publishingProfileKind: activity.publishingProfileKind,
              tenantName: activity.tenantName,
              hostName: activity.hostName,
              createdByName: activity.createdByName,
            }),
            avatarUrl: resolveActivityHostAvatar(activity),
            role: 'host',
          }),
          hostName: activity.hostName ?? null,
          hostAvatar: resolveActivityHostAvatar(activity),
          date: activity.date,
          time: activity.time,
          endDate: activity.endDate ?? null,
          endTime: activity.endTime ?? null,
          slotsAvailable: activity.slotsAvailable,
          slotsTotal: activity.slotsTotal,
          participantPreviews: activity.participantPreviews,
          image: activity.images?.[0] ?? activity.bannerUrl ?? null,
          rideshareEnabled: rideshare || Boolean(activity.rideshareEnabled),
          priceLabel: display.priceLabel,
          priceDisplay: display.priceDisplay,
          fromLabel: display.fromLabel,
          toLabel: display.toLabel,
          activity,
          groupRegionLevels: activity.groupRegionLevels ?? null,
          ...catalogPostedAtField(event.publishedAt, event.createdAt),
        },
        event.location?.areaId ?? activity.areaId,
        areaSlugById,
        areaNameById
      )
    );
  }

  for (const location of locationsResult.items) {
    if (String(location.activityType).toUpperCase() === 'RIDESHARE') continue;

    const catalogLocation = overlayCatalogDefaultsOnLocation(location);
    const dto = toLocationDto(catalogLocation);
    if (!dto.images?.[0]?.trim()) continue;
    const catalogAreaLabel = catalogLocation.areaLabel ?? dto.areaLabel ?? null;
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
            source: PLACE_MAP_SOURCE,
            title: dto.name,
            subtitle: dto.region ?? null,
            groupRegionLevels: dto.groupRegionLevels ?? null,
            latitude,
            longitude,
            path: exploreMapPeekPath(`venue:${dto.id}`, 'shops'),
            image: dto.images?.[0] ?? null,
            about: dto.description,
            catalogProfileExposure: 'peek',
            geoRef: dto.geoRef ?? null,
            ...catalogUpdatedAtField(catalogLocation.updatedAt, catalogLocation.createdAt),
          },
          dto.areaId,
          areaSlugById,
          areaNameById,
          catalogAreaLabel
        )
      );
      continue;
    }

    const catalogPlaceKind = placeKindFromLocationRow({
      activityType: dto.activityType,
      tags: catalogLocation.tags,
    });

    const latitude = dto.latitude ?? null;
    const longitude = dto.longitude ?? null;
    if (
      latitude != null &&
      longitude != null &&
      !isWithinUaeFocusArea(latitude, longitude)
    ) {
      continue;
    }

    if (isFacilityPlaceKind(catalogPlaceKind)) {
      // CPC-5: amenity pins come from `facilities` collection (legacy `locations` rows skipped).
      continue;
    }

    if (catalogPlaceKind === 'outdoor_other') {
      if (latitude == null || longitude == null) continue;
      items.push(
        attachExploreItemArea(
          {
            id: `venue:${dto.id}`,
            kind: 'event',
            source: PLACE_MAP_SOURCE,
            title: dto.name,
            subtitle: PLACE_KIND_LABELS.outdoor_other,
            latitude,
            longitude,
            path: placeDetailPath('event', dto.id),
            image: dto.images?.[0] ?? null,
            about: dto.description,
            placeKind: 'outdoor_other',
            geoRef: dto.geoRef ?? null,
            locationCard: {
              id: dto.id,
              activityType: 'event',
              region: dto.region,
              groupRegionLevels: dto.groupRegionLevels ?? null,
              description: dto.description,
              childFriendly: dto.childFriendly,
              season: dto.season ?? [],
              images: dto.images ?? [],
              featured: dto.featured,
              ...resolveLocationAmenities(catalogLocation.tags, dto.id, amenitiesByParentId),
            },
            ...catalogUpdatedAtField(catalogLocation.updatedAt, catalogLocation.createdAt),
          },
          dto.areaId,
          areaSlugById,
          areaNameById,
          catalogAreaLabel
        )
      );
      continue;
    }

    const kind = venueKind(dto.activityType);
    if (kind !== 'hiking' && kind !== 'camping') continue;

    const venueLabels = resolveVenueExploreLabels(
      dto.name,
      catalogLocation.tags,
      dto.region,
      catalogAreaLabel
    );

    items.push(
      attachExploreItemArea(
        {
          id: `venue:${dto.id}`,
          kind,
          source: PLACE_MAP_SOURCE,
          title: venueLabels.title,
          subtitle: venueLabels.subtitle,
          latitude,
          longitude,
          path: placeDetailPath(dto.activityType, dto.id),
          image: dto.images?.[0] ?? null,
          about: dto.description,
          geoRef: dto.geoRef ?? null,
          locationCard: {
            id: dto.id,
            activityType: kind,
            region: dto.region,
            groupRegionLevels: dto.groupRegionLevels ?? null,
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
            parkingPoint: catalogLocation.parkingLink ?? null,
            ...resolveLocationAmenities(catalogLocation.tags, dto.id, amenitiesByParentId),
          },
          ...catalogUpdatedAtField(catalogLocation.updatedAt, catalogLocation.createdAt),
        },
        dto.areaId,
        areaSlugById,
        areaNameById,
        catalogAreaLabel
      )
    );
  }

  for (const facility of facilityRows) {
    if (!facility.images?.[0]?.trim()) continue;
    const latitude = facility.latitude;
    const longitude = facility.longitude;
    if (latitude == null || longitude == null) continue;
    if (!isWithinUaeFocusArea(latitude, longitude)) continue;

    const placeKind = facility.facilityKind;
    const catalogAreaLabel = facility.areaLabel?.trim() || null;
    items.push(
      attachExploreItemArea(
        {
          id: `facility:${facility.id}`,
          kind: 'event',
          source: FACILITY_MAP_SOURCE,
          title: facility.name,
          subtitle: PLACE_KIND_LABELS[placeKind],
          latitude,
          longitude,
          path: facilityDetailPath(facility.id),
          image: facility.images[0] ?? null,
          about: facility.description,
          placeKind,
          geoRef: facility.geoRef ?? null,
          locationCard: {
            id: facility.id,
            activityType: 'event',
            region: facility.region,
            groupRegionLevels: null,
            description: facility.description,
            childFriendly: false,
            season: [],
            images: facility.images ?? [],
            featured: facility.featured,
          },
          ...catalogUpdatedAtField(facility.updatedAt, facility.createdAt),
        },
        facility.areaId,
        areaSlugById,
        areaNameById,
        catalogAreaLabel
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

    const shopAreaId =
      latitude != null && longitude != null
        ? resolveAreaIdFromPoint(latitude, longitude, publishedAreas, null)
        : null;
    items.push(
      attachExploreItemArea(
        {
          id: `shop:${shop.id}`,
          kind: 'shop',
          source: 'shop',
          title: merchant?.shopName ?? shop.name,
          subtitle: shopPresence === 'online' ? 'Online partner' : shop.region ?? merchant?.region ?? null,
          groupRegionLevels: shop.groupRegionLevels ?? null,
          about: merchant?.description ?? shop.description ?? null,
          latitude,
          longitude,
          path: shopPublicPath({ merchantId: merchant?.id, slug: shop.slug }, EXPLORE_SHOPS_LIST_PATH),
          image: shop.logoUrl ?? merchant?.logo ?? null,
          merchantId: merchant?.id,
          tenantId: shop.id,
          websiteUrl,
          contactPhone: merchant?.showContactPhone ? merchant.contactPhone ?? null : null,
          shopPresence,
          catalogProfileExposure: 'full',
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
          ...catalogUpdatedAtField(shop.updatedAt, shop.createdAt),
        },
        shopAreaId,
        areaSlugById,
        areaNameById
      )
    );
  }

  attachLinkedRideshareMetadata(items);

  for (const item of items) {
    if (item.source === 'activity' && item.activity) {
      const activityMode = item.activityMode ?? 'hosted';
      const mapKind = exploreMapKindToPlanMapKind(item.kind);
      Object.assign(
        item,
        { activityMode },
        buildExploreMapPlanProjection({
          source: 'activity',
          activityMode,
          mapKind,
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
    if (isGeographyMapSource(item.source) || item.source === 'shop') {
      Object.assign(
        item,
        buildExploreMapPlanProjection({
          source: item.source as ExploreMapPlanSource,
          mapKind: exploreMapKindToPlanMapKind(item.kind),
        })
      );
    }
  }

  const locationIds = items
    .filter((item) => isPlaceMapSource(item.source))
    .map((item) => item.locationCard?.id ?? item.id.replace(/^(venue|place):/, ''));
  const tenantIds = items
    .filter((item) => item.source === 'shop')
    .map((item) => item.tenantId ?? item.id.replace(/^shop:/, ''));

  const [locationStats, tenantStats, availabilityItems] = await Promise.all([
    getReviewStatsByTargets(ReviewTargetType.LOCATION, locationIds),
    getReviewStatsByTargets(ReviewTargetType.TENANT, tenantIds),
    availabilityItemsPromise,
  ]);
  items.push(...availabilityItems);

  for (const item of items) {
    item.presentation = buildDiscoveryCardPresentation(item);
    if (item.source === 'area') continue;
    if (isPlaceMapSource(item.source)) {
      const id = item.locationCard?.id ?? item.id.replace(/^(venue|place):/, '');
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
