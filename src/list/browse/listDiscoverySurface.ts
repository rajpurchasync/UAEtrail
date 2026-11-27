/** B-UNIFY-04 — list re-export; canonical definitions in `discovery/discoveryExperienceSurface`. */
import type { DiscoveryExperienceSurface } from '../../discovery/discoveryExperienceSurface';

export type { DiscoveryExperienceSurface, DiscoveryListUrlStateOptions } from '../../discovery/discoveryExperienceSurface';
/** List route embed surface id (alias of {@link DiscoveryExperienceSurface}). */
export type ListDiscoverySurface = DiscoveryExperienceSurface;
export {
  discoveryListUrlStateOptionsForSurface,
  listDiscoveryEmbeddedOnExplore,
  listDiscoveryExploreSearch,
  listDiscoverySearchChrome,
} from '../../discovery/discoveryExperienceSurface';