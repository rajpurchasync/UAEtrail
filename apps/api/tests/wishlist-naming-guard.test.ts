import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_SRC = join(process.cwd(), 'src');

const ALLOWLIST = new Set([
  'src/lib/collections.ts',
  'src/lib/mongo-migrations.ts',
  'src/routes/user/registerMeWishlistRoutes.ts',
  'tests/wishlist-naming-guard.test.ts',
]);

const BANNED: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /\bfavorites-store\b/, hint: 'Use wishlist-store' },
  { pattern: /\bcreateUserFavorite\b/, hint: 'Use createWishlistItem' },
  { pattern: /\bUSER_FAVORITES\b/, hint: 'Use COLLECTIONS.USER_WISHLIST' },
  { pattern: /['"`]\/me\/favorites['"`]/, hint: 'Use /me/wishlist' },
  { pattern: /\bfavoriteId\s*:/, hint: 'Use wishlistItemId' },
];

const collectTsFiles = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      out.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return out;
};

describe('wishlist naming guard (API)', () => {
  it('API source uses wishlist vocabulary', () => {
    const violations: string[] = [];
    for (const file of collectTsFiles(API_SRC)) {
      if (ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      for (const { pattern, hint } of BANNED) {
        if (pattern.test(content)) {
          violations.push(`${file}: ${hint}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
