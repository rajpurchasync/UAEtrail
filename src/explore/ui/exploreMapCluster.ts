/** At this zoom and below, pins stay on their own coordinates (no centroid mega-clusters). */
export const EXPLORE_MAP_CLUSTER_DISABLE_AT_ZOOM = 10;

/** Leaflet cluster radius — tighter as the user zooms in so only nearby pins merge. */
export const exploreMapClusterRadiusPx = (zoom: number): number => {
  if (zoom < 12) return 36;
  if (zoom < 15) return 44;
  return 36;
};

/** Cluster bounds shorter than this (meters) are one spot — spiderfy instead of zooming. */
export const EXPLORE_MAP_CLUSTER_SAME_SPOT_METERS = 18;

export const exploreMapClusterIsSameSpot = (distanceMeters: number): boolean =>
  distanceMeters < EXPLORE_MAP_CLUSTER_SAME_SPOT_METERS;
