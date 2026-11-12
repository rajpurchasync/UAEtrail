import type { ExploreMapItemDTO, PlaceKind } from '@uaetrail/shared-types';
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

export type ExplorePlacesCatalogFilters = {
  mapFilter: MapFilterKey;
  venueFilter?: VenueListFilterKey;
  venueRegions: string[];
  placeMapTopics?: PlaceMapTopicKey[];
  hasTrip?: boolean;
  facilityKinds?: readonly PlaceKind[];
};

/** Venue + catalog place pins from the explore map read (`GET /explore/map`). */
export const selectPlacesFromExploreCatalog = (
  exploreCatalogItems: ExploreMapItemDTO[],
  filters: ExplorePlacesCatalogFilters
): ExploreMapItemDTO[] => {
  const facilityKinds = filters.facilityKinds ?? [];
  const placeMapTopics = effectivePlaceTopicsForFacilityKinds(
    filters.placeMapTopics ?? [],
    facilityKinds
  );
  const hostedIds = filters.hasTrip ? hostedPlaceLocationIdsFromCatalog(exploreCatalogItems) : null;

  return sortExploreVenues(
    exploreCatalogItems
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

/** Shop pins (physical + online) from the same explore catalog. */
export const selectShopsFromExploreCatalog = (
  exploreCatalogItems: ExploreMapItemDTO[]
): ExploreMapItemDTO[] => sortExploreVenues(exploreCatalogItems.filter(isShopListItem));
