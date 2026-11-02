/** Leaflet cluster radius — tighter as the user zooms in so nearby pins split, then same-spot spiderfies. */
export const exploreMapClusterRadiusPx = (zoom: number): number => {
  if (zoom < 9) return 80;
  if (zoom < 12) return 58;
  if (zoom < 15) return 44;
  return 36;
};

/** Cluster bounds shorter than this (meters) are one spot — spiderfy instead of zooming. */
export const EXPLORE_MAP_CLUSTER_SAME_SPOT_METERS = 18;

export const exploreMapClusterIsSameSpot = (distanceMeters: number): boolean =>
  distanceMeters < EXPLORE_MAP_CLUSTER_SAME_SPOT_METERS;
