import { exploreMapItemIsSeeking, type ExploreMapItemDTO } from '@uaetrail/shared-types';
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
  isBuddyMapItem,
  matchesBuddyMapFilter,
} from '../../explore/ui/exploreMapPinModel';

/** Filters for published `activityMode: seeking` rows from `GET /explore/map`. */
export type ExploreSeekingCatalogFilters = {
  mapFilter: MapFilterKey;
  buddySubtype: ExploreBuddySubtypeKey;
  outingTopic: ExploreOutingTopicKey;
  query: string;
  /**
   * When set (Activities list / `activityMode=seeking`), apply map date chip.
   * Omit or `null` for People → Looking for (date chip does not apply).
   */
  activityDatePreset?: ExploreActivityDatePreset | null;
};

/**
 * Published seeking activities from the explore catalog (`ExploreMapItemDTO[]`).
 * Same entities as map pins and Activities list (`activityMode: seeking`).
 */
export const selectSeekingActivitiesFromExploreCatalog = (
  exploreCatalogItems: ExploreMapItemDTO[],
  filters: ExploreSeekingCatalogFilters
): ExploreMapItemDTO[] => {
  const datePreset = filters.activityDatePreset ?? null;

  return sortExploreActivities(
    exploreCatalogItems
      .filter(isBuddyMapItem)
      .filter(exploreMapItemIsSeeking)
      .filter((item) =>
        matchesBuddyMapFilter(item, filters.mapFilter, filters.buddySubtype, filters.outingTopic)
      )
      .filter((item) => {
        if (!datePreset || datePreset === 'anyday') return true;
        return matchesActivityDateFilter(item, datePreset);
      })
      .filter((item) => exploreItemMatchesQuery(item, filters.query))
  );
};
