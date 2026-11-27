/** W19/W42/W73/W87 — search URL + feed wire (no search page UI / UI hooks). */
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
export { exploreSearchWhereBrowseQuery } from '../explore/search/exploreSearchWhereQuery';
export { resolveExploreSearchDetectedWhereQuery } from '../explore/search/exploreSearchDetectedWhere';
export {
  resolveExploreSearchJoinableTripCards,
  resolveExploreSearchTripPool,
  resolveExploreSearchVenuePool,
} from '../explore/search/exploreSearchJoinablePools';
export { exploreSearchComposeFeedMode } from '../explore/search/exploreSearchComposeMode';
export {
  EXPLORE_SEARCH_MAP_MATCHES_TITLE,
  EXPLORE_SEARCH_MATCHES_TITLE,
  resolveExploreSearchBookingWherePlaceholder,
} from '../explore/search/exploreSearchHomeCopy';