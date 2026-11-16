import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  selectAvailabilityFromExploreCatalog,
  type ExploreAvailabilityCatalogFilters,
} from './availabilityCatalog';

/** List `/list` has no map buddy/topic chips — seeking rows use neutral filters; query/date apply in `browseListFilters`. */
export const LIST_AVAILABILITY_CATALOG_FILTERS: ExploreAvailabilityCatalogFilters = {
  mapFilter: 'all',
  buddySubtype: 'all',
  outingTopic: 'all',
  query: '',
  activityDatePreset: null,
};

export const selectAvailabilityForListCatalog = (
  exploreCatalogItems: ExploreMapItemDTO[]
): ExploreMapItemDTO[] =>
  selectAvailabilityFromExploreCatalog(exploreCatalogItems, LIST_AVAILABILITY_CATALOG_FILTERS);
