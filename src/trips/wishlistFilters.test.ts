import { describe, expect, it } from 'vitest';
import type { FavoriteDTO } from '@uaetrail/shared-types';
import { favoriteIsDemandBookmark } from './favoriteDemandBookmark';
import { favoriteIsPersonalWishlist, favoriteMatchesTripsHubLayer } from './wishlistFilters';

const fav = (overrides: Partial<FavoriteDTO>): FavoriteDTO =>
  ({
    id: 'f1',
    createdAt: new Date().toISOString(),
    alertOnMatch: true,
    ...overrides,
  }) as FavoriteDTO;

describe('demand vs wishlist', () => {
  it('treats participant intent favorites as demand bookmarks, not wishlist', () => {
    expect(favoriteIsDemandBookmark(fav({ participantIntentId: 'd1' }))).toBe(true);
    expect(favoriteIsPersonalWishlist(fav({ participantIntentId: 'd1' }))).toBe(false);
    expect(favoriteMatchesTripsHubLayer(fav({ participantIntentId: 'd1' }), 'trips')).toBe(false);
  });

  it('routes personal saves by hub layer', () => {
    expect(favoriteMatchesTripsHubLayer(fav({ locationId: 'loc-1' }), 'places')).toBe(true);
    expect(favoriteMatchesTripsHubLayer(fav({ locationId: 'loc-1' }), 'trips')).toBe(false);
    expect(favoriteMatchesTripsHubLayer(fav({ activityId: 'a1' }), 'trips')).toBe(true);
    expect(favoriteMatchesTripsHubLayer(fav({ merchantId: 'm1' }), 'shops')).toBe(true);
  });
});
