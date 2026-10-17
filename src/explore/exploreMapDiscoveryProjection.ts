/** Server L1 discovery projection on map items (`VITE_EXPLORE_MAP_DISCOVERY_PROJECTION=1`). */
export const isExploreMapDiscoveryProjectionEnabled = (): boolean =>
  import.meta.env.VITE_EXPLORE_MAP_DISCOVERY_PROJECTION === '1';
