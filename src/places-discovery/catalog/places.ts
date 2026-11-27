import type { ExploreMapItemDTO, PlaceKind } from '@uaetrail/shared-types';
import type { DiscoveryMapItems } from '@/discovery/discoveryMapPayload';
import { sortExploreVenues } from '../../discovery/discoveryPortExploreCatalogFilters';
import {
  matchesPlaceMapTopicFilter,
  type PlaceMapTopicKey,
} from '../../discovery/discoveryPortExploreOptionalFilters';
import {
  effectivePlaceTopicsForFacilityKinds,
  exploreItemMatchesFacilityKinds,
  explorePlaceHasHostedTrip,
  hostedPlaceLocationIdsFromCatalog,
} from '../../discovery/discoveryPortExploreOptionalFilters';
import type { MapFilterKey, VenueListFilterKey } from '../../discovery/discoveryPortExploreRouting';
import { isPlacesMapItem, isShopListItem } from '../../discovery/discoveryPortExploreMapPin';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';

export type MapPlaceFilters = {
  mapFilter: MapFilterKey;
  venueFilter?: VenueListFilterKey;
  venueRegions: string[];
  placeMapTopics?: PlaceMapTopicKey[];
  hasTrip?: boolean;
  facilityKinds?: readonly PlaceKind[];
  venueRegionOrder?: readonly string[];
};

/** Venue + catalog place pins from the discovery map payload (`GET /explore/map`). */
export const selectPlacesFromMapItems = (
  mapItems: DiscoveryMapItems,
  filters: MapPlaceFilters
): ExploreMapItemDTO[] => {
  const facilityKinds = filters.facilityKinds ?? [];
  const placeMapTopics = effectivePlaceTopicsForFacilityKinds(
    filters.placeMapTopics ?? [],
    facilityKinds
  );
  const hostedIds = filters.hasTrip ? hostedPlaceLocationIdsFromCatalog(mapItems) : null;

  return sortExploreVenues(
    mapItems
      .filter(isPlacesMapItem)
      .filter((item) =>
        matchesPlaceMapTopicFilter(
          item,
          placeMapTopics,
          filters.mapFilter,
          filters.venueFilter ?? 'all'
        )
      )
      .filter((item) => exploreItemMatchesFacilityKinds(item, facilityKinds))
      .filter((item) => (hostedIds ? explorePlaceHasHostedTrip(item, hostedIds) : true))
      .filter((item) => venueItemMatchesRegions(item, filters.venueRegions)),
    filters.venueRegionOrder
  );
};

/** Shop pins (physical + online) from the same discovery map payload. */
export const selectShopsFromMapItems = (
  mapItems: DiscoveryMapItems,
  venueRegionOrder?: readonly string[]
): ExploreMapItemDTO[] => sortExploreVenues(mapItems.filter(isShopListItem), venueRegionOrder);