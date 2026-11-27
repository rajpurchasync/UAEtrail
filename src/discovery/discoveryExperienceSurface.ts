/**
 * B-UNIFY-04 — canonical discovery experience surfaces (map shell, list routes, explore embeds).
 */
export type DiscoveryExperienceSurface =
  | 'standalone'
  | 'mapOverlay'
  | 'exploreSidebar'
  | 'exploreSearch';

/** Discover UI embedded on `/explore` (People sheet + desktop catalog drawer). */
export const listDiscoveryEmbeddedOnExplore = (surface: DiscoveryExperienceSurface): boolean =>
  surface === 'mapOverlay' || surface === 'exploreSidebar';

/** `/explore/search` results — narrow list chrome; external search bar owns query. */
export const listDiscoverySearchChrome = (surface: DiscoveryExperienceSurface): boolean =>
  surface === 'exploreSearch';

/** Search results — chrome owns where/when; list is a single scoped explorer. */
export const listDiscoveryExploreSearch = (surface: DiscoveryExperienceSurface): boolean =>
  surface === 'exploreSearch';

export type DiscoveryListUrlStateOptions = {
  mapOverlay: boolean;
  searchResultsBrowse: boolean;
};

export const discoveryListUrlStateOptionsForSurface = (
  surface: DiscoveryExperienceSurface
): DiscoveryListUrlStateOptions => ({
  mapOverlay: listDiscoveryEmbeddedOnExplore(surface),
  searchResultsBrowse: listDiscoverySearchChrome(surface),
});