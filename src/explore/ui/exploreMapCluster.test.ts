import { describe, expect, it } from 'vitest';
import {
  EXPLORE_MAP_CLUSTER_DISABLE_AT_ZOOM,
  exploreMapClusterIsSameSpot,
  exploreMapClusterRadiusPx,
} from './exploreMapCluster';

describe('explore map cluster', () => {
  it('disables clustering at country and regional zoom', () => {
    expect(EXPLORE_MAP_CLUSTER_DISABLE_AT_ZOOM).toBe(10);
  });

  it('uses moderate radius only when zoomed in past disable threshold', () => {
    expect(exploreMapClusterRadiusPx(7)).toBe(36);
    expect(exploreMapClusterRadiusPx(10)).toBe(36);
    expect(exploreMapClusterRadiusPx(13)).toBe(44);
    expect(exploreMapClusterRadiusPx(16)).toBe(36);
  });

  it('treats sub-18m clusters as the same spot', () => {
    expect(exploreMapClusterIsSameSpot(4)).toBe(true);
    expect(exploreMapClusterIsSameSpot(18)).toBe(false);
  });
});
