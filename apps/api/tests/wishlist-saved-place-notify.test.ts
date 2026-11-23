import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('wishlist saved place publish notify', () => {
  it('fans out to locationId wishlist savers when an activity publishes', () => {
    const alerts = read('src/services/matching/wishlist-match-notify.ts');
    const store = read('src/lib/wishlist-store.ts');
    const activities = read('src/lib/activities-store.ts');

    expect(store).toMatch(/listWishlistSaversForLocation/);
    expect(store).toMatch(/listWishlistSaversForArea/);
    expect(alerts).toMatch(/listWishlistSaversForLocation/);
    expect(alerts).toMatch(/fanOutSavedPlaceWishlistNotifications/);
    expect(alerts).toMatch(/kind: 'wishlist_match'/);
    expect(alerts).toMatch(/activityDetailPath/);
    expect(activities).toMatch(/notifyWishlistForPublishedActivity/);
  });
});
