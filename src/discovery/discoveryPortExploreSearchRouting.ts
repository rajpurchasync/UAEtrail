/** W19/W42/W73 — explore search URL helpers (wire only; no search page UI). */
export {
  EXPLORE_SEARCH_RESULTS_PATH,
  EXPLORE_SEARCH_SCOPE_PARAM,
  EXPLORE_SEARCH_VIEW_PARAM,
  exploreSearchExploreMapPath,
  exploreSearchHomePath,
  exploreSearchListCatForScope,
  exploreSearchListPathFromMapSearch,
  exploreSearchMapViewPathFromListSearch,
  exploreSearchResultsPath,
  exploreSearchScopeForListCat,
  isExploreSearchHomeState,
  isExploreSearchResultsPath,
  parseExploreSearchBrowseState,
  parseExploreSearchScopeFromParams,
  type ExploreSearchScope,
} from '../explore/search/exploreSearchRouting';
export { countExploreSearchScopes, exploreItemMatchesQuery } from '../explore/exploreSearchMatches';
export { exploreSearchScopesForQuery } from '../explore/exploreSearchScopeUi';