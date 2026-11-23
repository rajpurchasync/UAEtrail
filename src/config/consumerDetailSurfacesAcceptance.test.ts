import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readAppRouteRegistry } from '../../scripts/dev/readAppRouteRegistry.mjs';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

/** S9 Phase 7 — cross-surface wiring called out in consumer-detail-surfaces §8. */
describe('consumerDetailSurfacesAcceptance', () => {
  it('GW7-01: no /people SPA redirect — list people discovery via /list', () => {
    const app = readAppRouteRegistry();
    expect(app).not.toMatch(/path="\/people"/);
    expect(app).not.toMatch(/PeopleRedirect/);
    expect(read('src/list/browse/browseListRouting.ts')).toMatch(/listPeopleDiscoveryPath/);
  });

  it('entity detail views use tab wire modules and shared tab chrome', () => {
    const surfaces: Array<{ file: string; wire: string; tabChrome: RegExp }> = [
      {
        file: 'src/components/ui/PlaceDetailTabs.tsx',
        wire: 'placeDetailTab',
        tabChrome: /ConsumerEntityTabBar/,
      },
      {
        file: 'src/components/area/AreaDetailView.tsx',
        wire: 'areaDetailTab',
        tabChrome: /ConsumerDetailSectionJumpNav/,
      },
      {
        file: 'src/components/shop/ShopPublicPage.tsx',
        wire: 'shopPublicDetailTab',
        tabChrome: /ConsumerDetailSectionJumpNav/,
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

  it('S9-GUEST-01: activity detail guest sign-in is centralized (no duplicate peek strips)', () => {
    expect(read('src/components/activity/detail/ActivityDetailGuestGate.tsx')).toMatch(
      /join-activity/
    );
    expect(read('src/activity/detail/templates/ActivityDetailSections.tsx')).toMatch(
      /ActivityDetailGuestGate/
    );
  });

  it('S9-ACT-02: activity public scroll uses sections; embed keeps tab body', () => {
    const sections = read('src/activity/detail/templates/ActivityDetailSections.tsx');
    expect(sections).toMatch(/ActivityPeekLinkedTransport/);
    expect(sections).toMatch(/data-activity-scroll-detail-template/);
    expect(read('src/components/activity/detail/ActivityDetailBody.tsx')).toMatch(/ActivityDetailPlaceTabPanels/);
  });

  it('S9-ACT-01: consumer activity route uses kind templates (not direct ActivityDetailView)', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/ActivityDetailByKind/);
    expect(page).not.toMatch(/<ActivityDetailView/);
    expect(read('src/activity/detail/activityDetailKind.ts')).toMatch(/resolveActivityDetailKind/);
  });
});
