export type ListDiscoverySurface = 'standalone' | 'mapOverlay' | 'exploreSidebar';

/** Discover UI embedded on `/explore` (sheet or desktop column) — shares URL + `list=1`. */
export const listDiscoveryEmbeddedOnExplore = (surface: ListDiscoverySurface): boolean =>
  surface === 'mapOverlay' || surface === 'exploreSidebar';
