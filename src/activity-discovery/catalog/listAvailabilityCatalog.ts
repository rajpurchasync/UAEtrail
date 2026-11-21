import { exploreMapItemIsAvailabilityCatalog, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  selectAvailabilityFromMapItems,
  type MapAvailabilityFilters,
} from './availabilityCatalog';

/** Fixed `member_availability` map rows for list availability-only browse (`tripAvailabilityOnly`). */
export const isListAvailabilityCatalogItem = (item: ExploreMapItemDTO): boolean =>
  exploreMapItemIsAvailabilityCatalog(item);

export const filterListAvailabilityCatalogItems = (items: ExploreMapItemDTO[]): ExploreMapItemDTO[] =>
  items.filter(isListAvailabilityCatalogItem);

/** List `/list` has no map buddy/topic chips — availability rows use neutral filters; query/date apply in `browseListFilters`. */
export const LIST_AVAILABILITY_CATALOG_FILTERS: MapAvailabilityFilters = {
  mapFilter: 'all',
  buddySubtype: 'all',
  outingTopic: 'all',
  query: '',
  activityDatePreset: null,
};

export const selectAvailabilityForListCatalog = (
  exploreCatalogItems: ExploreMapItemDTO[]
): ExploreMapItemDTO[] =>
  selectAvailabilityFromMapItems(exploreCatalogItems, LIST_AVAILABILITY_CATALOG_FILTERS);
