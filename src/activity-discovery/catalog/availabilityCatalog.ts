import { exploreMapItemIsAvailabilityCatalog, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryMapItems } from '@/discovery/discoveryMapPayload';
import { sortExploreActivities } from '../../explore/exploreListSort';
import {
  matchesActivityDateFilter,
  type ExploreActivityDatePreset,
} from '../../explore/exploreActivityDateFilter';
import type { MapFilterKey } from '../../explore/routing';
import { exploreItemMatchesQuery } from '../../explore/exploreSearchMatches';
import type { ExploreOthersSubtypeKey } from '../../explore/exploreOthersSubtype';
import type { ExploreOutingTopicKey } from '../../explore/exploreOutingTopic';
import {
  isFriendMapItem,
  matchesOthersMapFilter,
} from '../../explore/ui/exploreMapPinModel';

/** Filters for fixed availability (`source: availability`) on the shared map payload. */
export type MapAvailabilityFilters = {
  mapFilter: MapFilterKey;
  othersSubtype: ExploreOthersSubtypeKey;
  outingTopic: ExploreOutingTopicKey;
  query: string;
  /**
   * When set (Activities list / `availability catalog`), apply map date chip.
   * Omit or `null` for People → Looking for (date chip does not apply).
   */
  activityDatePreset?: ExploreActivityDatePreset | null;
};

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
      .filter(isFriendMapItem)
      .filter(exploreMapItemIsAvailabilityCatalog)
      .filter((item) =>
        matchesOthersMapFilter(item, filters.mapFilter, filters.othersSubtype, filters.outingTopic)
      )
      .filter((item) => {
        if (!datePreset || datePreset === 'anyday') return true;
        return matchesActivityDateFilter(item, datePreset);
      })
      .filter((item) => exploreItemMatchesQuery(item, filters.query))
  );
};