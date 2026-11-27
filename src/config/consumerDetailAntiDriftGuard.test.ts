import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isEntityDetailRoute, isMobileDetailRoute } from './platform';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

/**
 * consumer-detail-surfaces plan §15.3 — back nav + tab chrome on entity detail surfaces.
 */
const DETAIL_BACK_VIA_CATALOG: Array<{ path: string; pattern: RegExp }> = [
  { path: 'src/pages/ActivityDetail.tsx', pattern: /ActivityDetailByKind/ },
  { path: 'src/activity/detail/templates/ActivityDetailPageShell.tsx', pattern: /ActivityDetailView/ },
  { path: 'src/components/activity/ActivityDetailView.tsx', pattern: /detailBackPath/ },
  { path: 'src/place/detail/templates/PlaceDetailSections.tsx', pattern: /detailBackPath/ },
  { path: 'src/pages/DestinationDetailPage.tsx', pattern: /detailBackPath/ },
  { path: 'src/components/shop/ShopPublicPage.tsx', pattern: /detailBackPath\(['"]shop['"]\)/ },
  { path: 'src/operator/public/OrganisationPublicProfile.tsx', pattern: /detailBackPath/ },
];

const MEMBER_HUB_SHELL = [{ path: 'src/pages/MemberProfile.tsx', pattern: /ConsumerShell/ }];

describe('consumerDetailAntiDriftGuard (plan §15.3)', () => {
  it('product shell does not render global marketing Footer (entity pages use sticky CTAs only)', () => {
    const shell = read('src/components/layout/ProductShell.tsx');
    expect(shell).not.toMatch(/<Footer\b/);
    expect(read('src/config/platform.ts')).toMatch(/isEntityDetailRoute/);
  });

  it('facility detail is an entity route (single detail header)', () => {
    expect(isMobileDetailRoute('/facility/seed-toilet-01')).toBe(true);
    expect(isEntityDetailRoute('/facility/seed-toilet-01')).toBe(true);
    expect(read('src/components/layout/ProductShell.tsx')).not.toMatch(/MobileConsumerNavBar/);
    const tabHeader = read('src/config/mobileTabHeader.ts');
    expect(tabHeader).toMatch(/isEntityDetailRoute/);
    expect(tabHeader).not.toMatch(/isConsumerEntityDetailRoute/);
  });

  it('entity detail surfaces use detailBackPath from routing catalog for shell back', () => {
    const violations: string[] = [];
    for (const { path, pattern } of DETAIL_BACK_VIA_CATALOG) {
      if (!pattern.test(read(path))) {
        violations.push(path);
      }
    }
    expect(violations).toEqual([]);
  });

  it('DetailPageShell composes MobileDetailScrollShell (not retired modal shim)', () => {
    const shell = read('src/detail/shell/DetailPageShell.tsx');
    expect(shell).toMatch(/MobileDetailScrollShell/);
    expect(shell).not.toMatch(/ActivityConsumerDetailModalShell/);
  });

  it('entity detail sticky headers omit bell and hamburger by default', () => {
    expect(read('src/components/mobile/MobileDetailScrollShell.tsx')).toMatch(/showMenu = false/);
    expect(read('src/components/mobile/MobileDetailShell.tsx')).toMatch(/showMenu = false/);
    const platform = read('src/config/platform.ts');
    expect(platform).toMatch(/isEntityDetailRoute\(pathname\)\) return false/);
    expect(platform).toMatch(/pathname\.startsWith\('\/member\/'\)\) return false/);
  });

  it('member public profile uses ConsumerShell hub layout (not entity detail shell)', () => {
    const violations: string[] = [];
    for (const { path, pattern } of MEMBER_HUB_SHELL) {
      if (!pattern.test(read(path))) {
        violations.push(path);
      }
    }
    expect(violations).toEqual([]);
  });
});
