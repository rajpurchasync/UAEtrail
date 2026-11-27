import { useBrowseGeoScopeHydration } from './discoveryPortListBrowseHooks';

/** B-UNIFY-04 — geo tree hydration for map + list discovery shells (shared browse spine). */
export const useDiscoveryBrowseGeoScope = (geoPath: readonly string[]): number =>
  useBrowseGeoScopeHydration(geoPath);