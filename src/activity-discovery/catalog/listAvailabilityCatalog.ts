import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  selectAvailabilityFromMapItems,
  type MapAvailabilityFilters,
} from './availabilityCatalog';

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
