import { describe, expect, it } from 'vitest';
import { exploreMapClusterIsSameSpot, exploreMapClusterRadiusPx } from './exploreMapCluster';

describe('explore map cluster', () => {
  it('uses a wide radius at country zoom and tightens as the user zooms in', () => {
    expect(exploreMapClusterRadiusPx(7)).toBe(80);
    expect(exploreMapClusterRadiusPx(10)).toBe(58);
    expect(exploreMapClusterRadiusPx(13)).toBe(44);
    expect(exploreMapClusterRadiusPx(16)).toBe(36);
  });

  it('treats sub-18m clusters as the same spot', () => {
    expect(exploreMapClusterIsSameSpot(4)).toBe(true);
    expect(exploreMapClusterIsSameSpot(18)).toBe(false);
  });
});
