import { describe, expect, it } from 'vitest';
import { wishlistWatchMatchesPin } from '../src/lib/wishlist-match.js';

describe('wishlistWatchMatchesPin', () => {
  const watch = {
    userId: 'user-a',
    wishlistItemId: 'wl-1',
    alertOnMatch: true,
    watchOutingCategory: 'hiking' as const,
    watchLatitude: 25.1,
    watchLongitude: 55.2,
  };

  it('matches organize pin in same category within radius', () => {
    expect(
      wishlistWatchMatchesPin(watch, {
        composeIntent: 'organize',
        outingCategory: 'hiking',
        latitude: 25.11,
        longitude: 55.21,
        actorUserId: 'user-b',
      })
    ).toBe(true);
  });

  it('skips self-authored pins', () => {
    expect(
      wishlistWatchMatchesPin(watch, {
        composeIntent: 'organize',
        outingCategory: 'hiking',
        latitude: 25.11,
        longitude: 55.21,
        actorUserId: 'user-a',
      })
    ).toBe(false);
  });

  it('rejects different outing category', () => {
    expect(
      wishlistWatchMatchesPin(watch, {
        composeIntent: 'demand',
        outingCategory: 'camping',
        latitude: 25.11,
        longitude: 55.21,
        actorUserId: 'user-b',
      })
    ).toBe(false);
  });
});
