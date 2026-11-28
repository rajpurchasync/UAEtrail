import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

/** Entity detail routes must compose through allowlisted shells (S9 Phase 7). */
const ENTITY_DETAIL_PAGES: Array<{ path: string; mustMatch: RegExp }> = [
  { path: 'src/pages/DestinationDetailPage.tsx', mustMatch: /DestinationDetailPageShell/ },
  { path: 'src/pages/PlaceDetailPage.tsx', mustMatch: /PlaceDetailPageShell/ },
  {
    path: 'src/pages/ActivityDetail.tsx',
    mustMatch: /ActivityDetailByKind|ActivityDetailPageShell/,
  },
  { path: 'src/pages/ShopPublic.tsx', mustMatch: /ShopPublicPage/ },
  { path: 'src/components/destination/DestinationDetailView.tsx', mustMatch: /DetailPageShell/ },
  { path: 'src/components/shop/ShopPublicPage.tsx', mustMatch: /DetailPageShell/ },
  { path: 'src/operator/public/TenantStorefrontPage.tsx', mustMatch: /EntityPublicDetailShell/ },
];

/** Page modules must not be full-screen roots without an approved shell (S9 Phase 7.2b). */
const ENTITY_DETAIL_PAGE_ROOTS = ENTITY_DETAIL_PAGES.filter(({ path }) => path.startsWith('src/pages/'));

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

  it('entity detail page modules delegate to shell views (no bare min-h-screen page roots)', () => {
    const violations: string[] = [];
    for (const { path, mustMatch } of ENTITY_DETAIL_PAGE_ROOTS) {
      const source = read(path);
      if (!mustMatch.test(source)) {
        violations.push(`${path}: missing delegated shell/view`);
      }
      const hasShellDelegate =
        /DetailPageShell|MobileDetailShell|MobileDetailScrollShell|EntityPublicDetailShell|ActivityDetailByKind|ActivityDetailPageShell|ActivityDetailView|PlaceDetailPageShell|DestinationDetailView|ShopPublicPage/.test(
          source
        );
      if (!hasShellDelegate) {
        violations.push(`${path}: page must delegate to approved detail view`);
      }
      if (/return\s*\(\s*<div[^>]*className="[^"]*min-h-screen/.test(source) && !hasShellDelegate) {
        violations.push(`${path}: ad-hoc min-h-screen root without shell delegate`);
      }
    }
    expect(violations).toEqual([]);
  });
});
