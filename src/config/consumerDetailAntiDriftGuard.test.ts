import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

/**
 * consumer-detail-surfaces plan §15.3 — back nav + tab chrome on entity detail surfaces.
 */
const DETAIL_BACK_VIA_CATALOG: Array<{ path: string; pattern: RegExp }> = [
  { path: 'src/pages/ActivityDetail.tsx', pattern: /ActivityDetailByKind/ },
  { path: 'src/activity/detail/templates/ActivityDetailPageShell.tsx', pattern: /ActivityDetailView/ },
  { path: 'src/components/activity/ActivityDetailView.tsx', pattern: /detailBackPath/ },
  { path: 'src/place/detail/templates/PlaceConsumerDetailPage.tsx', pattern: /detailBackPath/ },
  { path: 'src/pages/AreaDetailPage.tsx', pattern: /detailBackPath/ },
  { path: 'src/components/shop/ShopPublicPage.tsx', pattern: /detailBackPath\(['"]shop['"]\)/ },
  { path: 'src/components/organisation-console/OrganisationPublicProfile.tsx', pattern: /detailBackPath/ },
];

const MEMBER_HUB_SHELL = [{ path: 'src/pages/MemberProfile.tsx', pattern: /ConsumerShell/ }];

describe('consumerDetailAntiDriftGuard (plan §15.3)', () => {
  it('entity detail routes do not render global marketing Footer under sticky CTAs', () => {
    const shell = read('src/components/layout/ProductShell.tsx');
    expect(shell).toMatch(/shouldShowMarketingSiteFooter/);
    expect(read('src/config/platform.ts')).toMatch(/isConsumerEntityDetailRoute/);
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
