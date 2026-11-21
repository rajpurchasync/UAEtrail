import {
  isFacilityMapSource,
  isFacilityPlaceKind,
  isGeographyMapSource,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import type { ExploreBuddySubtypeKey } from './exploreBuddySubtype';
import { isBuddyOthersMapItem, matchesBuddyOthersSubtype } from './exploreBuddySubtype';
import type { ExploreOutingTopicKey } from './exploreOutingTopic';
import { matchesOutingTopicFilter } from './exploreOutingTopic';
import type { MapFilterKey } from './discoveryUrlParams';
import { isBuddyMapItem, isPlacesMapItem, isShopListItem } from './exploreMapItemKind';

const isFacilityExploreMapItem = (item: ExploreMapItemDTO): boolean =>
  isFacilityMapSource(item.source) || Boolean(item.placeKind && isFacilityPlaceKind(item.placeKind));

const isShopMapItem = (item: ExploreMapItemDTO): boolean => isShopListItem(item);

const matchesVenueKindFilter = (item: ExploreMapItemDTO, mapFilter: MapFilterKey): boolean => {
  if (mapFilter === 'hiking') return item.kind === 'hiking';
  if (mapFilter === 'camping') return item.kind === 'camping';
  if (mapFilter === 'event') return item.kind === 'event' && isGeographyMapSource(item.source);
  return true;
};

const matchesPlacesMapFilter = (item: ExploreMapItemDTO, mapFilter: MapFilterKey): boolean => {
  if (!isPlacesMapItem(item)) return false;
  if (mapFilter === 'all') return true;
  if (mapFilter === 'shops') return isShopMapItem(item) || item.kind === 'shop';
  if (mapFilter === 'facilities') return isFacilityExploreMapItem(item);
  if (mapFilter === 'rideshare') return false;
  if (mapFilter === 'others') {
    return (
      !isShopMapItem(item) &&
      !isFacilityExploreMapItem(item) &&
      item.kind !== 'hiking' &&
      item.kind !== 'camping'
    );
  }
  return matchesVenueKindFilter(item, mapFilter);
};

const matchesBuddyMapFilter = (
  item: ExploreMapItemDTO,
  mapFilter: MapFilterKey,
  othersSubtype: ExploreBuddySubtypeKey = 'all',
  outingTopic: ExploreOutingTopicKey = 'all'
): boolean => {
  if (!isBuddyMapItem(item)) return false;
  if (mapFilter === 'all') return true;
  if (mapFilter === 'shops') return false;

  const kind = item.kind;

  if (mapFilter === 'hiking') return kind === 'hiking';
  if (mapFilter === 'camping') return kind === 'camping';
  if (mapFilter === 'rideshare') return kind === 'rideshare';
  if (mapFilter === 'others') {
    if (!isBuddyOthersMapItem(item)) return false;
    if (!matchesBuddyOthersSubtype(item, othersSubtype)) return false;
    return matchesOutingTopicFilter(item, outingTopic);
  }

  return false;
};

/** Topic chip — same hiking/camping/… axis for hosted trips, demand, and catalog places. */
export const matchesUnifiedTopicFilter = (
  item: ExploreMapItemDTO,
  mapFilter: MapFilterKey,
  buddySubtype: ExploreBuddySubtypeKey = 'all',
  outingTopic: ExploreOutingTopicKey = 'all'
): boolean => {
  if (mapFilter === 'all') return true;
  if (isBuddyMapItem(item)) {
    return matchesBuddyMapFilter(item, mapFilter, buddySubtype, outingTopic);
  }
  if (isPlacesMapItem(item) || isShopListItem(item)) {
    return matchesPlacesMapFilter(item, mapFilter);
  }
  return false;
};