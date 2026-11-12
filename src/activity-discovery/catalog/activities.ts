import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { sortExploreActivities } from '../../explore/exploreListSort';
import { matchesActivityDateFilter } from '../../explore/exploreActivityDateFilter';
import { exploreItemMatchesQuery } from '../../explore/exploreSearchMatches';
import {
  exploreMapItemMatchesActivityModeFilter,
  type ExploreActivityModeFilter,
} from '../../explore/exploreActivityModeFilter';
import {
  matchesTripMapTopicFilter,
  type TripMapTopicKey,
} from '../../explore/exploreMapQuickTopicFilters';
import {
  exploreItemMatchesPriceFilter,
  type ExplorePriceFilter,
} from '../../explore/exploreOptionalFilters';
import { isBuddyMapItem } from '../../explore/ui/exploreMapPinModel';
import {
  selectSeekingActivitiesFromExploreCatalog,
  type ExploreSeekingCatalogFilters,
} from './seeking';

export type ExploreActivityCatalogFilters = ExploreSeekingCatalogFilters & {
  activityModeFilter?: ExploreActivityModeFilter;
  tripMapTopics?: TripMapTopicKey[];
  priceFilter?: ExplorePriceFilter;
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
        matchesTripMapTopicFilter(
          item,
          filters.tripMapTopics ?? [],
          filters.mapFilter,
          filters.buddySubtype,
          filters.outingTopic
        )
      )
      .filter((item) => {
        if (datePreset === 'anyday') return true;
        return matchesActivityDateFilter(item, datePreset);
      })
      .filter((item) => exploreMapItemMatchesActivityModeFilter(item, activityModeFilter))
      .filter((item) => exploreItemMatchesPriceFilter(item, filters.priceFilter ?? 'all'))
      .filter((item) => exploreItemMatchesQuery(item, filters.query))
  );
};
