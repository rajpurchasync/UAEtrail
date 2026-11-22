/** Explore `/explore/search` list surface — joinable pools over the shared map catalog. */

import { useMemo } from 'react';
import { setExploreClockStyle, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import type { BrowseListFilterState } from '../browse/browseListFilters';
import type { BrowseMainCategoryKey } from '../browse/browseListTaxonomy';
import { scopeBrowseListStateForListCat } from '../browse/browseListMapHandoff';
import { exploreMapPathFromListSearch } from '../browse/browseListRouting';
import { buildListFeedCards } from '../browse/buildListFeedCards';
import { sortBrowseListCards, type BrowseListSortMode } from '../browse/listBrowseSort';
import {
  exploreSearchMapViewPathFromListSearch,
  exploreSearchResultsPath,
  parseExploreSearchBrowseState,
} from '../../explore/search/exploreSearchRouting';
import {
  resolveExploreSearchTripPool,
  resolveExploreSearchVenuePool,
} from '../../explore/search/exploreSearchJoinablePools';
import { exploreSearchWhereBrowseQuery } from '../../explore/search/exploreSearchWhereQuery';

export type ListDiscoveryExploreSearchFeedInput = {
  exploreSearch: boolean;
  isPeopleCategory: boolean;
  searchParams: URLSearchParams;
  search: string;
  filters: BrowseListFilterState;
  listCat: BrowseMainCategoryKey | null;
  items: ExploreMapItemDTO[];
  hubVenueRegions: string[];
  geoPath: string[];
  publishedAreas: Parameters<typeof resolveExploreSearchTripPool>[4];
  clock: Parameters<typeof setExploreClockStyle>[0];
  sort: BrowseListSortMode;
  user: { id: string } | null | undefined;
  feedCards: DiscoveryCardModel[];
  onCloseMapOverlay?: () => void;
};

export const useListDiscoveryExploreSearchFeedModel = ({
  exploreSearch,
  isPeopleCategory,
  searchParams,
  search: _search,
  filters,
  listCat,
  items,
  hubVenueRegions,
  geoPath,
  publishedAreas,
  clock,
  sort,
  user,
  feedCards,
}: ListDiscoveryExploreSearchFeedInput) => {
  const searchResultsBrowse = useMemo(
    () => (exploreSearch ? parseExploreSearchBrowseState(searchParams) : null),
    [exploreSearch, searchParams]
  );
  const searchResultsMapView = searchResultsBrowse?.view === 'map';

  const exploreSearchMapPool = useMemo(() => {
    if (!exploreSearch || isPeopleCategory) return null;
    const searchBrowse = searchResultsBrowse ?? parseExploreSearchBrowseState(searchParams);
    const browseQuery = exploreSearchWhereBrowseQuery(searchBrowse.query.trim() || filters.query);
    const scopedFilters =
      listCat === 'venues'
        ? scopeBrowseListStateForListCat({ ...filters, query: browseQuery }, 'venues')
        : scopeBrowseListStateForListCat(
            {
              ...filters,
              query: browseQuery,
              activityDatePreset:
                searchBrowse.searchScope === 'places'
                  ? filters.activityDatePreset
                  : searchBrowse.activityDatePreset,
            },
            'activities'
          );
    return listCat === 'venues'
      ? resolveExploreSearchVenuePool(items, scopedFilters, hubVenueRegions, geoPath, publishedAreas).pool
      : resolveExploreSearchTripPool(items, scopedFilters, hubVenueRegions, geoPath, publishedAreas).pool;
  }, [
    exploreSearch,
    filters,
    geoPath,
    hubVenueRegions,
    isPeopleCategory,
    items,
    listCat,
    publishedAreas,
    searchParams,
    searchResultsBrowse,
  ]);

  const exploreSearchCards = useMemo(() => {
    if (!exploreSearchMapPool) return null;
    setExploreClockStyle(clock);
    const built = buildListFeedCards(exploreSearchMapPool, user, items);
    return sortBrowseListCards(built, sort, null);
  }, [clock, exploreSearchMapPool, items, sort, user]);

  const cards = exploreSearchCards ?? feedCards;

  return {
    searchResultsBrowse,
    searchResultsMapView,
    exploreSearchMapPool,
    exploreSearchCards,
    cards,
  };
};

export const resolveListDiscoveryMapHref = ({
  onCloseMapOverlay,
  exploreSearch,
  searchParams,
  search,
}: {
  onCloseMapOverlay?: () => void;
  exploreSearch: boolean;
  searchParams: URLSearchParams;
  search: string;
}): string => {
  if (onCloseMapOverlay) return EXPLORE_MAP_PATH;
  if (exploreSearch) {
    const searchBrowse = parseExploreSearchBrowseState(searchParams);
    return searchBrowse.view === 'map'
      ? exploreSearchResultsPath({ ...searchBrowse, view: 'list' })
      : exploreSearchMapViewPathFromListSearch(search);
  }
  return exploreMapPathFromListSearch(search);
};