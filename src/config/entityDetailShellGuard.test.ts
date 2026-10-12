import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

/** Entity detail routes must compose through allowlisted shells (S9 Phase 7). */
const ENTITY_DETAIL_PAGES: Array<{ path: string; mustMatch: RegExp }> = [
  { path: 'src/pages/AreaDetailPage.tsx', mustMatch: /MobileDetailShell|AreaDetailView/ },
  { path: 'src/pages/PlaceDetailPage.tsx', mustMatch: /PlaceDetailCore/ },
  { path: 'src/pages/ActivityDetail.tsx', mustMatch: /ActivityDetailView|MobileDetailShell/ },
  { path: 'src/components/place/PlaceDetailCore.tsx', mustMatch: /MobileDetailShell/ },
  { path: 'src/components/shop/ShopPublicPage.tsx', mustMatch: /MobileDetailShell/ },
];

describe('entityDetailShellGuard', () => {
  it('catalog entity pages use MobileDetailShell or approved view wrapper', () => {
    const violations: string[] = [];
    for (const { path, mustMatch } of ENTITY_DETAIL_PAGES) {
      const source = read(path);
      if (!mustMatch.test(source)) {
        violations.push(`${path}: missing shell wrapper`);
      }
    }
    expect(violations).toEqual([]);
  });
});
