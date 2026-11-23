import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const vitestPathsInScript = (rel: string) => {
  const matches = read(rel).matchAll(/(?:src|packages)\/[^\s'"`]+\.test\.(?:ts|tsx)/g);
  return [...new Set([...matches].map((m) => m[0]))];
};

const domainFeVitest = () => vitestPathsInScript('scripts/verify/verify-domain-fe.mjs');

describe('governanceSurfaceGuard (GW-1 — no duplicate schedules)', () => {
  it('GW1-01: no Cursor agent plan markdown (schedule is manifest + touchpoints)', () => {
    const plansDir = join(ROOT, '.cursor/plans');
    if (!existsSync(plansDir)) return;
    const plans = readdirSync(plansDir).filter((f) => f.endsWith('.plan.md'));
    expect(plans, `remove: ${plans.join(', ')}`).toEqual([]);
  });

  it('GW1-02: people-vocabulary touchpoints omit planFile pointer', () => {
    const raw = read('scripts/governance/people-vocabulary-touchpoints.json');
    expect(raw).not.toMatch(/"planFile"/);
    expect(raw).not.toMatch(/\.cursor\/plans\//);
  });

  it('GW1-03: no program-normalize-archive or compact-ledger shims', () => {
    expect(existsSync(join(ROOT, 'scripts/program-normalize-archive.mjs'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/normalize-refactor-program-archive.mjs'))).toBe(false);
    expect(read('package.json')).not.toMatch(/program:normalize-archive/);
  });

  it('GW2-02: no dual Find crew HTTP path (/me/member-discovery/roster)', () => {
    const routes = read('apps/api/src/routes/user/registerMemberDiscoveryRoutes.ts');
    expect(routes).not.toMatch(/\/me\/member-discovery\/roster/);
    expect(routes).not.toMatch(/Deprecation/);
    expect(read('apps/api/src/routes/user/registerDiscoverCrewRoutes.ts')).toMatch(/\/discover\/crew/);
  });

  it('GW2-01: matching notify re-export shims removed (GW-2)', () => {
    expect(existsSync(join(ROOT, 'apps/api/src/services/wishlist-alerts.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'apps/api/src/services/availability-hosted-match-notifications.ts'))).toBe(
      false
    );
    const manifest = JSON.parse(read('scripts/governance/bounded-context-manifest.json')) as {
      contexts: { id: string; apiFiles?: string[] }[];
    };
    const matching = manifest.contexts.find((c) => c.id === 'matching');
    expect(matching?.apiFiles ?? []).not.toContain('apps/api/src/services/wishlist-alerts.ts');
  });

  it('GW2b-03: deprecated FE re-export shim files removed', () => {
    expect(existsSync(join(ROOT, 'src/utils/activityPublicSeo.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/components/mobile/ConsumerDetailHeaderChromeTitle.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/place/detail/resolvePlaceConsumerDetailHeaderChrome.ts'))).toBe(false);
    const tree = [read('src/pages/ActivityDetail.tsx'), read('src/pages/PlaceDetailPage.tsx')].join('\n');
    expect(tree).not.toMatch(/activityPublicSeo/);
    expect(tree).not.toMatch(/resolvePlaceConsumerDetailHeaderChrome/);
    expect(tree).not.toMatch(/ConsumerDetailHeaderChromeTitle/);
  });

  it('GW3-01: DMCP spine runners do not re-list verify:domain:fe vitest files', () => {
    const domain = new Set(domainFeVitest());
    const spines = [
      'scripts/verify/verify-compose-spine.mjs',
      'scripts/verify/verify-participation-spine.mjs',
      'scripts/verify/verify-storefront-spine.mjs',
      'scripts/verify/verify-people-graph-plan.mjs',
      'scripts/verify/verify-release-ops.mjs',
    ];
    for (const spine of spines) {
      const overlap = vitestPathsInScript(spine).filter((p) => domain.has(p));
      expect(overlap, `${spine}`).toEqual([]);
    }
  });

  it('GW3-02: verify:system runs domain before spine orchestrators', () => {
    const order = read('scripts/verify/verify-system-coherence.mjs');
    const domainAt = order.indexOf("npm run verify:domain");
    const composeAt = order.indexOf("npm run verify:compose-spine");
    expect(domainAt).toBeGreaterThan(-1);
    expect(composeAt).toBeGreaterThan(domainAt);
  });

  it('GW1-04: platform-governance has archivePolicy; no MIG-PROGRAM-ARCHIVE row', () => {
    const governance = JSON.parse(read('scripts/governance/platform-governance.json')) as { archivePolicy?: string };
    const archive = JSON.parse(read('scripts/governance/platform-migration-archive.json')) as {
      migrations?: { id: string }[];
    };
    expect(governance.archivePolicy).toMatch(/touchpoint-registry/i);
    expect(archive.migrations?.some((m) => m.id === 'MIG-PROGRAM-ARCHIVE')).toBe(false);
  });

  it('GW4-01: retired platform-program.json (GW-4 split spine)', () => {
    expect(existsSync(join(ROOT, 'scripts/governance/platform-governance.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/governance/platform-migration-archive.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/governance/platform-touchpoint-registry.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/platform-program.json'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/compact-platform-program.mjs'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/verify-platform-program.mjs'))).toBe(false);
  });

  it('GW5-01: scripts/ subdirs (governance, verify, lib, ops, dev, archive)', () => {
    for (const dir of ['governance', 'verify', 'lib', 'ops', 'dev', 'archive']) {
      expect(existsSync(join(ROOT, 'scripts', dir)), `missing scripts/${dir}`).toBe(true);
    }
    expect(existsSync(join(ROOT, 'scripts/README.md'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/governance/bounded-context-manifest.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/verify/verify-system-coherence.mjs'))).toBe(true);
  });

  it('GW5-02: no verify runners or one-off shims at scripts/ root', () => {
    const rootScripts = existsSync(join(ROOT, 'scripts'))
      ? readdirSync(join(ROOT, 'scripts')).filter((f) => f.endsWith('.mjs') || f.endsWith('.json'))
      : [];
    expect(rootScripts, `move or delete: ${rootScripts.join(', ')}`).toEqual([]);
    expect(existsSync(join(ROOT, 'scripts/verify-hero-gutter.mjs'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/align-routing-imports.mjs'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/gw5-restructure.mjs'))).toBe(false);
  });

  it('GW6-01: retired FE stubs and lazy re-exports removed', () => {
    expect(existsSync(join(ROOT, 'src/pages/admin/Overview.tsx'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/components/plan/PlanCalendarSection.tsx'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/activity/detail/templates/activityConsumerDetailSectionStyles.ts'))).toBe(
      false
    );
    expect(existsSync(join(ROOT, 'src/api/domains/placeRegistry.test.ts'))).toBe(false);
    const lazy = read('src/routing/appLazyPages.tsx');
    expect(lazy).not.toMatch(/export const AdminOverview\b/);
    expect(lazy).not.toMatch(/export const Buddies\b/);
    const availabilityApi = read('src/hooks/memberAvailabilityApi.ts');
    expect(availabilityApi).not.toMatch(/saveMyMemberAvailability/);
  });

  it('GW6-02: retired FE compat alias exports removed', () => {
    expect(read('src/config/surfacePaths.ts')).not.toMatch(/export const buddiesPath\b/);
    expect(read('src/config/surfacePaths.ts')).not.toMatch(/messagesGroupChatPath/);
    expect(read('src/content/exploreCreateFabCopy.ts')).not.toMatch(/EXPLORE_CREATE_FAB_FIND_CREW/);
    expect(read('src/detail/shell/consumerDetailScrollTo.ts')).not.toMatch(/scrollConsumerDetailToId/);
    expect(read('src/utils/placePaths.ts')).not.toMatch(/locationDetailPath/);
    expect(read('src/utils/authRouting.ts')).not.toMatch(/hostModeHomeRouteByRole/);
    expect(read('src/routing/appLazyPages.tsx')).not.toMatch(/buddiesPathFromCrews/);
    const crewNav = read('src/crew/crewSurfaceNav.ts');
    expect(crewNav).toMatch(/myCrewsPathFromCrews/);
    expect(crewNav).not.toMatch(/buddiesPathFromCrews/);
  });

  it('GW9-01: member profile operatorProfilePath (not hostProfilePath on wire)', () => {
    const profile = read('apps/api/src/services/public-member-profile.ts');
    expect(profile).toMatch(/operatorProfilePath/);
    expect(profile).not.toMatch(/hostProfilePath:/);
    expect(read('src/api/types.ts')).toMatch(/operatorProfilePath/);
    expect(read('src/api/types.ts')).not.toMatch(/hostProfilePath:/);
  });

  it('GW10-01: ExploreMapItemDTO drops duplicate person fields on wire', () => {
    const types = read('packages/shared-types/src/index.ts');
    expect(types).not.toMatch(/Use `featuredPerson` — kept for cached/);
    expect(types).not.toMatch(/organizerDetails\?: OrganisationHostDetailsDTO/);
    const catalog = read('apps/api/src/lib/discovery-catalog-builder.ts');
    expect(catalog).not.toMatch(/hostName: activity\.hostName \?\? null/);
    expect(catalog).not.toMatch(/requesterUserId: owner/);
  });

  it('GW14-01: wire hygiene — notification actor, card input, list feed, group shape', () => {
    expect(read('packages/shared-types/src/notification-meta.ts')).not.toMatch(/buddyUserId\?:/);
    expect(read('packages/shared-types/src/notification-meta.ts')).not.toMatch(/'buddy\.request'/);
    expect(read('packages/shared-types/src/explore-presentation.ts')).not.toMatch(
      /requesterUserId\?:/
    );
    expect(read('src/list/browse/ListFeedActionsProvider.tsx')).not.toMatch(
      /joinStateLoading:\s*boolean/
    );
    expect(read('src/pages/Groups.tsx')).toMatch(/memberGroupRowLabel/);
    expect(read('src/pages/Groups.tsx')).not.toMatch(/typeLabel\[/);
    expect(read('packages/shared-types/src/index.ts')).toMatch(/resolveNotificationActorUserId/);
  });

  it('GW16-01: no buddy product wire in FE (friends HTTP + availability find crew)', () => {
    expect(existsSync(join(ROOT, 'src/api/domains/friends.ts'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/api/domains/buddies.ts'))).toBe(false);
    const domain = read('src/api/domains/friends.ts');
    expect(domain).not.toMatch(/\/me\/buddies/);
    expect(domain).not.toMatch(/\bbuddiesApi\b/);
    expect(read('apps/api/src/routes/user/registerMemberDiscoveryRoutes.ts')).not.toMatch(/'buddies'/);
    expect(read('packages/shared-types/src/wire-lexicon.ts')).not.toMatch(/BUDDIES_INBOUND|buddies.*alias/i);
    expect(read('src/explore/ui/intentFixedFlowEngine.ts')).not.toMatch(/seeking-posts|createSeekingPost/);
  });

  it('GW15-01: client friends network + explore others subtype (HTTP /me/friends)', () => {
    expect(existsSync(join(ROOT, 'src/explore/exploreOthersSubtype.ts'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/explore/exploreBuddySubtype.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/hooks/useMeFriendsNetwork.ts'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/hooks/useMeBuddiesNetwork.ts'))).toBe(false);
    expect(read('src/hooks/clientQueryKeys.ts')).toMatch(/meFriendsNetworkQueryKey/);
    expect(read('src/hooks/clientQueryKeys.ts')).not.toMatch(/meBuddiesNetworkQueryKey/);
    expect(read('src/pages/MyCrews.tsx')).toMatch(/useMeFriendsNetwork/);
    const exploreSrc = read('src/explore/exploreBrowseUrlSync.ts');
    expect(exploreSrc).not.toMatch(/\bbuddySubtype\b/);
    expect(read('src/hooks/activityInviteClientApi.ts')).toMatch(/getMeFriends/);
    expect(read('src/api/domains/friends.ts')).not.toMatch(/\/me\/buddies/);
    expect(read('src/explore/exploreItemSearch.ts')).not.toMatch(/terms\.push\([^)]*'seeking'/);
  });

  it('GW13-01: product surface naming — Friends/crew, not buddies labels', () => {
    expect(read('src/components/activity/detail/useActivityDetailViewModel.tsx')).not.toMatch(
      /mobileBuddiesPanel/
    );
    expect(read('src/utils/notificationRouting.ts')).not.toMatch(/\/buddies|INBOUND_LEGACY_CREWS/);
    expect(read('src/config/inboundRoutePaths.ts')).not.toMatch(/\/buddies|INBOUND_LEGACY_CREWS/);
    expect(read('src/pages/MyCrews.tsx')).not.toMatch(/filteredBuddies/);
    expect(read('src/explore/exploreSearchScopeUi.ts')).not.toMatch(/'buddies'/);
    expect(read('src/components/activity/ActivityInviteModalBody.tsx')).not.toMatch(/filteredBuddies/);
  });

  it('GW12-01: retired module alias exports removed', () => {
    expect(read('src/list/crews/crewsStatTab.ts')).not.toMatch(/crewsStatTabFromSegment/);
    expect(read('src/activity-discovery/catalog/availabilityCatalog.ts')).not.toMatch(
      /ExploreAvailabilityCatalogFilters/
    );
    expect(read('src/explore/ui/exploreBrowseUrlPublicApi.ts')).not.toMatch(/applyCrewBrowseTab/);
    expect(read('src/explore/hostingPublishArea.ts')).not.toMatch(/validateHostingPublishArea/);
    expect(read('src/constants/userTypes.ts')).not.toMatch(/USER_TYPE_LABELS/);
    expect(read('src/utils/userDisplay.ts')).not.toMatch(/resolveExploreHostPersonName/);
    expect(read('src/components/ui/PlaceCard.tsx')).not.toMatch(/export const TrailCard/);
    expect(read('packages/shared-types/src/index.ts')).not.toMatch(/organizerDetails\?: OrganisationHostDetailsDTO/);
  });

  it('GW11-01: retired component prop aliases removed', () => {
    expect(read('src/components/chat/MessageMemberButton.tsx')).not.toMatch(/\bhostUserId\b/);
    expect(read('src/explore/ui/ExploreResponsiveSheet.tsx')).not.toMatch(/mobileComposeChrome/);
  });

  it('GW8-01: retired FE/API compat aliases removed', () => {
    expect(read('src/utils/groupWallReply.ts')).not.toMatch(/formatGroupWallReplyBody/);
    expect(read('src/api/types.ts')).not.toMatch(/export type HostDetails\b/);
    expect(read('src/api/types.ts')).not.toMatch(/export type TenantProfile\b/);
    const memberRoutes = read('apps/api/src/lib/member-routes.ts');
    expect(memberRoutes).not.toMatch(/TRIPS_JOINED_TAB_PATH/);
    expect(memberRoutes).not.toMatch(/exploreSeekingPinPath/);
    expect(memberRoutes).not.toMatch(/planSelfDemandPeekPath/);
    expect(read('src/list/browse/peopleListBrowseUrl.ts')).not.toMatch(/parsePeopleListBrowseTab/);
    expect(read('src/crew-discovery/crewBrowseTab.ts')).not.toMatch(/parseCrewBrowseTab/);
  });

  it('GW7-01: SPA inbound redirect modules and AppRoutes Navigate shims removed', () => {
    expect(existsSync(join(ROOT, 'src/routing/inboundBookmarkRedirects.tsx'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/routing/exploreEntryRedirects.tsx'))).toBe(false);
    const routes = read('src/routing/AppRoutes.tsx');
    expect(routes).not.toMatch(/<Navigate\b/);
    expect(routes).not.toMatch(/InboundLegacyProfileSettingsRedirect/);
    expect(routes).not.toMatch(/InboundRetiredPublishingConsoleRedirect/);
    expect(routes).not.toMatch(/path="\/map"/);
    expect(routes).not.toMatch(/path="\/discovery"/);
    expect(routes).not.toMatch(/path="\/messages"/);
    expect(routes).not.toMatch(/path="\/become-host"/);
    const lazy = read('src/routing/appLazyPages.tsx');
    expect(lazy).not.toMatch(/loadInboundRedirects/);
    expect(lazy).not.toMatch(/loadExploreEntryRedirects/);
    expect(lazy).not.toMatch(/DashboardRedirect/);
  });
});