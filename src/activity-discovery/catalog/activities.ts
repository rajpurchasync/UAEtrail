import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { sortExploreActivities } from '../../explore/exploreListSort';
import {
  matchesActivityDateFilter,
  type ExploreActivityDatePreset,
} from '../../explore/exploreActivityDateFilter';
import type { MapFilterKey } from '../../explore/routing';
import { exploreItemMatchesQuery } from '../../explore/exploreSearchMatches';
import type { ExploreBuddySubtypeKey } from '../../explore/exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../../explore/exploreOutingTopic';
import {
  exploreMapItemMatchesActivityModeFilter,
  type ExploreActivityModeFilter,
} from '../../explore/exploreActivityModeFilter';
import { isBuddyMapItem, matchesBuddyMapFilter } from '../../explore/ui/exploreMapPinModel';
import {
  selectSeekingActivitiesFromExploreCatalog,
  type ExploreSeekingCatalogFilters,
} from './seeking';

export type ExploreActivityCatalogFilters = ExploreSeekingCatalogFilters & {
  activityModeFilter?: ExploreActivityModeFilter;
};

/**
 * Time-bound activities from `GET /explore/map` (hosted, seeking, or both).
 * Seeking uses {@link selectSeekingActivitiesFromExploreCatalog}; hosted applies date + mode filters.
 */
export const selectActivitiesFromExploreCatalog = (
  exploreCatalogItems: ExploreMapItemDTO[],
  filters: ExploreActivityCatalogFilters
): ExploreMapItemDTO[] => {
  const activityModeFilter = filters.activityModeFilter ?? 'all';

  if (activityModeFilter === 'seeking') {
    return selectSeekingActivitiesFromExploreCatalog(exploreCatalogItems, filters);
  }

  const datePreset = filters.activityDatePreset ?? 'anyday';

  return sortExploreActivities(
    exploreCatalogItems
      .filter(isBuddyMapItem)
      .filter((item) =>
        matchesBuddyMapFilter(item, filters.mapFilter, filters.buddySubtype, filters.outingTopic)
      )
      .filter((item) => {
        if (datePreset === 'anyday') return true;
        return matchesActivityDateFilter(item, datePreset);
      })
      .filter((item) => exploreMapItemMatchesActivityModeFilter(item, activityModeFilter))
      .filter((item) => exploreItemMatchesQuery(item, filters.query))
  );
};
