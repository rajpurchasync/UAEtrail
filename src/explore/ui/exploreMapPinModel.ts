import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { MapPinKind } from '../../components/ui/mapPinTypes';
import type { ColocatedMapPinEntry, PlaceMapPin } from '../../components/ui/PlacesMap';
import { resolveMapPinItemSource, resolveMapPinEmoji, type ExploreCardKind } from '../exploreCopy';
import type { ActivityListFilterKey, MapFilterKey, VenueListFilterKey } from '../routing';
import { mapFilterToVenueListFilter } from '../routing';

export const matchesVenueFilter = (item: ExploreMapItemDTO, venueFilter: VenueListFilterKey): boolean => {
  if (venueFilter === 'all') return true;
  if (venueFilter === 'shop') return item.kind === 'shop';
  if (venueFilter === 'hiking') return item.kind === 'hiking';
  if (venueFilter === 'camping') return item.kind === 'camping';
  if (venueFilter === 'event') return item.kind === 'event' && item.source === 'venue';
  return true;
};

export const isShopListItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'shop' && item.kind === 'shop' && !item.id.startsWith('product:');

/** Permanent catalog: trails, camp spots, shops — not outings or event venues. */
export const isPlacesMapItem = (item: ExploreMapItemDTO): boolean => {
  if (isShopListItem(item)) return true;
  if (item.source !== 'venue') return false;
  return item.kind === 'hiking' || item.kind === 'camping';
};

/** Time-bound social layer: hosted outings and looking-for posts. */
export const isBuddyMapItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'activity' || item.source === 'demand';

export const isPhysicalShopItem = (item: ExploreMapItemDTO): boolean =>
  isShopListItem(item) && item.shopPresence !== 'online' && item.latitude != null && item.longitude != null;

export const isOnlineShopItem = (item: ExploreMapItemDTO): boolean =>
  isShopListItem(item) && (item.shopPresence === 'online' || item.latitude == null || item.longitude == null);

/** @deprecated Use isShopListItem */
export const isShopMapItem = isShopListItem;

const isMapPin = (item: ExploreMapItemDTO): boolean => {
  if (item.latitude == null || item.longitude == null) return false;
  if (!isShopMapItem(item) && item.source === 'shop' && item.id.startsWith('product:')) return false;
  return true;
};

/** Places map/list — venues and shops only (no activities or demand). */
export const matchesPlacesMapFilter = (item: ExploreMapItemDTO, mapFilter: MapFilterKey): boolean => {
  if (!isPlacesMapItem(item)) return false;
  if (mapFilter === 'all') return true;
  if (mapFilter === 'shops') return isShopMapItem(item) || item.kind === 'shop';
  if (mapFilter === 'carpool' || mapFilter === 'others') return false;
  return matchesVenueFilter(item, mapFilterToVenueListFilter(mapFilter));
};

/** Buddy up map/list — activities and demand only (no venue catalog). */
export const matchesBuddyMapFilter = (item: ExploreMapItemDTO, mapFilter: MapFilterKey): boolean => {
  if (!isBuddyMapItem(item)) return false;
  if (mapFilter === 'all') return true;
  if (mapFilter === 'shops') return false;

  const kind = item.kind;

  if (mapFilter === 'hiking') return kind === 'hiking';
  if (mapFilter === 'camping') return kind === 'camping';
  if (mapFilter === 'carpool') return kind === 'carpool';
  if (mapFilter === 'others') return kind === 'event';

  return false;
};

export const matchesMapFilter = (item: ExploreMapItemDTO, mapFilter: MapFilterKey): boolean => {
  if (mapFilter === 'all') return true;
  if (mapFilter === 'shops') return isShopMapItem(item) || item.kind === 'shop';

  const kind = item.kind;

  if (mapFilter === 'hiking') {
    return kind === 'hiking' && (item.source === 'activity' || item.source === 'demand' || item.source === 'venue');
  }
  if (mapFilter === 'camping') {
    return kind === 'camping' && (item.source === 'activity' || item.source === 'demand' || item.source === 'venue');
  }
  if (mapFilter === 'carpool') {
    return kind === 'carpool' && (item.source === 'activity' || item.source === 'demand');
  }
  if (mapFilter === 'others') {
    return kind === 'event' && (item.source === 'activity' || item.source === 'demand' || item.source === 'venue');
  }

  return false;
};

export const matchesActivityFilter = (item: ExploreMapItemDTO, activityFilter: ActivityListFilterKey): boolean => {
  if (item.source !== 'activity' && item.source !== 'demand') return false;
  if (activityFilter === 'all') return true;
  if (activityFilter === 'carpool') return item.kind === 'carpool';
  if (item.kind === 'carpool') return false;
  return item.kind === activityFilter;
};

export const resolveExploreItemScheduleDate = (item: ExploreMapItemDTO): string | null => {
  const raw = item.date ?? item.activity?.date ?? null;
  if (!raw?.trim()) return null;
  return raw.slice(0, 10);
};

/** When set, scheduled activities/demand must match; venues and shops stay visible. */
export const matchesActivityDateFilter = (item: ExploreMapItemDTO, activityDate: string | null): boolean => {
  if (!activityDate) return true;
  if (item.source === 'venue' || item.source === 'shop' || item.source === 'agency') return true;
  return resolveExploreItemScheduleDate(item) === activityDate;
};

const mapPinKind = (item: ExploreMapItemDTO): MapPinKind => {
  if (item.source === 'demand') return item.kind === 'carpool' ? 'carpool' : (item.kind as MapPinKind);
  if (item.kind === 'shop') return 'shop';
  if (item.kind === 'carpool') return 'carpool';
  return item.kind as MapPinKind;
};

