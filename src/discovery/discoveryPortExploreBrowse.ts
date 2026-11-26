/** Browse / list–map handoff — taxonomy, URL state, destinations, nav chrome. */
export { type ExploreSearchScopeCounts, type ExploreSearchScopeKey } from '../explore/exploreBrowseTaxonomy';
export type { useExploreBrowseUrlState } from '../explore/ui/useExploreBrowseUrlState';
export { EXPLORE_DESKTOP_BROWSE_RAIL_SCROLL_CLASS } from '../explore/ui/exploreDesktopBrowseRailChrome';
export {
  useExplorePublishedDestinations,
  useExplorePublishedDestinationsQuery,
} from '../explore/useExplorePublishedDestinations';
export {
  parseExploreMapFilterPillsParam,
  serializeExploreMapFilterPillsParam,
  type ExploreMapFilterPillKey,
} from '../explore/exploreBrowseTaxonomy';