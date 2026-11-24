import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('wishlist destination trip alerts', () => {
  it('persists destinationId on wishlist rows with indexes and check route', () => {
    const store = read('src/lib/wishlist-store.ts');
    const routes = read('src/routes/user/registerMeWishlistRoutes.ts');
    const indexes = read('src/lib/mongo-indexes.ts');
    expect(store).toMatch(/destinationId/);
    expect(store).toMatch(/listWishlistSaversForDestination/);
    expect(routes).toMatch(/destinationId/);
    expect(indexes).toMatch(/userId_destinationId_unique/);
    expect(indexes).toMatch(/wishlist_destinationId/);
  });

  it('fans out published and seeking activity notifications to destination savers', () => {
    const alerts = read('src/services/matching/wishlist-match-notify.ts');
    expect(alerts).toMatch(/fanOutSavedDestinationWishlistNotifications/);
    expect(alerts).toMatch(/listWishlistSaversForDestination/);
    expect(alerts).toMatch(/New outing in/);
    expect(alerts).toMatch(/destinationId/);
  });

  it('validates published destination on create', () => {
    const commands = read('src/services/me-wishlist-commands.ts');
    expect(commands).toMatch(/findPublishedAreaById/);
    expect(commands).toMatch(/destination_not_found/);
  });
});