import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { sortExploreVenues } from '../../explore/exploreListSort';
import type { MapFilterKey } from '../../explore/routing';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';
import {
  isPlacesMapItem,
  isShopListItem,
  matchesPlacesMapFilter,
} from '../../explore/ui/exploreMapPinModel';

export type ExplorePlacesCatalogFilters = {
  mapFilter: MapFilterKey;
  venueRegions: string[];
};

/** Venue + catalog place pins from the explore map read (`GET /explore/map`). */
export const selectPlacesFromExploreCatalog = (
  exploreCatalogItems: ExploreMapItemDTO[],
  filters: ExplorePlacesCatalogFilters
): ExploreMapItemDTO[] =>
  sortExploreVenues(
    exploreCatalogItems
      .filter(isPlacesMapItem)
      .filter((item) => matchesPlacesMapFilter(item, filters.mapFilter))
      .filter((item) => venueItemMatchesRegions(item, filters.venueRegions))
  );

/** Shop pins (physical + online) from the same explore catalog. */
export const selectShopsFromExploreCatalog = (
  exploreCatalogItems: ExploreMapItemDTO[]
): ExploreMapItemDTO[] => sortExploreVenues(exploreCatalogItems.filter(isShopListItem));
