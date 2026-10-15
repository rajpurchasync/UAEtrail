import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

/** S9 Phase 7 — cross-surface wiring called out in consumer-detail-surfaces §8. */
describe('consumerDetailSurfacesAcceptance', () => {
  it('routes /people to explore people browse (single crew URL)', () => {
    const app = read('src/App.tsx');
    expect(app).toMatch(/path="\/people"/);
    expect(app).toMatch(/explorePeopleBrowsePath\(\)/);
  });

  it('entity detail views use tab wire modules and shared tab chrome', () => {
    const surfaces: Array<{ file: string; wire: string; tabChrome: RegExp }> = [
      {
        file: 'src/components/place/PlaceDetailCore.tsx',
        wire: 'placeDetailTab',
        tabChrome: /PlaceDetailTabs/,
      },
      {
        file: 'src/components/ui/PlaceDetailTabs.tsx',
        wire: 'placeDetailTab',
        tabChrome: /ConsumerEntityTabBar/,
      },
      {
        file: 'src/components/area/AreaDetailView.tsx',
        wire: 'areaDetailTab',
        tabChrome: /ConsumerEntityTabBar/,
      },
      {
        file: 'src/components/shop/ShopPublicPage.tsx',
        wire: 'shopPublicDetailTab',
        tabChrome: /ConsumerEntityTabBar/,
      },
      {
        file: 'src/pages/OrganisationProfile.tsx',
        wire: 'organisationPublicDetailTab',
        tabChrome: /OrganisationPublicProfile/,
      },
      {
        file: 'src/components/organisation-console/OrganisationPublicProfile.tsx',
        wire: 'organisationPublicDetailTab',
        tabChrome: /ConsumerEntityTabBar/,
      },
      {
        file: 'src/components/activity/detail/ActivityDetailTabBar.tsx',
        wire: 'activityDetailTab',
        tabChrome: /ConsumerEntityTabBar/,
      },
    ];
    const violations: string[] = [];
    for (const { file, wire, tabChrome } of surfaces) {
      const source = read(file);
      if (!tabChrome.test(source)) {
        violations.push(`${file}: missing tab chrome (${tabChrome})`);
      }
      if (!source.includes(wire)) {
        violations.push(`${file}: missing ${wire} import/usage`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('S9-ACT-01: consumer activity route uses kind templates (not direct ActivityDetailView)', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/ActivityDetailByKind/);
    expect(page).not.toMatch(/<ActivityDetailView/);
    expect(read('src/activity/detail/activityDetailKind.ts')).toMatch(/resolveActivityDetailKind/);
  });
});
