import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');
const lineCount = (rel: string) => read(rel).split(/\r?\n/).length;

const memberPlanRetiredResolver = `src/member-plan/${['resolveInbound', 'PlanHubPath.ts'].join('')}`;

const RETIRED_PATHS = [
  'src/routing/inboundBookmarkRedirects.tsx',
  'src/routing/exploreEntryRedirects.tsx',
  'src/member-plan/planHubRouting.ts',
  memberPlanRetiredResolver,
  'src/components/profile/ProfileConsumerHub.tsx',
  'src/components/social/SocialHubNav.tsx',
  'src/routing/RouterDesyncDebug.tsx',
  'src/routing/useEffectiveLocation.ts',
  'src/routing/useEffectiveLocation.tsx',
  'apps/api/src/services/place-submit.ts',
];

const R5_SPLIT_MODULES = [
  'apps/api/src/lib/activity-engagement-join-writes.ts',
  'apps/api/src/lib/activity-engagement-host-writes.ts',
  'apps/api/src/lib/activity-engagement-store-reads.ts',
  'apps/api/src/lib/activity-engagement-store-internals.ts',
  'apps/api/src/lib/social-groups-membership-store.ts',
  'apps/api/src/lib/social-groups-admin-store.ts',
  'src/components/ui/placesMapClusteredMarkers.tsx',
  'src/components/ui/placesMapPinIcons.ts',
  'src/components/ui/placesMapLeafletChrome.tsx',
  'src/place/admin/AdminPlacesCatalogTable.tsx',
  'src/place/admin/AdminPlacesCatalogEditWizard.tsx',
  'src/explore/ui/hostingActivityFlowPublish.ts',
  'src/explore/ui/CreateHostingActivityFlowMapOverlay.tsx',
  'src/explore/ui/useHostingActivityFlowWizardLifecycle.ts',
  'src/explore/ui/useHostingActivityFlowNavigation.ts',
  'src/explore/ui/useHostingActivityFlowMapActions.ts',
  'src/explore/ui/hostingActivityFlowMapChrome.ts',
  'src/components/activity/detail/activityDetailViewModelPlaceAccess.ts',
  'src/components/activity/detail/activityDetailViewModelRoster.ts',
  'src/components/activity/detail/activityDetailViewModelHeroFacts.ts',
  'src/components/activity/detail/activityDetailViewModelPeekCard.ts',
];

