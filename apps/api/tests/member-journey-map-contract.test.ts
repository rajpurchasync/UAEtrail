import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('Member journey map HTTP contract', () => {
  it('read model is GET /me/journey-map (not legacy /me/trips/map)', () => {
    const routes = read('src/routes/user/registerMeMapPinsRoutes.ts');
    expect(routes).toContain("'/me/journey-map'");
    expect(routes).not.toContain("'/me/trips/map'");
    expect(routes).toContain("'/me/map-pins'");
    expect(routes).toContain('me-map-pins-read');
    const readService = read('src/services/me-map-pins-read.ts');
    expect(readService).toContain('buildMemberJourneyMap');
  });

  it('composes catalog wishlist venues onto journey map entries', () => {
    const store = read('src/lib/wishlist-store.ts');
    const entries = read('src/services/member-outdoor-map-entries.ts');
    const map = read('src/services/member-journey-map.ts');
    expect(store).toContain('listWishlistVenuesForJourneyMap');
    expect(entries).toContain('listWishlistVenuesForJourneyMap');
    expect(entries).toContain('place:');
    expect(entries).toContain('Want to go');
    expect(map).toContain("entry.categories.includes('wishlist')");
  });
});
