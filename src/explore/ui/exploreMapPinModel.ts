import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { MapPinKind, PlaceMapPin } from '../../components/ui/PlacesMap';
import { resolveExploreItemSource } from '../exploreCopy';
import type { ActivityListFilterKey, MapFilterKey, VenueListFilterKey } from '../routing';

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
      source: resolveExploreItemSource(item),
      carpoolEndpoint: hasDistinctTo ? 'from' : undefined,
    });

    if (hasDistinctTo) {
      pins.push({
        id: `${item.id}:to`,
        exploreItemId: item.id,
        name: item.title,
        latitude: item.toLatitude as number,
        longitude: item.toLongitude as number,
        activityType: 'carpool',
        path: item.path,
        hostAvatar: item.hostAvatar,
        source: resolveExploreItemSource(item),
        carpoolEndpoint: 'to',
      });
    }
  }

  return pins.sort((a, b) => pinLayerOrder(a.source) - pinLayerOrder(b.source));
};