describe('engineeringHygiene guard (R1–R6 closure)', () => {
  it('AUDIT-01: retired shim modules stay deleted', () => {
    const present = RETIRED_PATHS.filter((rel) => existsSync(join(ROOT, rel)));
    expect(present, `Stale files still on disk:\n${present.join('\n')}`).toEqual([]);
  });

  it('AUDIT-02: R5 split modules exist on disk', () => {
    const missing = R5_SPLIT_MODULES.filter((rel) => !existsSync(join(ROOT, rel)));
    expect(missing, `Missing split modules:\n${missing.join('\n')}`).toEqual([]);
  });

  it('AUDIT-03: god-file shells respect line budgets', () => {
    expect(lineCount('apps/api/src/lib/activity-engagement-store.ts')).toBeLessThan(900);
    expect(lineCount('src/components/ui/PlacesMap.tsx')).toBeLessThan(550);
    expect(lineCount('src/pages/admin/Places.tsx')).toBeLessThan(650);
    expect(lineCount('src/explore/ui/CreateHostingActivityFlow.tsx')).toBeLessThan(750);
    expect(lineCount('src/components/activity/ActivityDetailView.tsx')).toBeLessThan(400);
    expect(lineCount('src/components/activity/detail/useActivityDetailViewModel.tsx')).toBeLessThan(490);
  });

  it('AUDIT-04: R1 no-op strip/canonicalize helpers are gone from src', () => {
    const inbound = read('src/routing/productUrlInbound.ts');
    expect(inbound).not.toMatch(/stripRetiredPeopleListTabParams/);
    expect(inbound).not.toMatch(/canonicalizeExplorePinKindToken/);
    const exploreSync = read('src/explore/exploreBrowseUrlSync.ts');
    expect(exploreSync).not.toMatch(/stripRetiredPeopleListTabParams/);
  });

  it('AUDIT-05: router patch/residue modules absent', () => {
    const routes = read('src/routing/AppRoutes.tsx');
    expect(routes).not.toMatch(/RouterDesyncDebug/);
    expect(routes).not.toMatch(/EffectiveLocationProvider/);
    expect(routes).not.toMatch(/useProductLocation/);
    expect(read('src/App.tsx')).not.toMatch(/history\.pushState\s*=/);
  });

  it('AUDIT-06: R6 closure registry present', () => {
    expect(existsSync(join(ROOT, 'src/config/r6-program-closure.guard.test.ts'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/routing/inboundBookmark.contract.test.ts'))).toBe(true);
  });

  it('AUDIT-07: no one-off split scripts in scripts/dev', () => {
    const devDir = join(ROOT, 'scripts/dev');
    for (const name of ['split-engagement-store.mjs', 'split-places-map.mjs', 'split-hosting-flow.mjs']) {
      expect(existsSync(join(devDir, name)), name).toBe(false);
    }
  });

  it('AUDIT-08: discovery burn-down delivery artifacts removed (enforcement = guards + baselines)', () => {
    const devDir = join(ROOT, 'scripts/dev');
    expect(existsSync(join(devDir, 'consolidate-discovery-ports-w37.mjs'))).toBe(false);
    expect(existsSync(join(devDir, 'rename-discovery-ports.mjs'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/governance/parallel-burn-down-workstreams.json'))).toBe(false);
    expect(existsSync(join(ROOT, 'docs/archive/discovery-burn-down-lanes-2026-11.json'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/archive/discovery-port-codemods'))).toBe(false);
  });

  it('AUDIT-09: folded explore wire ports stay deleted', () => {
    expect(existsSync(join(ROOT, 'src/discovery/discoveryPortExploreOptionalFilterWire.ts'))).toBe(
      false
    );
    expect(existsSync(join(ROOT, 'src/discovery/discoveryPortExploreSearchFeed.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/discovery/discoveryPortExploreBrowseHooks.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/discovery/discoveryPortExploreBrowseUrl.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/discovery/discoveryPortExploreBrowseWire.ts'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/components/activity/ActivityDetailView.rtl.test.tsx'))).toBe(true);
    expect(read('package.json')).toMatch(/@testing-library\/react/);
  });

  it('AUDIT-11: orphan module guard registered', () => {
    expect(existsSync(join(ROOT, 'src/config/orphanModuleGuard.test.ts'))).toBe(true);
  });

  it('AUDIT-12: crews-origin nav barrel wired; FE memberDiscoveryExplore duplicate retired', () => {
    expect(read('src/pages/Groups.tsx')).toMatch(/groupsPathFromCrews/);
    expect(read('src/my-crew/MyCrewHubBody.tsx')).toMatch(/groupsPathFromCrews/);
    expect(existsSync(join(ROOT, 'src/explore/memberDiscoveryExplore.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'packages/shared-types/src/entity-path.ts'))).toBe(true);
  });

  it('AUDIT-14: audit backlog modules retired or consolidated', () => {
  for (const rel of [
      'src/explore/ui/exploreMapGeoBubbles.ts',
      'src/explore/ui/exploreMapMobileMenus.ts',
      'src/explore/viewerInvitableActivities.ts',
      'src/access/mapProfileViewerAccessToUi.ts',
      'src/activity/activityDetailTransport.ts',
      'src/detail/weather/activityForecastDates.ts',
      'src/detail/shared/collectActivityDetailHeroPhotos.ts',
    ]) {
      expect(existsSync(join(ROOT, rel)), rel).toBe(false);
    }
    expect(read('src/activity/detail/templates/ActivityDetailSections.tsx')).toMatch(
      /no hero image, no photo gallery/
    );
    expect(existsSync(join(ROOT, 'src/activity/resolveActivityDetailHeroImage.ts'))).toBe(true);
    expect(read('src/access/mapViewerAccessToUi.ts')).toMatch(/mapProfileViewerAccessToMemberLink/);
    expect(read('src/place/detail/templates/PlaceDetailSections.tsx')).toMatch(
      /ConsumerDetailSectionJumpNav/
    );
  });

  it('AUDIT-13: plan wishlist layer filter is single module; mobile back uses crewSurfaceNav', () => {
    expect(read('src/components/plan/PlanSavedSection.tsx')).toMatch(/wishlistItemMatchesPlanWishlistLayer/);
    expect(read('src/plan/planHubSummaryCounts.ts')).toMatch(/wishlistItemMatchesPlanWishlistLayer/);
    expect(read('src/utils/mobileBackNav.ts')).toMatch(/crewOriginPaths/);
    expect(existsSync(join(ROOT, 'src/crew/crewOriginPaths.ts'))).toBe(true);
  });

  it('AUDIT-10: R6 optional closure — policy contract + activity detail split tests registered', () => {
    expect(existsSync(join(ROOT, 'src/discovery/discoveryPortExplorePolicy.contract.test.ts'))).toBe(
      true
    );
    for (const rel of [
      'src/components/activity/detail/activityDetailViewModelHeroFacts.test.ts',
      'src/components/activity/detail/activityDetailViewModelPeekCard.test.ts',
      'src/components/activity/detail/activityDetailViewModelPlaceAccess.test.ts',
      'src/components/activity/detail/activityDetailViewModelRoster.test.ts',
    ]) {
      expect(existsSync(join(ROOT, rel)), rel).toBe(true);
    }
    const rtl = read('src/components/activity/ActivityDetailView.rtl.test.tsx');
    expect(rtl).not.toMatch(/vi\.mock\('\.\/detail\/useActivityDetailViewModel'/);
  });
});