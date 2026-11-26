/**
 * W10/W42/W73 — search facade: URL wire + scope UI + feed helpers (wire via SearchRouting).
 */
export {
  EXPLORE_SEARCH_RESULTS_PATH,
  EXPLORE_SEARCH_SCOPE_PARAM,
  EXPLORE_SEARCH_VIEW_PARAM,
  exploreSearchHomePath,
  exploreSearchListCatForScope,
  exploreSearchMapViewPathFromListSearch,
  exploreSearchResultsPath,
  exploreSearchScopeForListCat,
  isExploreSearchHomeState,
  parseExploreSearchBrowseState,
  parseExploreSearchScopeFromParams,
} from './discoveryPortExploreSearchRouting';
export { exploreSearchScopesForQuery } from '../explore/exploreSearchScopeUi';
export { ExploreSearchScopeHints } from '../explore/ui/ExploreSearchScopeHints';
export {
  resolveExploreSearchJoinableTripCards,
  resolveExploreSearchTripPool,
  resolveExploreSearchVenuePool,
} from '../explore/search/exploreSearchJoinablePools';
export { exploreSearchComposeFeedMode } from '../explore/search/exploreSearchComposeMode';
export { EXPLORE_SEARCH_MATCHES_TITLE } from '../explore/search/exploreSearchHomeCopy';
export { resolveExploreSearchDetectedWhereQuery } from '../explore/search/exploreSearchDetectedWhere';
export { exploreSearchWhereBrowseQuery } from '../explore/search/exploreSearchWhereQuery';
export { useExploreSearchCommunityGroups } from '../explore/search/useExploreSearchCommunityGroups';
export { ExploreSearchBookingHero } from '../explore/search/ExploreSearchBookingHero';
export { ExploreSearchInboundRedirectHost } from '../explore/search/ExploreSearchInboundRedirectHost';
export { EXPLORE_SEARCH_SCOPES_SHIPPED, type ExploreSearchScopeKey } from './discoveryPortExploreSearchRouting';