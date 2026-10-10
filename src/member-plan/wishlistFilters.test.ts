import { describe, expect, it } from 'vitest';
import type { WishlistItemDTO } from '@uaetrail/shared-types';
import { wishlistItemIsDemandBookmark } from './wishlistDemandBookmark';
import { wishlistItemIsPersonal, wishlistItemMatchesTripsHubLayer } from './wishlistFilters';

const item = (overrides: Partial<WishlistItemDTO>): WishlistItemDTO =>
  ({
    id: 'w1',
    locationId: null,
    activityId: null,
    ...overrides,
  }) as WishlistItemDTO;

describe('wishlistFilters', () => {
  it('demand bookmarks are never stored as wishlist rows', () => {
    expect(wishlistItemIsDemandBookmark(item({}))).toBe(false);
    expect(wishlistItemIsPersonal(item({}))).toBe(true);
  });

  it('maps hub layers for venue and activity saves', () => {
    expect(wishlistItemMatchesTripsHubLayer(item({ locationId: 'loc-1' }), 'places')).toBe(true);
    expect(wishlistItemMatchesTripsHubLayer(item({ locationId: 'loc-1' }), 'trips')).toBe(false);
    expect(wishlistItemMatchesTripsHubLayer(item({ activityId: 'a1' }), 'trips')).toBe(true);
    expect(wishlistItemMatchesTripsHubLayer(item({ activityId: 'a1' }), 'shops')).toBe(false);
  });
});