const pinLayerOrder = (source?: ExploreMapItemDTO['source']): number => {
  if (source === 'venue') return 0;
  if (source === 'shop') return 1;
  return 2;
};

export const expandMapPins = (items: ExploreMapItemDTO[]): PlaceMapPin[] => {
  const pins: PlaceMapPin[] = [];

  for (const item of items.filter(isMapPin)) {
    const hasDistinctTo =
      item.toLatitude != null &&
      item.toLongitude != null &&
      (Math.abs(item.toLatitude - item.latitude!) > 0.00001 ||
        Math.abs(item.toLongitude - item.longitude!) > 0.00001);

    pins.push({
      id: item.id,
      exploreItemId: item.id,
      name: item.title,
      latitude: item.latitude as number,
      longitude: item.longitude as number,
      activityType: mapPinKind(item),
      path: item.path,
      hostAvatar: item.hostAvatar,
      source: resolveMapPinItemSource(item),
      carpoolEndpoint: hasDistinctTo ? 'from' : undefined,
    });

    if (hasDistinctTo) {
      const secondKind = item.kind === 'carpool' ? 'carpool' : (item.kind as MapPinKind);
      pins.push({
        id: `${item.id}:to`,
        exploreItemId: item.id,
        name: item.title,
        latitude: item.toLatitude as number,
        longitude: item.toLongitude as number,
        activityType: secondKind,
        path: item.path,
        hostAvatar: item.hostAvatar,
        source: resolveMapPinItemSource(item),
        carpoolEndpoint: item.kind === 'carpool' ? 'to' : 'to',
      });
    }
  }

  return pins.sort((a, b) => pinLayerOrder(a.source) - pinLayerOrder(b.source));
};

const COORD_PRECISION = 5;

export const mapPinLocationKey = (pin: PlaceMapPin): string => {
  const lat = pin.latitude.toFixed(COORD_PRECISION);
  const lng = pin.longitude.toFixed(COORD_PRECISION);
  const endpoint = pin.carpoolEndpoint ?? '';
  return `${lat},${lng},${endpoint}`;
};

/** Group by map emoji — same emoji at one spot stacks with a count badge. */
export const mapPinEmojiGroupKey = (pin: PlaceMapPin): string => {
  const source = pin.source ?? 'activity';
  return resolveMapPinEmoji(pin.activityType as ExploreCardKind, source);
};

/** @deprecated Prefer mapPinEmojiGroupKey */
export const mapPinDisplayGroupKey = (pin: PlaceMapPin): string => mapPinEmojiGroupKey(pin);

const exploreItemIdForPin = (pin: PlaceMapPin): string => pin.exploreItemId ?? pin.id;

const buildColocatedEntry = (groupPins: PlaceMapPin[]): ColocatedMapPinEntry => {
  const sorted = [...groupPins].sort((a, b) => exploreItemIdForPin(a).localeCompare(exploreItemIdForPin(b)));
  const lead = sorted[0]!;
  const stackIds = sorted.map(exploreItemIdForPin);
  return {
    activityType: lead.activityType,
    source: lead.source,
    exploreItemId: stackIds[0]!,
    stackExploreItemIds: stackIds.length > 1 ? stackIds : undefined,
    stackCount: stackIds.length > 1 ? stackIds.length : undefined,
  };
};

/**
 * Same coordinates: one emoji circle per distinct map emoji; duplicate emoji → count on that circle.
 * Multiple emojis → one composite Leaflet marker (fan) so clustering does not merge types.
 */
export const layoutColocatedMapPins = (pins: PlaceMapPin[]): PlaceMapPin[] => {
  const byLocation = new Map<string, PlaceMapPin[]>();
  for (const pin of pins) {
    const key = mapPinLocationKey(pin);
    const bucket = byLocation.get(key);
    if (bucket) bucket.push(pin);
    else byLocation.set(key, [pin]);
  }

  const laidOut: PlaceMapPin[] = [];

  for (const locationPins of byLocation.values()) {
    const centerLat = locationPins[0]!.latitude;
    const centerLng = locationPins[0]!.longitude;
    const byEmoji = new Map<string, PlaceMapPin[]>();

    for (const pin of locationPins) {
      const emojiKey = mapPinEmojiGroupKey(pin);
      const bucket = byEmoji.get(emojiKey);
      if (bucket) bucket.push(pin);
      else byEmoji.set(emojiKey, [pin]);
    }

    const emojiGroups = [...byEmoji.values()].sort(
      (a, b) => pinLayerOrder(a[0]?.source) - pinLayerOrder(b[0]?.source)
    );

    if (emojiGroups.length === 1) {
      const groupPins = emojiGroups[0]!;
      const entry = buildColocatedEntry(groupPins);
      const lead = groupPins[0]!;

      if ((entry.stackCount ?? 0) <= 1) {
        laidOut.push({ ...lead, latitude: centerLat, longitude: centerLng });
        continue;
      }

      laidOut.push({
        ...lead,
        id: `stack:${entry.stackExploreItemIds!.join('+')}`,
        exploreItemId: entry.exploreItemId,
        latitude: centerLat,
        longitude: centerLng,
        stackExploreItemIds: entry.stackExploreItemIds,
        stackCount: entry.stackCount,
      });
      continue;
    }

    const entries = emojiGroups.map(buildColocatedEntry);
    const entryIds = entries.flatMap((e) => e.stackExploreItemIds ?? [e.exploreItemId]).sort();
    const lead = emojiGroups[0]![0]!;

    laidOut.push({
      ...lead,
      id: `colocate:${entryIds.join('+')}`,
      exploreItemId: entries[0]!.exploreItemId,
      latitude: centerLat,
      longitude: centerLng,
      colocatedEntries: entries,
    });
  }

  return laidOut.sort((a, b) => pinLayerOrder(a.source) - pinLayerOrder(b.source));
};
