import { exploreMapItemIsRetiredSeekingActivity, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryMapItems } from '@/discovery/discoveryMapPayload';
import {
  exploreMapItemMatchesActivityModeFilter,
  type ExploreActivityModeFilter,
} from '../../discovery/discoveryPortExploreCatalogFilters';
import {
  matchesActivityDateFilter,
} from '../../discovery/discoveryPortExploreOptionalFilterWire';
import { sortExploreActivities } from '../../discovery/discoveryPortExploreCatalogFilters';
import {
  matchesTripMapTopicFilter,
  type TripMapTopicKey,
} from '../../discovery/discoveryPortExploreOptionalFilterWire';
import { isFriendMapItem } from '../../discovery/discoveryPortExploreMapPin';
import {
  exploreItemMatchesPriceFilter,
  type ExplorePriceFilter,
} from '../../discovery/discoveryPortExploreOptionalFilterWire';
import { exploreItemMatchesQuery } from '../../discovery/discoveryPortExploreSearchRouting';
import {
  selectAvailabilityFromMapItems,
  type MapAvailabilityFilters,
} from './availabilityCatalog';

export type MapActivityFilters = MapAvailabilityFilters & {
  activityModeFilter?: ExploreActivityModeFilter;
  tripMapTopics?: TripMapTopicKey[];
  priceFilter?: ExplorePriceFilter;
};

/**
 * Time-bound activities from the discovery map payload (hosted trips + fixed availability slice).
 * Legacy `activityMode: seeking` rows are excluded from the Trips map; “Looking for” = availability pins.
 */
export const selectActivitiesFromMapItems = (
  mapItems: DiscoveryMapItems,
  filters: MapActivityFilters
): ExploreMapItemDTO[] => {
  const activityModeFilter = filters.activityModeFilter ?? 'all';

  if (activityModeFilter === 'availability') {
    return selectAvailabilityFromMapItems(mapItems, filters);
  }

  const datePreset = filters.activityDatePreset ?? 'anyday';

  return sortExploreActivities(
    mapItems
      .filter(isFriendMapItem)
      .filter((item) => !exploreMapItemIsRetiredSeekingActivity(item))
      .filter((item) =>
        matchesTripMapTopicFilter(
          item,
          filters.tripMapTopics ?? [],
          filters.mapFilter,
          filters.othersSubtype,
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