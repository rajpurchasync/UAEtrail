export type ListDiscoverySurface = 'standalone' | 'mapOverlay' | 'exploreSidebar';

/** Discover UI embedded on `/explore` (People sheet + desktop catalog drawer). */
export const listDiscoveryEmbeddedOnExplore = (surface: ListDiscoverySurface): boolean =>
  surface === 'mapOverlay' || surface === 'exploreSidebar';
