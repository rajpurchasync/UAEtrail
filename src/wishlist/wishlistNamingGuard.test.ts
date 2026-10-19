import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = [join(process.cwd(), 'src'), join(process.cwd(), 'apps/api/src')];

const ALLOWLIST = new Set([
  'src/wishlist/wishlistNamingGuard.test.ts',
  'src/api/apiClientSurfaceGuard.test.ts',
  'apps/api/src/lib/collections.ts',
  'apps/api/src/lib/mongo-migrations.ts',
  'apps/api/src/routes/user/registerMeWishlistRoutes.ts',
  'apps/api/scripts/logOmarHostQaPlaybook.ts',
]);

const BANNED: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /\bfavorites-store\b/, hint: 'Use wishlist-store' },
  { pattern: /\bcreateUserFavorite\b/, hint: 'Use createWishlistItem' },
  { pattern: /\bgetMeFavorites\b/, hint: 'Use getMeWishlist' },
  { pattern: /['"`]\/me\/favorites['"`]/, hint: 'Use /me/wishlist' },
  { pattern: /\bFavoriteDTO\b/, hint: 'Use WishlistItemDTO' },
  { pattern: /\buseExploreSaveFavorite\b/, hint: 'Use useExploreWishlistSave' },
  { pattern: /\bresolveExploreFavoriteTarget\b/, hint: 'Use resolveExploreWishlistTarget' },
  { pattern: /\bcheckFavorite\b/, hint: 'Use checkWishlist' },
  { pattern: /\baddFavorite\b/, hint: 'Use addWishlistItem' },
  { pattern: /\bremoveFavorite\b/, hint: 'Use removeWishlistItem' },
];

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.d.ts')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('wishlistNamingGuard', () => {
  it('product code uses wishlist vocabulary (not favorites)', { timeout: 20_000 }, () => {
    const violations: string[] = [];

    for (const root of ROOTS) {
      for (const file of collectSourceFiles(root)) {
        if (ALLOWLIST.has(file)) continue;
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        for (const { pattern, hint } of BANNED) {
          if (pattern.test(content)) {
            violations.push(`${file}: ${hint}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
