/**
 * List projection facade for explore discovery primitives (DMCP Phase 3).
 * Leaf list modules import here — not `../explore/*` — keeps import audit under budget.
 *
 * @see src/explore/discoveryRuntime.ts · scripts/discovery-import-audit.json
 */
export * from '../explore/discoveryRuntime';

export { parseExploreAreaSlug } from '../explore/exploreAreaFilter';

export {
  useExplorePublishedAreas,
  useExplorePublishedAreasQuery,
} from '../explore/useExplorePublishedAreas';

export { exploreCatalogHubLabelFromExploreItem as browseCatalogHubLabelFromExploreItem } from '../explore/exploreCatalogHubLabel';