export type ListDiscoverySurface =
  | 'standalone'
  | 'mapOverlay'
  | 'exploreSidebar'
  | 'exploreSearch';

/** Discover UI embedded on `/explore` (People sheet + desktop catalog drawer). */
export const listDiscoveryEmbeddedOnExplore = (surface: ListDiscoverySurface): boolean =>
  surface === 'mapOverlay' || surface === 'exploreSidebar';

/** `/explore/search` results — narrow list chrome; external search bar owns query. */
export const listDiscoverySearchChrome = (surface: ListDiscoverySurface): boolean =>
  surface === 'exploreSearch';

/** Search results — chrome owns where/when; list is a single scoped explorer. */
export const listDiscoveryExploreSearch = (surface: ListDiscoverySurface): boolean =>
  surface === 'exploreSearch';