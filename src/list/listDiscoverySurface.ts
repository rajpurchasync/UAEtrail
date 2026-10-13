export type ListDiscoverySurface = 'standalone' | 'mapOverlay' | 'exploreSidebar';

/** Discover UI embedded on `/explore` (sheet or desktop column) — URL `browse=1`. */
export const listDiscoveryEmbeddedOnExplore = (surface: ListDiscoverySurface): boolean =>
  surface === 'mapOverlay' || surface === 'exploreSidebar';
