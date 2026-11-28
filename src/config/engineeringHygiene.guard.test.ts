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

  it('AUDIT-23: explore/map/follow shop entity uses shopId (C9)', () => {
    expect(read('src/explore/exploreMapItemKind.ts')).not.toMatch(/isMerchantShopMapItem/);
    expect(read('src/discovery/discoveryCardModel.ts')).toMatch(/shopId/);
    expect(read('src/discovery/discoveryCardModel.ts')).not.toMatch(/merchantId/);
    expect(read('src/api/domains/shop.ts')).not.toMatch(/getMerchantProfile/);
    expect(read('packages/shared-types/src/entity-follow.ts')).toMatch(/kind: EntityFollowKind/);
    expect(read('packages/shared-types/src/entity-follow.ts')).toMatch(/\bshop\?:/);
    expect(read('apps/api/src/lib/discovery-catalog-builder.ts')).toMatch(/shopId:/);
    expect(read('apps/api/src/lib/discovery-catalog-builder.ts')).not.toMatch(/merchantId:/);
  });

  it('AUDIT-22: retired wire/UI aliases stay removed (C8)', () => {
    expect(read('src/detail/weather/weatherDisplayUtils.ts')).not.toMatch(/openMeteoMapUrl/);
    expect(read('src/place/placeDetailTab.ts')).not.toMatch(/LocationTab/);
    expect(read('packages/shared-types/src/member-inbox.ts')).not.toMatch(/MemberInboxGroupType/);
    expect(read('packages/shared-types/src/member-discovery-roster.ts')).not.toMatch(
      /MemberDiscoveryOnTripRowDTO/
    );
    expect(read('packages/shared-types/src/index.ts')).not.toMatch(/ORGANIZER_FALLBACK_DISPLAY_NAME/);
    expect(read('src/content/upl-glossary.ts')).not.toMatch(/UPL_AVAILABILITY/);
  });

  it('AUDIT-21: retired FE regression aliases stay removed (C7)', () => {
    expect(read('src/crew-discovery/crewBrowseState.ts')).not.toMatch(/CREW_PEOPLE_FACET_ORDER/);
    expect(read('src/explore/exploreMapItemFixtures.ts')).not.toMatch(/seekingExploreMapItem/);
    expect(read('src/explore/mapPeekBubbleLayout.ts')).not.toMatch(/mapPeekFitScale/);
    expect(read('src/place/geographyVocabulary.ts')).not.toMatch(/MapCatalogPlaceWireSource/);
    expect(read('src/types/place.ts')).not.toMatch(/PlaceAsTrail/);
  });

  it('AUDIT-20: retired entity-path profile helpers stay removed (C6)', () => {
    expect(read('packages/shared-types/src/entity-path.ts')).not.toMatch(/memberDiscoverProfilePath/);
    expect(read('packages/shared-types/src/entity-path.ts')).not.toMatch(/organisationProfilePath/);
    expect(read('packages/shared-types/src/entity-path.ts')).not.toMatch(/resolveOrganisationProfilePath/);
    expect(read('src/utils/organisationLinks.ts')).not.toMatch(/organisationProfilePath/);
  });

  it('AUDIT-19: retired shared-types wire aliases stay removed (C5)', () => {
    const st = (rel: string) => read(rel);
    expect(st('packages/shared-types/src/outdoor-map-entries.ts')).not.toMatch(/OutdoorMapEntryDTO/);
    expect(st('packages/shared-types/src/explore-presentation.ts')).not.toMatch(/CATALOG_PLACE_MAP_SOURCE/);
    expect(st('packages/shared-types/src/activity-participation-mode.ts')).not.toMatch(
      /ACTIVITY_GUEST_JOIN_LABEL_RSVP/
    );
    expect(st('packages/shared-types/src/explore-plan-projection.ts')).not.toMatch(
      /resolveexcludedSeekingActivityMapItemId/
    );
    expect(st('packages/shared-types/src/crew-pillars.ts')).not.toMatch(/crewHubStatTabToPillar/);
  });

  it('AUDIT-18: retired FE @deprecated alias exports stay removed (C4)', () => {
    expect(read('src/explore/exploreDesktopPopup.ts')).not.toMatch(/exploreComposeMenuPopupBodyClass/);
    expect(read('src/config/platform.ts')).not.toMatch(/hostModeHamburgerMenu/);
    expect(read('src/components/profile/goalCopy.ts')).not.toMatch(/GOAL_ACTIVITY_OPTIONS/);
    expect(read('src/crew-discovery/availabilityBrowseCardCopy.ts')).not.toMatch(
      /crewBrowseAvailabilityDetailFromSlots/
    );
  });

  it('AUDIT-17: browse session read/merge avoid discoverySession barrel (import cycle)', () => {
    expect(read('src/discovery/discoveryBrowseListSessionRead.ts')).not.toMatch(/from ['"]\.\/discoverySession['"]/);
    expect(read('src/discovery/discoveryBrowseListUrlMerge.ts')).not.toMatch(/from ['"]\.\/discoverySession['"]/);
  });

  it('AUDIT-16: folded list discovery ports stay deleted (C3)', () => {
    expect(existsSync(join(ROOT, 'src/discovery/discoveryPortListFeedActions.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/discovery/discoveryPortListGeoHub.ts'))).toBe(false);
    expect(read('src/discovery/discoveryPortListPeek.ts')).toMatch(/resolveListFeedFooterFromMapPeekWire/);
    expect(read('src/discovery/discoveryPortListGeoBrowse.ts')).toMatch(/ListExplorer/);
  });

  it('AUDIT-15: explore root barrel does not re-export UI or discovery card models', () => {
    const barrel = read('src/explore/index.ts');
    expect(barrel).not.toMatch(/export \* from ['"]\.\/ui['"]/);
    expect(barrel).not.toMatch(/discovery\/discoveryCardModel/);
    expect(existsSync(join(ROOT, 'src/explore/ui/index.ts'))).toBe(false);
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