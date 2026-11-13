import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('wishlist area trip alerts', () => {
  it('persists areaId on wishlist rows with indexes and check route', () => {
    const store = read('src/lib/wishlist-store.ts');
    const routes = read('src/routes/user/registerMeWishlistRoutes.ts');
    const indexes = read('src/lib/mongo-indexes.ts');
    expect(store).toMatch(/areaId/);
    expect(store).toMatch(/listWishlistSaversForArea/);
    expect(routes).toMatch(/areaId/);
    expect(indexes).toMatch(/userId_areaId_unique/);
    expect(indexes).toMatch(/wishlist_areaId/);
  });

  it('fans out published and seeking activity notifications to area savers', () => {
    const alerts = read('src/services/wishlist-alerts.ts');
    expect(alerts).toMatch(/fanOutSavedAreaWishlistNotifications/);
    expect(alerts).toMatch(/listWishlistSaversForArea/);
    expect(alerts).toMatch(/New outing in/);
    expect(alerts).toMatch(/activityAreaId/);
  });

  it('validates published area on create', () => {
    const commands = read('src/services/me-wishlist-commands.ts');
    expect(commands).toMatch(/findPublishedAreaById/);
    expect(commands).toMatch(/area_not_found/);
  });
});
