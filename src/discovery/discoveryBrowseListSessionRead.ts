/**
 * B-UNIFY-02 — pure read model for list browse URL session (explore overlay + `/list` + search hub).
 */
import {
  EXPLORE_SEARCH_RESULTS_PATH,
  exploreSearchListCatForScope,
  parseExploreSearchBrowseState,
} from './discoveryPortExploreSearchRouting';
import type { BrowseListFilterState } from '../list/browse/browseListFilters';
import type { BrowseMainCategoryKey } from '../list/browse/browseListTaxonomy';
import {
  inferListCatFromExploreHandoff,
  scopeBrowseListStateForListCat,
} from '../list/browse/browseListMapHandoff';
import { LIST_CAT_PARAM } from './discoverySessionParams';
import { parseListCatParam } from './discoverySessionParsers';
import {
  parseBrowseListFilterState,
  parseBrowseListGeoPath,
  parseBrowseListVenueRegions,
} from './discoveryPortListUrl';
import {
  LIST_LAYOUT_PARAM,
  parseBrowseListLayout,
  type BrowseListLayout,
} from '../list/browse/browseListLayout';
import {
  LIST_SORT_PARAM,
  parseBrowseListSort,
  type BrowseListSortMode,
} from '../list/browse/listBrowseSort';
import {
  CREWS_AVAIL_GUIDE_PARAM,
  CREWS_OPEN_URL_PARAM,
  parseCrewsAvailabilityGuideFilter,
  parseCrewsAvailabilityShapeFilter,
  type CrewsAvailabilityGuideFilter,
  type CrewsAvailabilityShapeFilter,
} from '../list/crews/crewsOpenSegment';

export type DiscoveryBrowseListSessionReadInput = {
  pathname: string;
  searchParams: URLSearchParams;
  mapOverlay: boolean;
};

export const resolveDiscoveryBrowseListCat = ({
  pathname,
  searchParams,
  mapOverlay,
}: DiscoveryBrowseListSessionReadInput): BrowseMainCategoryKey => {
  const rawListCat = parseListCatParam(searchParams.get(LIST_CAT_PARAM));
  if (pathname === EXPLORE_SEARCH_RESULTS_PATH) {
    return exploreSearchListCatForScope(parseExploreSearchBrowseState(searchParams).searchScope);
  }
  if (mapOverlay) return rawListCat ?? 'activities';
  if (rawListCat === 'people' || rawListCat === 'agencies') return rawListCat;
  if (rawListCat) return rawListCat;
  const inferred = inferListCatFromExploreHandoff(parseBrowseListFilterState(searchParams), searchParams);
  if (inferred) return inferred;
  return 'activities';
};

export type DiscoveryBrowseListSessionSnapshot = {
  listCat: BrowseMainCategoryKey;
  filters: BrowseListFilterState;
  venueRegions: string[];
  geoPath: string[];
  layout: BrowseListLayout;
  sort: BrowseListSortMode;
  crewsOpenLens: CrewsAvailabilityShapeFilter;
  crewsAvailabilityGuideFilter: CrewsAvailabilityGuideFilter;
};

export const readDiscoveryBrowseListSession = (
  input: DiscoveryBrowseListSessionReadInput
): DiscoveryBrowseListSessionSnapshot => {
  const listCat = resolveDiscoveryBrowseListCat(input);
  const rawFilters = parseBrowseListFilterState(input.searchParams);
  const filters =
    listCat === 'activities' || listCat === 'venues'
      ? scopeBrowseListStateForListCat(rawFilters, listCat)
      : rawFilters;

  return {
    listCat,
    filters,
    venueRegions: parseBrowseListVenueRegions(input.searchParams),
    geoPath: parseBrowseListGeoPath(input.searchParams),
    layout: parseBrowseListLayout(input.searchParams.get(LIST_LAYOUT_PARAM)),
    sort: parseBrowseListSort(input.searchParams.get(LIST_SORT_PARAM)),
    crewsOpenLens: parseCrewsAvailabilityShapeFilter(input.searchParams.get(CREWS_OPEN_URL_PARAM)),
    crewsAvailabilityGuideFilter: parseCrewsAvailabilityGuideFilter(
      input.searchParams.get(CREWS_AVAIL_GUIDE_PARAM)
    ),
  };
};