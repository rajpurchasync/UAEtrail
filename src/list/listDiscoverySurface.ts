export type ListDiscoverySurface = 'standalone' | 'mapOverlay' | 'exploreSidebar';

/** Discover UI embedded on `/explore` (People sheet only). Catalog list is `/list`. */
export const listDiscoveryEmbeddedOnExplore = (surface: ListDiscoverySurface): boolean =>
  surface === 'mapOverlay' || surface === 'exploreSidebar';
