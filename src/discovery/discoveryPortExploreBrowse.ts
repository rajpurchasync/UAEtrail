/** Browse / list–map handoff — taxonomy, URL state, destinations, nav chrome. */
export {
  EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES,
  EXPLORE_SEARCH_OPEN_PLACEHOLDER,
  EXPLORE_SEARCH_PROMPT,
  type ExploreSearchScopeCounts,
  type ExploreSearchScopeKey,
} from '../explore/exploreBrowseTaxonomy';
export type { useExploreBrowseUrlState } from '../explore/ui/useExploreBrowseUrlState';
export { isDiscoverBrowseRoute } from '../explore/exploreDiscoverBrowse';
export { EXPLORE_DESKTOP_BROWSE_RAIL_SCROLL_CLASS } from '../explore/ui/exploreDesktopBrowseRailChrome';
export { exploreMapPathAfterPeopleFullScreen } from '../explore/exploreBrowseReturnPath';
export {
  useExplorePublishedDestinations,
  useExplorePublishedDestinationsQuery,
} from '../explore/useExplorePublishedDestinations';
export { parseExploreDestinationSlug } from '../explore/exploreDestinationFilter';