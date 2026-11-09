import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { sortExploreVenues } from '../../explore/exploreListSort';
import type { MapFilterKey, VenueListFilterKey } from '../../explore/routing';
import {
  matchesPlaceMapTopicFilter,
  type PlaceMapTopicKey,
} from '../../explore/exploreMapQuickTopicFilters';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';
import { isPlacesMapItem, isShopListItem } from '../../explore/ui/exploreMapPinModel';

export type ExplorePlacesCatalogFilters = {
  mapFilter: MapFilterKey;
  venueFilter?: VenueListFilterKey;
  venueRegions: string[];
  placeMapTopics?: PlaceMapTopicKey[];
};

/** Venue + catalog place pins from the explore map read (`GET /explore/map`). */
export const selectPlacesFromExploreCatalog = (
  exploreCatalogItems: ExploreMapItemDTO[],
  filters: ExplorePlacesCatalogFilters
): ExploreMapItemDTO[] =>
  sortExploreVenues(
    exploreCatalogItems
      .filter(isPlacesMapItem)
      .filter((item) =>
        matchesPlaceMapTopicFilter(
          item,
          filters.placeMapTopics ?? [],
          filters.mapFilter,
          filters.venueFilter ?? 'all'
        )
      )
      .filter((item) => venueItemMatchesRegions(item, filters.venueRegions))
  );

/** Shop pins (physical + online) from the same explore catalog. */
export const selectShopsFromExploreCatalog = (
  exploreCatalogItems: ExploreMapItemDTO[]
): ExploreMapItemDTO[] => sortExploreVenues(exploreCatalogItems.filter(isShopListItem));
