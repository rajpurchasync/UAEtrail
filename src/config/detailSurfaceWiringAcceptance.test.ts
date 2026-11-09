import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

/**
 * End-to-end consumer detail wiring (DOMAIN_CANONICALS §3.1–§3.2.1).
 */
describe('detailSurfaceWiringAcceptance', () => {
  it('DS-WIRE-01: route loaders → fetch facades → L3 shells', () => {
    const activityPage = read('src/pages/ActivityDetail.tsx');
    expect(activityPage).toMatch(/usePublicActivityDetail/);
    expect(activityPage).toMatch(/ActivityDetailByKind/);

    const placePage = read('src/pages/PlaceDetailPage.tsx');
    expect(placePage).toMatch(/usePlaceDetailCore/);
    expect(placePage).toMatch(/PlaceDetailPageShell/);
    for (const kindPage of [
      'src/pages/place/HikingPlaceDetailPage.tsx',
      'src/pages/place/CampingPlaceDetailPage.tsx',
      'src/pages/place/EventPlaceDetailPage.tsx',
    ]) {
      expect(existsSync(join(process.cwd(), kindPage))).toBe(false);
    }

    const areaPage = read('src/pages/AreaDetailPage.tsx');
    expect(areaPage).toMatch(/areaHubClientApi/);
    expect(areaPage).toMatch(/AreaDetailView/);

    const shopPage = read('src/pages/ShopPublic.tsx');
    expect(shopPage).toMatch(/shopPublicClientApi/);
    expect(shopPage).toMatch(/ShopPublicPage/);

    const orgPage = read('src/pages/OrganisationProfile.tsx');
    expect(orgPage).toMatch(/organisationConsoleApi/);
    expect(orgPage).toMatch(/EntityPublicDetailShell/);

    const memberPage = read('src/pages/MemberProfile.tsx');
    expect(memberPage).toMatch(/memberPublicProfileApi/);
  });

  it('DS-WIRE-02: map peek → detail link + activity guest gate on L3', () => {
    expect(read('src/explore/ui/map-peek/PeekDetailLink.tsx')).toMatch(/resolvePeekDetailAccess/);
    expect(read('src/components/activity/detail/ActivityDetailGuestGate.tsx')).toMatch(
      /ExploreGuestSignInCard/
    );
    expect(read('src/explore/ui/useExploreSelectionPeekJoin.ts')).toMatch(/openGuestBrowseGate/);
    expect(read('packages/shared-types/src/activity-engagement-policy.ts')).toMatch(
      /resolveActivityEngagementPolicy/
    );
  });

  it('DS-WIRE-03: activity kind templates share one consumer shell', () => {
    for (const file of [
      'src/activity/detail/templates/HikingActivityDetailPage.tsx',
      'src/activity/detail/templates/CampingActivityDetailPage.tsx',
      'src/activity/detail/templates/RideshareActivityDetailPage.tsx',
      'src/activity/detail/templates/OtherActivityDetailPage.tsx',
    ]) {
      expect(read(file)).toMatch(/ActivityDetailPageShell/);
    }
    expect(read('src/activity/detail/templates/ActivityDetailByKind.tsx')).toMatch(
      /resolveActivityDetailKind/
    );
  });

  it('DS-WIRE-05: activity detail uses one presentation.sections (embed still uses tabs)', () => {
    const presentation = read('packages/shared-types/src/activity-detail-presentation.ts');
    expect(presentation).toMatch(/ActivityPresentationSectionsDTO/);
    expect(presentation).not.toMatch(/scrollLayout/);
    expect(read('src/pages/ActivityDetail.tsx')).toMatch(/wireSections=/);
    expect(read('src/activity/detail/templates/ActivityDetailSections.tsx')).toMatch(
      /model\.sections/
    );
    const manage = read('src/components/activity/ActivityManageSheet.tsx');
    expect(manage).toMatch(/isEmbedded:\s*true/);
    expect(manage).toMatch(/wireSections=/);
    expect(manage).not.toMatch(/wireTabs=/);
  });

  it('DS-WIRE-04: place/shop/area peek mounts route to detail paths', () => {
    expect(read('src/explore/ui/peek/place/PlacePeekActions.tsx')).toMatch(/PeekDetailLink/);
    expect(read('src/explore/ui/peek/shop/ShopPeekActions.tsx')).toMatch(/PeekDetailLink/);
    expect(read('src/explore/ui/ActivityMapPeekHost.tsx')).toMatch(/ActivityPeekCard/);
  });

  it('DS-WIRE-06: L3 shell card projects linked rideshare onto discovery card model', () => {
    const shellCard = read('src/activity/detail/activityDetailPageShellCard.ts');
    expect(shellCard).toMatch(/linkedRideshareActivityId/);
    expect(shellCard).toMatch(/linkedRidesharesFromDetail/);
    expect(read('src/activity/detail/activityDetailPageShellCard.test.ts')).toMatch(
      /linkedRideshares/
    );
  });

  it('DS-WIRE-07: map list and L3 share one join flow module', () => {
    for (const file of [
      'src/pages/ActivityDetail.tsx',
      'src/explore/ui/useExploreSelectionPeekJoin.ts',
      'src/list/ui/ListFeedActionsProvider.tsx',
    ]) {
      expect(read(file)).toMatch(/useActivityJoin/);
    }
  });
});
