import { describe, expect, it } from 'vitest';
import { isExploreMapDiscoveryProjectionEnabled } from './exploreMapDiscoveryProjection';

describe('exploreMapDiscoveryProjection', () => {
  it('requires VITE_EXPLORE_MAP_DISCOVERY_PROJECTION=1', () => {
    expect(isExploreMapDiscoveryProjectionEnabled()).toBe(false);
  });
});
