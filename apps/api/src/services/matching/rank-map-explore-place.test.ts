import { describe, expect, it } from 'vitest';
import type { Location } from '../../domain/types.js';
import { rankMapExplorePlace } from './rank-map-explore-place.js';

const baseLocation = (): Location =>
  ({
    id: 'loc-1',
    name: 'Wadi Trail',
    featured: false,
    latitude: 25,
    longitude: 55,
    areaId: 'area-1',
  }) as Location;

describe('rankMapExplorePlace', () => {
  it('boosts wishlist saved places', () => {
    const ranked = rankMapExplorePlace({
      location: baseLocation(),
      wishlistLocationIds: new Set(['loc-1']),
      wishlistDestinationIds: new Set(),
    });
    expect(ranked?.signals).toContain('wishlist_place');
    expect(ranked?.exploreItemId).toBe('venue:loc-1');
  });
});