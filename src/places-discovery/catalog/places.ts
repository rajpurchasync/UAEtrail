import type { ExploreMapItemDTO, PlaceKind } from '@uaetrail/shared-types';
import type { DiscoveryMapItems } from '@/discovery/discoveryMapPayload';
import { sortExploreVenues } from '../../explore/exploreListSort';
import type { MapFilterKey, VenueListFilterKey } from '../../explore/routing';
import {
  matchesPlaceMapTopicFilter,
  type PlaceMapTopicKey,
} from '../../explore/exploreMapQuickTopicFilters';
import {
  effectivePlaceTopicsForFacilityKinds,
  exploreItemMatchesFacilityKinds,
  explorePlaceHasHostedTrip,
  hostedPlaceLocationIdsFromCatalog,
} from '../../explore/exploreOptionalFilters';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';
import { isPlacesMapItem, isShopListItem } from '../../explore/ui/exploreMapPinModel';

export type MapPlaceFilters = {
  mapFilter: MapFilterKey;
  venueFilter?: VenueListFilterKey;
  venueRegions: string[];
  placeMapTopics?: PlaceMapTopicKey[];
  hasTrip?: boolean;
  facilityKinds?: readonly PlaceKind[];
};

/** @deprecated Use `MapPlaceFilters`. */
export type ExplorePlacesCatalogFilters = MapPlaceFilters;

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
      .filter((item) => venueItemMatchesRegions(item, filters.venueRegions))
  );
};

/** Shop pins (physical + online) from the same discovery map payload. */
export const selectShopsFromMapItems = (mapItems: DiscoveryMapItems): ExploreMapItemDTO[] =>
  sortExploreVenues(mapItems.filter(isShopListItem));

/** @deprecated Use `selectPlacesFromMapItems`. */
export const selectPlacesFromExploreCatalog = selectPlacesFromMapItems;

/** @deprecated Use `selectShopsFromMapItems`. */
export const selectShopsFromExploreCatalog = selectShopsFromMapItems;