import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  selectSeekingActivitiesFromExploreCatalog,
  type ExploreSeekingCatalogFilters,
} from './seeking';

/** List `/list` has no map buddy/topic chips — seeking rows use neutral filters; query/date apply in `browseListFilters`. */
export const LIST_SEEKING_CATALOG_FILTERS: ExploreSeekingCatalogFilters = {
  mapFilter: 'all',
  buddySubtype: 'all',
  outingTopic: 'all',
  query: '',
  activityDatePreset: null,
};

export const selectSeekingActivitiesForListCatalog = (
  exploreCatalogItems: ExploreMapItemDTO[]
): ExploreMapItemDTO[] =>
  selectSeekingActivitiesFromExploreCatalog(exploreCatalogItems, LIST_SEEKING_CATALOG_FILTERS);
