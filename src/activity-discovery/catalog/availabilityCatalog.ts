import { exploreMapItemIsAvailabilityCatalog, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryMapItems } from '@/discovery/discoveryMapPayload';
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

/** Filters for fixed availability (`source: availability`) on the shared map payload. */
export type MapAvailabilityFilters = {
  mapFilter: MapFilterKey;
  buddySubtype: ExploreBuddySubtypeKey;
  outingTopic: ExploreOutingTopicKey;
  query: string;
  /**
   * When set (Activities list / `availability catalog`), apply map date chip.
   * Omit or `null` for People → Looking for (date chip does not apply).
   */
  activityDatePreset?: ExploreActivityDatePreset | null;
};

/** @deprecated Use `MapAvailabilityFilters`. */
export type ExploreAvailabilityCatalogFilters = MapAvailabilityFilters;

/**
 * Fixed crew availability from the discovery map payload.
 * Same entities as map pins (`source: availability`).
 */
export const selectAvailabilityFromMapItems = (
  mapItems: DiscoveryMapItems,
  filters: MapAvailabilityFilters
): ExploreMapItemDTO[] => {
  const datePreset = filters.activityDatePreset ?? null;

  return sortExploreActivities(
    mapItems
      .filter(isBuddyMapItem)
      .filter(exploreMapItemIsAvailabilityCatalog)
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

/** @deprecated Use `selectAvailabilityFromMapItems`. */
export const selectAvailabilityFromExploreCatalog = selectAvailabilityFromMapItems;