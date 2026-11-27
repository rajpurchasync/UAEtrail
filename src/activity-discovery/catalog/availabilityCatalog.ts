import { exploreMapItemIsAvailabilityCatalog, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryMapItems } from '@/discovery/discoveryMapPayload';
import {
  matchesActivityDateFilter,
  type ExploreActivityDatePreset,
} from '../../discovery/discoveryPortExploreOptionalFilters';
import { sortExploreActivities } from '../../discovery/discoveryPortExploreCatalogFilters';
import {
  isFriendMapItem,
  matchesOthersMapFilter,
} from '../../discovery/discoveryPortExploreMapPin';
import type { ExploreOthersSubtypeKey } from '../../discovery/discoveryPortExploreCatalogFilters';
import type { ExploreOutingTopicKey } from '../../discovery/discoveryPortExploreCatalogFilters';
import type { MapFilterKey } from '../../discovery/discoveryPortExploreRouting';
import { exploreItemMatchesQuery } from '../../discovery/discoveryPortExploreSearchRouting';

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