/**
 * List projection facade for explore discovery primitives (DMCP Phase 3).
 * Leaf list modules import here — not `../../explore/*` — keeps import audit under budget.
 *
 * @see src/explore/discoveryRuntime.ts · scripts/governance/discovery-import-audit.json
 */
export * from '../../explore/discoveryRuntime';

export { parseExploreAreaSlug } from '../../explore/exploreAreaFilter';

export {
  useExplorePublishedAreas,
  useExplorePublishedAreasQuery,
} from '../../explore/useExplorePublishedAreas';

export { exploreCatalogHubLabelFromExploreItem as browseCatalogHubLabelFromExploreItem } from '../../explore/exploreCatalogHubLabel';

export { EXPLORE_RIDESHARE_AVAILABLE_BADGE } from '../../explore/exploreRequirementBadges';

export type { ExploreSearchScopeCounts } from '../../explore/exploreBrowseTaxonomy';

export { DiscoveryCardTypeIcon } from '../../explore/ui/DiscoveryCardTypeIcon';

export { ExploreJoinOverlays } from '../../explore/ui/ExploreJoinOverlays';

export {
  buildMapPeekReturnPath,
  mapPeekDetailNavState,
  type MapPeekDetailNavState,
} from '../../explore/mapPeekDetailNavState';

export { useExploreMapChrome } from '../../explore/ExploreMapChromeContext';