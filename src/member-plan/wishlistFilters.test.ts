import { describe, expect, it } from 'vitest';
import type { WishlistItemDTO } from '@uaetrail/shared-types';
import { wishlistItemIsPersonal, wishlistItemMatchesPlanWishlistLayer } from './wishlistFilters';

const item = (overrides: Partial<WishlistItemDTO>): WishlistItemDTO =>
  ({
    id: 'w1',
    locationId: null,
    activityId: null,
    ...overrides,
  }) as WishlistItemDTO;

describe('wishlistFilters', () => {
  it('wishlist rows are personal saves (seeking posts are not stored here)', () => {
    expect(wishlistItemIsPersonal(item({}))).toBe(true);
  });

  it('maps hub layers for venue and activity saves', () => {
    expect(wishlistItemMatchesPlanWishlistLayer(item({ locationId: 'loc-1' }), 'places')).toBe(true);
    expect(wishlistItemMatchesPlanWishlistLayer(item({ locationId: 'loc-1' }), 'activities')).toBe(false);
    expect(wishlistItemMatchesPlanWishlistLayer(item({ activityId: 'a1' }), 'activities')).toBe(true);
    expect(wishlistItemMatchesPlanWishlistLayer(item({ activityId: 'a1' }), 'shops')).toBe(false);
  });
});
