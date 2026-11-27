import {
  exploreMapItemIsAvailabilityCatalog,
  isFacilityMapSource,
  isFacilityPlaceKind,
  isTimeBoundExploreMapItem,
  resolveExploreMapActivityMode,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import type { MapPinKind } from '../../components/ui/mapPinTypes';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import type { PlaceMapPin } from '../../components/ui/PlacesMap';
import { hostedOutingSummariesByPlaceId } from '../exploreHostedPlaceOutings';
import { resolveExploreMapPinCoverImage } from '../exploreMapPinCaption';
import { resolveMapPinItemSource } from '../exploreCopy';
import type { ExploreOthersSubtypeKey } from '../exploreOthersSubtype';
import { isOthersMapCategoryItem, matchesOthersMapSubtype } from '../exploreOthersSubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import { matchesOutingTopicFilter } from '../exploreOutingTopic';
import type { ActivityListFilterKey, ExploreActivityDatePreset, MapFilterKey, VenueListFilterKey } from '../routing';
import { mapFilterToVenueListFilter } from '../routing';
import type { ExplorePinKindFilter } from '../explorePinKindFilter';
import {
  EXPLORE_MAP_DEFAULT_ACTIVITY_DATE_PRESET,
  matchesActivityDateFilter,
} from '../exploreActivityDateFilter';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';

export const isFacilityExploreMapItem = (item: ExploreMapItemDTO): boolean =>
  isFacilityMapSource(item.source) || Boolean(item.placeKind && isFacilityPlaceKind(item.placeKind));

export const matchesVenueFilter = (item: ExploreMapItemDTO, venueFilter: VenueListFilterKey): boolean => {
  if (venueFilter === 'all') return true;
  if (venueFilter === 'shop') return item.kind === 'shop';
  if (venueFilter === 'facilities') return isFacilityExploreMapItem(item);
  if (isFacilityExploreMapItem(item)) return false;
  if (venueFilter === 'hiking') return item.kind === 'hiking';
  if (venueFilter === 'camping') return item.kind === 'camping';
  if (venueFilter === 'event') return item.kind === 'event' && isGeographyMapSource(item.source);
  return true;
};

export {
  isFriendMapItem,
  isCommunityShopMapItem,
  isShopStorefrontMapItem,
  isPlacesMapItem,
  isShopListItem,
} from '../exploreMapItemKind';
import { isFriendMapItem, isPlacesMapItem, isShopListItem } from '../exploreMapItemKind';

export const isPhysicalShopItem = (item: ExploreMapItemDTO): boolean =>
  isShopListItem(item) && item.shopPresence !== 'online' && item.latitude != null && item.longitude != null;

export const isOnlineShopItem = (item: ExploreMapItemDTO): boolean =>
  isShopListItem(item) && (item.shopPresence === 'online' || item.latitude == null || item.longitude == null);

/**
 * Pin coords for map + list hover.
 * Rideshares often only have meeting/start/`to*` — fall through until one pair exists.
 */
export const resolveExploreMapItemPinCoords = (
  item: ExploreMapItemDTO
): { lat: number; lng: number } | null => {
  const lat =
    item.latitude ??
    item.activity?.displayLatitude ??
    item.activity?.meetingLat ??
    item.activity?.startLat ??
    item.activity?.locationLatitude ??
    item.toLatitude ??
    null;
  const lng =
    item.longitude ??
    item.activity?.displayLongitude ??
    item.activity?.meetingLng ??
    item.activity?.startLng ??
    item.activity?.locationLongitude ??
    item.toLongitude ??
    null;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const isMapPin = (item: ExploreMapItemDTO): boolean => {
  if (!resolveExploreMapItemPinCoords(item)) return false;
  if (!isShopListItem(item) && item.source === 'shop' && item.id.startsWith('product:')) return false;
  if (item.kind === 'destination') return true;
  return true;
};

/** Places map/list — venues and shops only (no activities or demand). */
export const matchesPlacesMapFilter = (item: ExploreMapItemDTO, mapFilter: MapFilterKey): boolean => {
  if (!isPlacesMapItem(item)) return false;
  if (mapFilter === 'all') return true;
  if (mapFilter === 'shops') return isShopListItem(item) || item.kind === 'shop';
  if (mapFilter === 'facilities') return isFacilityExploreMapItem(item);
  if (mapFilter === 'rideshare') return false;
  if (mapFilter === 'others') {
    return (
      !isShopListItem(item) &&
      !isFacilityExploreMapItem(item) &&
      item.kind !== 'hiking' &&
      item.kind !== 'camping'
    );
  }
  return matchesVenueFilter(item, mapFilterToVenueListFilter(mapFilter));
};

/** Find crew map/list — activities and demand only (no venue catalog). */
export const matchesOthersMapFilter = (
  item: ExploreMapItemDTO,
  mapFilter: MapFilterKey,
  othersSubtype: ExploreOthersSubtypeKey = 'all',
  outingTopic: ExploreOutingTopicKey = 'all'
): boolean => {
  if (!isFriendMapItem(item)) return false;
  if (mapFilter === 'all') return true;
  if (mapFilter === 'shops') return false;

  const kind = item.kind;

  if (mapFilter === 'hiking') return kind === 'hiking';
  if (mapFilter === 'camping') return kind === 'camping';
  if (mapFilter === 'rideshare') return kind === 'rideshare';
  if (mapFilter === 'others') {
    if (!isOthersMapCategoryItem(item)) return false;
    if (!matchesOthersMapSubtype(item, othersSubtype)) return false;
    return matchesOutingTopicFilter(item, outingTopic);
  }

  return false;
};

export const isDestinationHubMapItem = (item: ExploreMapItemDTO): boolean =>
  item.kind === 'destination';

export const matchesExplorePinKindFilter = (item: ExploreMapItemDTO, pinKind: ExplorePinKindFilter): boolean => {
  if (pinKind === 'all') return true;
  if (pinKind === 'activities') return isTimeBoundExploreMapItem(item);
  if (pinKind === 'places') return isPlacesMapItem(item) && !isShopListItem(item);
  if (pinKind === 'shops') return isShopListItem(item);
  return false;
};

export { matchesUnifiedTopicFilter } from '../exploreMapTopicFilterMatch';
import { matchesUnifiedTopicFilter } from '../exploreMapTopicFilterMatch';

export type UnifiedExploreMapFilterInput = {
  mapFilter: MapFilterKey;
  pinKind: ExplorePinKindFilter;
  othersSubtype?: ExploreOthersSubtypeKey;
  outingTopic?: ExploreOutingTopicKey;
  activityDatePreset?: ExploreActivityDatePreset;
  venueRegions?: string[];
};

/** Map + unified browse — topic row + pin-kind row (see explore-browse-ia.md). */
export const matchesUnifiedExploreMapItem = (
  item: ExploreMapItemDTO,
  input: UnifiedExploreMapFilterInput
): boolean => {
  const othersSubtype = input.othersSubtype ?? 'all';
  const outingTopic = input.outingTopic ?? 'all';
  const activityDatePreset = input.activityDatePreset ?? EXPLORE_MAP_DEFAULT_ACTIVITY_DATE_PRESET;
  const venueRegions = input.venueRegions ?? [];

  if (!matchesExplorePinKindFilter(item, input.pinKind)) return false;
  if (!matchesUnifiedTopicFilter(item, input.mapFilter, othersSubtype, outingTopic)) return false;

  if (isFriendMapItem(item) && !matchesActivityDateFilter(item, activityDatePreset)) {
    return false;
  }

  if (venueRegions.length > 0) {
    if (isFriendMapItem(item) || isPlacesMapItem(item) || isShopListItem(item)) {
      if (!venueItemMatchesRegions(item, venueRegions)) return false;
    }
  }

  return true;
};

export const matchesActivityFilter = (item: ExploreMapItemDTO, activityFilter: ActivityListFilterKey): boolean => {
  if (!isTimeBoundExploreMapItem(item)) return false;
  if (activityFilter === 'all') return true;
  if (activityFilter === 'rideshare') return item.kind === 'rideshare';
  if (item.kind === 'rideshare') return false;
  return item.kind === activityFilter;
};

export type MobileExploreMapFilterInput = {
  activityFilter: ActivityListFilterKey;
  venueFilter: VenueListFilterKey;
  mapFilter: MapFilterKey;
  activityDatePreset: ExploreActivityDatePreset;
  venueRegions: string[];
  othersSubtype?: ExploreOthersSubtypeKey;
  outingTopic?: ExploreOutingTopicKey;
};

/** Mobile map — activity + places menus filter independent layers on one map. */
export const matchesMobileExploreMapItem = (
  item: ExploreMapItemDTO,
  input: MobileExploreMapFilterInput
): boolean => {
  const othersSubtype = input.othersSubtype ?? 'all';
  const outingTopic = input.outingTopic ?? 'all';

  if (isFriendMapItem(item)) {
    const topicOk =
      input.mapFilter === 'others'
        ? matchesOthersMapFilter(item, 'others', othersSubtype, outingTopic)
        : matchesActivityFilter(item, input.activityFilter);
    if (!topicOk) return false;
    return matchesActivityDateFilter(item, input.activityDatePreset);
  }

  if (isPlacesMapItem(item) || isShopListItem(item)) {
    if (!matchesVenueFilter(item, input.venueFilter)) return false;
    if (input.venueRegions.length > 0) {
      return venueItemMatchesRegions(item, input.venueRegions);
    }
    return true;
  }

  return false;
};

export { resolveExploreItemScheduleDate } from '../exploreMapItemSchedule';
import { resolveExploreItemScheduleDate } from '../exploreMapItemSchedule';

/** Inclusive host outing window for map date filters (start day … end day). */
export const resolveExploreItemScheduleWindow = (
  item: ExploreMapItemDTO
): { start: string; end: string } | null => {
  const start = resolveExploreItemScheduleDate(item);
  if (!start) return null;
  const rawEnd = item.activity?.endDate?.trim()?.slice(0, 10) ?? null;
  const end = rawEnd && rawEnd > start ? rawEnd : start;
  return { start, end };
};

const mapPinKind = (item: ExploreMapItemDTO): MapPinKind => {
  if (item.kind === 'destination') return 'destination';
  if (exploreMapItemIsAvailabilityCatalog(item)) {
    return item.kind === 'rideshare' ? 'rideshare' : (item.kind as MapPinKind);
  }
  if (item.kind === 'shop') return 'shop';
  if (item.kind === 'rideshare') return 'rideshare';
  return item.kind as MapPinKind;
};

const pinLayerOrder = (source?: ExploreMapItemDTO['source']): number => {
  if (isGeographyMapSource(source)) return 0;
  if (source === 'shop') return 1;
  return 2;
};

const resolvePlaceCatalogLocationId = (item: ExploreMapItemDTO): string | null => {
  const fromCard = item.locationCard?.id?.trim();
  if (fromCard) return fromCard;
  const fromActivity = item.activity?.locationId?.trim();
  if (fromActivity) return fromActivity;
  return null;
};

/** Temporary pin while the list hover target is not yet in the loaded map cluster. */
export const buildListHoverMapPin = (
  exploreItemId: string,
  point: { lat: number; lng: number; activityType?: MapPinKind },
  catalogItem?: ExploreMapItemDTO | null
): PlaceMapPin => {
  const resolvedMode = catalogItem ? resolveExploreMapActivityMode(catalogItem) : null;
  return {
    id: exploreItemId,
    exploreItemId,
    name: catalogItem?.title ?? 'Preview',
    latitude: point.lat,
    longitude: point.lng,
    activityType: catalogItem ? mapPinKind(catalogItem) : (point.activityType ?? 'event'),
    path: catalogItem?.path ?? '',
    hostAvatar: catalogItem?.featuredPerson?.avatarUrl ?? null,
    source: catalogItem ? resolveMapPinItemSource(catalogItem) : 'activity',
    activityMode: resolvedMode ?? undefined,
    scheduleDate: catalogItem ? resolveExploreItemScheduleDate(catalogItem) : null,
  };
};

export const mapPinsIncludeExploreItem = (pins: PlaceMapPin[], exploreItemId: string): boolean =>
  pins.some(
    (pin) =>
      pin.id === exploreItemId ||
      pin.exploreItemId === exploreItemId ||
      pin.stackExploreItemIds?.includes(exploreItemId)
  );

export const expandMapPins = (items: ExploreMapItemDTO[]): PlaceMapPin[] => {
  const pins: PlaceMapPin[] = [];
  const hostedTripsByPlace = hostedOutingSummariesByPlaceId(items);

  for (const item of items.filter(isMapPin)) {
    const coords = resolveExploreMapItemPinCoords(item);
    if (!coords) continue;
    const resolvedMode = resolveExploreMapActivityMode(item);
    const source = resolveMapPinItemSource(item);
    const placeLocationId = isGeographyMapSource(source) ? resolvePlaceCatalogLocationId(item) : null;
    const hostedTripCount = placeLocationId
      ? hostedTripsByPlace.get(placeLocationId)?.count ?? 0
      : undefined;
    const hasDistinctTo =
      item.toLatitude != null &&
      item.toLongitude != null &&
      (Math.abs(item.toLatitude - coords.lat) > 0.00001 ||
        Math.abs(item.toLongitude - coords.lng) > 0.00001);

    const pinCoverImage = isGeographyMapSource(source) ? resolveExploreMapPinCoverImage(item) : undefined;

    pins.push({
      id: item.id,
      exploreItemId: item.id,
      name: item.title,
      latitude: coords.lat,
      longitude: coords.lng,
      activityType: mapPinKind(item),
      path: item.path,
      hostAvatar: item.featuredPerson?.avatarUrl ?? null,
      source,
      activityMode: resolvedMode ?? undefined,
      rideshareEndpoint: hasDistinctTo ? 'from' : undefined,
      placeKind: item.placeKind ?? undefined,
      scheduleDate: resolveExploreItemScheduleDate(item),
      hostedTripCount,
      pinCoverImage,
    });

    if (hasDistinctTo) {
      const secondKind = item.kind === 'rideshare' ? 'rideshare' : (item.kind as MapPinKind);
      pins.push({
        id: `${item.id}:to`,
        exploreItemId: item.id,
        name: item.title,
        latitude: item.toLatitude as number,
        longitude: item.toLongitude as number,
        activityType: secondKind,
        path: item.path,
        hostAvatar: item.featuredPerson?.avatarUrl ?? null,
        source: resolveMapPinItemSource(item),
        activityMode: resolvedMode ?? undefined,
        rideshareEndpoint: item.kind === 'rideshare' ? 'to' : 'to',
        scheduleDate: resolveExploreItemScheduleDate(item),
      });
    }
  }

  return pins.sort((a, b) => pinLayerOrder(a.source) - pinLayerOrder(b.source));
};

/** After map click resolution — prefer explicit explore item id over stack defaults. */
export const resolveExploreItemIdFromMapPin = (pin: PlaceMapPin): string =>
  pin.exploreItemId ?? pin.stackExploreItemIds?.[0] ?? pin.id;

/**
 * Keep one Leaflet marker per catalog item so MarkerCluster can group nearby pins
 * and spiderfy the same coordinate. Layer order is preserved for paint.
 */
export const layoutColocatedMapPins = (pins: PlaceMapPin[]): PlaceMapPin[] =>
  [...pins]
    .map((pin) => ({ ...pin, stackCount: pin.stackCount ?? 1 }))
    .sort((a, b) => pinLayerOrder(a.source) - pinLayerOrder(b.source));
