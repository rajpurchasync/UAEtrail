import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const ALLOW_ADD_WISHLIST_TARGET = new Set([
  'src/hooks/wishlistClientApi.ts',
  'src/wishlist/saveWishlistTarget.ts',
]);

const collectSourceFiles = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...collectSourceFiles(full));
    else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.d.ts')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('wishlistWriteFacadeGuard (PR-D)', () => {
  it('consumer writes use saveWishlistTarget facade', () => {
    expect(read('src/explore/ui/useExploreWishlistSave.ts')).toMatch(/saveWishlistFromResolvedTarget/);
    expect(read('src/components/plan/PlanWishlistPickSheet.tsx')).toMatch(/saveWishlistTarget/);
    expect(read('src/components/plan/PlanWishlistPickSheet.tsx')).not.toMatch(/addWishlistTarget/);
  });

  it('product UI does not call addWishlistTarget directly', () => {
    const violations: string[] = [];
    for (const file of collectSourceFiles(ROOT)) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
      if (!ALLOW_ADD_WISHLIST_TARGET.has(file) && /\baddWishlistTarget\b/.test(readFileSync(join(process.cwd(), file), 'utf8'))) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });

  it('compose wire does not emit wishlist tokens', () => {
    expect(read('packages/shared-types/src/compose-route.ts')).not.toMatch(/wishlist:/);
    expect(read('src/explore/compose.ts')).not.toMatch(/composeKind:\s*['"]wishlist['"]/);
    expect(existsSync(join(process.cwd(), 'src/wishlist/saveWishlistTarget.ts'))).toBe(true);
  });
});