/**
 * @deprecated Use `src/explore/search/exploreSearchRouting.ts` — `/explore/hub` routes redirect in AppRoutes.
 */
import {
  EXPLORE_SEARCH_RESULTS_PATH,
  EXPLORE_SEARCH_SCOPE_PARAM,
  LEGACY_HUB_MODE_PARAM,
  defaultExploreSearchBrowseState,
  exploreSearchJoinListFilters,
  exploreSearchExploreMapPath,
  exploreSearchListPathFromMapSearch,
  exploreSearchMapViewPathFromListSearch,
  exploreSearchModalEntryPath,
  exploreSearchListCatForScope,
  exploreSearchResultsPath,
  exploreSearchScopeForListCat,
  isExploreSearchResultsPath,
  parseExploreSearchBrowseState,
  parseExploreSearchScope,
  parseExploreSearchScopeFromParams,
  type ExploreSearchBrowseState,
  type ExploreSearchPathOptions,
  type ExploreSearchScope,
} from '../search/exploreSearchRouting';

export {
  EXPLORE_SEARCH_RESULTS_PATH,
  EXPLORE_SEARCH_SCOPE_PARAM,
  LEGACY_HUB_MODE_PARAM,
  defaultExploreSearchBrowseState,
  exploreSearchJoinListFilters,
  exploreSearchExploreMapPath,
  exploreSearchListPathFromMapSearch,
  exploreSearchMapViewPathFromListSearch,
  exploreSearchModalEntryPath,
  exploreSearchListCatForScope,
  exploreSearchResultsPath,
  exploreSearchScopeForListCat,
  isExploreSearchResultsPath,
  parseExploreSearchBrowseState,
  parseExploreSearchScope,
  parseExploreSearchScopeFromParams,
  exploreHubLegacyRedirectTarget,
} from '../search/exploreSearchRouting';

/** @deprecated */
export const EXPLORE_HUB_PATH = '/explore/hub';
/** @deprecated */
export const EXPLORE_HUB_MAP_PATH = '/explore/hub/map';
/** @deprecated */
export const EXPLORE_HUB_HOME_PATH = '/explore/hub/home';
/** @deprecated */
export const EXPLORE_HUB_SEARCH_PATH = EXPLORE_SEARCH_RESULTS_PATH;
/** @deprecated */
export const EXPLORE_HUB_MODE_PARAM = LEGACY_HUB_MODE_PARAM;

/** @deprecated */
export type ExploreHubMode = ExploreSearchScope;
/** @deprecated */
export const parseExploreHubMode = parseExploreSearchScope;
/** @deprecated */
export const exploreHubListCatForMode = exploreSearchListCatForScope;
/** @deprecated */
export const exploreHubModeForListCat = exploreSearchScopeForListCat;
/** @deprecated */
export type ExploreHubBrowseState = ExploreSearchBrowseState & { hubMode: ExploreSearchScope };

/** @deprecated */
export const parseExploreHubBrowseState = (params: URLSearchParams): ExploreHubBrowseState => {
  const state = parseExploreSearchBrowseState(params);
  return { ...state, hubMode: state.searchScope };
};

/** @deprecated */
export type ExploreHubPathOptions = Partial<ExploreSearchBrowseState & { hubMode?: ExploreSearchScope }>;

const toSearchOptions = (options?: ExploreHubPathOptions): ExploreSearchPathOptions | undefined => {
  if (!options) return undefined;
  const { hubMode, searchScope, ...rest } = options;
  return { ...rest, searchScope: searchScope ?? hubMode };
};

/** @deprecated */
export const exploreHubSearchPath = (options?: ExploreHubPathOptions) =>
  exploreSearchResultsPath(toSearchOptions(options));

/** @deprecated */
export const exploreHubLandingPath = (
  options?: Pick<ExploreHubPathOptions, 'query' | 'activityDatePreset' | 'venueRegions' | 'hubMode' | 'searchScope'>
) => exploreSearchModalEntryPath(toSearchOptions(options));

/** @deprecated */
export const exploreHubHomePath = exploreHubSearchPath;

/** @deprecated */
export const exploreHubMapPath = (options?: ExploreHubPathOptions) =>
  exploreSearchExploreMapPath(toSearchOptions(options));

/** @deprecated */
export const exploreHubMapPathFromListSearch = exploreSearchMapViewPathFromListSearch;

/** @deprecated */
export const exploreHubListPathFromMapSearch = exploreSearchListPathFromMapSearch;

/** @deprecated */
export const isExploreHubEmbeddedChromePath = isExploreSearchResultsPath;

/** @deprecated */
export const defaultExploreHubBrowseState = defaultExploreSearchBrowseState;

/** @deprecated */
export const exploreHubJoinListFilters = exploreSearchJoinListFilters;