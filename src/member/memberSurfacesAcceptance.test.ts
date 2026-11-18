/**
 * Member / people surfaces — code gates (archived plan: docs/archive/experiment/member-surfaces-implementation-plan.md).
 * G-manage approve from Plan sheet: manual staging QA; API slice in `g-manage-coordination-join-approve.test.ts`.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parsePeopleBrowseTabFromUrl } from '../people-discovery/peopleBrowseTab';
import { readAppRouteRegistry } from '../../scripts/readAppRouteRegistry.mjs';
import { PLAN_MAIN_TABS } from '../plan/planTab';
import { isPublishingConsolePath } from '../config/surfacePaths';
import { participantHostBookmarkRedirect } from '../utils/authRouting';
import { inferNotificationPath } from '../utils/notificationRouting';
import type { NotificationDTO } from '@uaetrail/shared-types';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const collectApiNotificationServices = (): string[] => {
  const dir = join(process.cwd(), 'apps/api/src/services');
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isFile() && entry.includes('notification')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('member surfaces §11 acceptance (automated)', () => {
  it('G-arch: host withdrawal notification meta uses Plan hosted (not /host/requests)', () => {
    const withdrawal = read('apps/api/src/services/request-notifications.ts');
    expect(withdrawal).toContain('planHostedSchedulePath');
    expect(withdrawal).not.toContain('HOST_REQUESTS_PATH');
  });

  it('G-arch: API join/goal notification paths use /plan not /trips', () => {
    const memberRoutes = read('apps/api/src/lib/member-routes.ts');
    expect(memberRoutes).toMatch(/TRIPS_JOINED_TAB_PATH = planJoinedSchedulePath\(\)/);
    expect(memberRoutes).toContain("export const PLAN_PATH = '/plan'");

    const staleTripsMeta: string[] = [];
    for (const file of collectApiNotificationServices()) {
      const content = read(file);
      if (content.includes("path: '/trips") || content.includes('path: `/trips')) {
        staleTripsMeta.push(file);
      }
    }
    expect(staleTripsMeta).toEqual([]);
  });

  it('G-arch: legacy notification meta.path normalizes to Plan', () => {
    const notif = (meta: Record<string, unknown>): NotificationDTO => ({
      id: 'n1',
      title: 'T',
      body: 'B',
      type: 'request_update',
      isRead: false,
      createdAt: new Date().toISOString(),
      meta,
    });
    expect(
      inferNotificationPath(
        notif({ path: '/trips?segment=upcoming&tab=joined', kind: 'join_request_waitlisted' })
      )
    ).toBe('/plan?view=plans&filter=joined');
  });

  it('G-arch: participant /host bookmarks redirect off host console', () => {
    expect(participantHostBookmarkRedirect('/publishing/overview')).toBe('/explore?compose=host');
    // Hosting schedule is the dedicated `/hosting` hub — My Plans (`/plan`) stays joined/wishlist/goals.
    expect(participantHostBookmarkRedirect('/publishing/activities')).toBe('/hosting');
  });

  it('G-arch: publishing console path helper matches /publishing workspace only', () => {
    expect(isPublishingConsolePath('/operator/overview')).toBe(false);
    expect(isPublishingConsolePath('/publishing/overview')).toBe(true);
    expect(isPublishingConsolePath('/host/activities')).toBe(false);
    expect(isPublishingConsolePath('/organizer/requests')).toBe(false);
    expect(isPublishingConsolePath('/explore')).toBe(false);
  });

  it('G-lang: mobile tab bar labels Plans (not Trips hub)', () => {
    const nav = read('src/components/layout/MobileBottomNav.tsx');
    expect(nav).toContain('MOBILE_FIVE_TAB_UI_LABELS');
    expect(nav).toMatch(/Trips · Places · People · Chat · Plans/);
    expect(nav).not.toMatch(/aria-label=\{['"]Trips['"]\}/);
    const northStar = read('src/content/productNorthStar.ts');
    expect(northStar).toContain("PRODUCT_PLAN_SURFACE_TITLE = 'My Plans'");
  });

  it('G-plan: Plan mobile tabs are Upcoming and Wishlist (goals + saved)', () => {
    const keys = PLAN_MAIN_TABS.map((row) => row.key);
    expect(keys).toEqual(['upcoming', 'wishlist']);
    const activities = read('src/plan/PlanPage.tsx');
    expect(activities).toContain('PlanGoalsProgressSummary');
    expect(activities.indexOf('PlanGoalsProgressSummary')).toBeLessThan(
      activities.indexOf('PlanPageTabs')
    );
    expect(activities).toContain('PlanPageTabs');
    expect(() => read('src/components/plan/PlanLensTabs.tsx')).toThrow();
    const goalBar = read('src/components/plan/PlanGoalsProgressSummary.tsx');
    expect(goalBar).not.toMatch(/goalCount === 0.*return null/);
  });

  it('G-avail-map: People browse defaults to Free tab', () => {
    expect(parsePeopleBrowseTabFromUrl(null, null)).toBe('looking');
    expect(read('src/people-discovery/peopleBrowseTab.ts')).toMatch(/available: 'Free'/);
  });

  it('G-avail-guest: People browse requires sign-in (UI + API)', () => {
    const tabContent = read(
      'src/people-discovery/panel/peopleBrowse/PeopleBrowseTabContent.tsx'
    );
    expect(tabContent).toMatch(/!isSignedIn/);
    const availabilityRoute = read('apps/api/src/routes/user/registerExploreAvailabilityRoutes.ts');
    expect(availabilityRoute).toMatch(/requireAuth/);
    expect(availabilityRoute).not.toMatch(/optionalAuth/);
  });

  it('G-seek: ActivityDTO wire includes activityMode for /activity/:id', () => {
    const mappers = read('apps/api/src/lib/mappers.ts');
    expect(mappers).toContain('activityMode: event.activityMode');
    const dto = read('packages/shared-types/src/index.ts');
    expect(dto).toMatch(/activityMode\?: ExploreActivityMode/);
  });

  it('G-seek: explore map build does not merge legacy demand pins into payload', () => {
    const exploreMap = read('apps/api/src/lib/explore-map.ts');
    const catalog = read('apps/api/src/lib/discovery-catalog-builder.ts');
    expect(exploreMap).not.toMatch(/listActiveParticipantIntentsForMap\(/);
    expect(catalog).not.toMatch(/listActiveParticipantIntentsForMap\(/);
    expect(catalog).toMatch(/activityMode === 'seeking'\) continue/);
    expect(catalog).toMatch(/buildAvailabilityFixedMapItems/);
    expect(exploreMap).toMatch(/discovery-catalog-builder/);
    expect(exploreMap).not.toMatch(/explore-map-base/);
    expect(existsSync(join(process.cwd(), 'apps/api/src/lib/explore-map-base.ts'))).toBe(false);
    expect(catalog).not.toMatch(/activityMode === 'seeking' \? 'demand'/);
  });

  it('G-seek: publish fan-out prefers activity pin when seeking id exists', () => {
    const publish = read('apps/api/src/services/member-publish-notifications.ts');
    expect(publish).toMatch(/explorePublishedActivityPinPath|exploreSeekingPinPath/);
    expect(publish).toContain('activityId');
  });

  it('G-seek: wishlist demand alerts use explorePublishedActivityPinPath with activityId', () => {
    const wishlist = read('apps/api/src/services/wishlist-alerts.ts');
    expect(wishlist).toContain('explorePublishedActivityPinPath');
    expect(wishlist).toMatch(/activityId|seekingActivityId/);
    expect(read('apps/api/src/lib/activities-store.ts')).toMatch(/notifyWishlistForPublishedActivity/);
    expect(read('apps/api/src/lib/participant-intents-store.ts')).toMatch(
      /notifyWishlistForNewSeeking/
    );
  });

  it('G-seek: seeking migration runbook defines post-migration residue cleanup', () => {
    const runbook = read('docs/operations/SEEKING_STORAGE_RUNBOOK.md');
    expect(runbook).toContain('## Residue cleanup (after migration');
    expect(runbook).toMatch(/PARTICIPANT_INTENT_STUB_WRITE/);
    expect(runbook).toContain('demand:');
  });

  it('S13-W4: MemberProfileView sections gate on canViewFullProfile from viewerAccess', () => {
    const page = read('src/pages/MemberProfile.tsx');
    const profilePageData = read('src/hooks/useMemberProfilePage.ts');
    expect(page).toMatch(/canViewMemberPublicCardFields/);
    expect(profilePageData).toMatch(/viewerAccess\?\.canOpenMemberProfile/);
    expect(profilePageData).toMatch(/embedSocialGraphInProfile/);
    expect(profilePageData).toMatch(/loadMemberActivities/);
    expect(profilePageData).toMatch(/mergeMemberProfileSocialGraphParts/);
    expect(page).toMatch(/loadSocialGraph/);
    expect(page).toMatch(/loadMemberActivities/);
    const profileView = read('src/components/profile/MemberProfileView.tsx');
    expect(profileView).toMatch(/MemberProfileSocialGraphAnchor/);
    const view = read('src/components/profile/MemberProfileView.tsx');
    expect(view).toMatch(/canViewTrustedFields && profile\.yearGoal/);
    expect(view).toMatch(/canViewPublicCardFields && profile\.bio/);
    expect(view).toMatch(/upcomingActivities\.length/);
    expect(view).toMatch(/pastActivities/);
    expect(view).toMatch(/profile\.vehicles/);
    expect(view).toMatch(/MemberProfileHostReviews/);
    expect(view).toMatch(/MemberProfileHostGuidePanel/);
  });

  it('S13: member profile links use memberProfileLink (single FE entry)', () => {
    const tab = read('src/people-discovery/panel/peopleBrowse/PeopleBrowseTabContent.tsx');
    expect(tab).toContain('memberBrowseRowModel');
    expect(tab).not.toContain('memberProfileLink(');
    const buddies = read('src/pages/Buddies.tsx');
    expect(buddies).toContain('memberProfileLink');
    expect(buddies).not.toMatch(/to=\{`\/member\/\$\{/);
    expect(existsSync(join(process.cwd(), 'src/explore/ui/peopleBrowse'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/list/ui/ListDiscoverPeopleView.tsx'))).toBe(false);
    expect(read('src/list/ListDiscoveryExperience.tsx')).toContain('PeopleBrowsePanel');
    const profile = read('src/pages/Profile.tsx');
    expect(profile).toContain('memberPublicPreviewLink');
    expect(profile).not.toMatch(/`\/member\/\$\{/);
    const view = read('src/components/profile/MemberProfileView.tsx');
    expect(view).toContain('memberProfileLink');
    expect(view).not.toMatch(/`\/member\/\$\{/);
    expect(read('src/utils/notificationRouting.ts')).toContain('memberProfileLink');
    expect(read('src/components/chat/ChatMessageBubble.tsx')).toContain('memberProfileLink');
  });

  it('G-seek: People browse wires availability roster to explore pin routes (no activity detail hop)', () => {
    const panel = read('src/people-discovery/panel/PeopleBrowsePanel.tsx');
    expect(panel).toContain('discoveryAvailabilityOnMap');
    expect(panel).toContain('availabilityCatalogItems');
    const routing = read('src/explore/memberDiscoveryAvailabilityRow.ts');
    expect(routing).toContain('exploreAvailabilityMapItemPath');
    const list = read('src/list/ListDiscoveryExperience.tsx');
    expect(list).not.toMatch(/onOpenDiscoveryActivity.*activityDetailPath/);
  });

  it('G-manage: coordination attention has API route contract test', () => {
    const routeTest = read('apps/api/tests/coordination-attention-route.test.ts');
    expect(routeTest).toContain('/me/coordination-attention');
    expect(routeTest).toContain("not.toHaveProperty('label')");
    const flowTest = read('apps/api/tests/g-manage-coordination-join-approve.test.ts');
    expect(flowTest).toContain('host_join_queue');
    expect(flowTest).toContain('/host/requests/');
  });

  it('G-manage: Plan needs-you uses domain read-model GET /me/coordination-attention', () => {
    const hook = read('src/hooks/useMemberCoordinationAttention.ts');
    expect(hook).toMatch(/fetchMeCoordinationAttention|getMeCoordinationAttention/);
    const clientApi = read('src/hooks/memberCoordinationApi.ts');
    expect(clientApi).toContain('getMeCoordinationAttention');
    const strip = read('src/components/plan/PlanNeedsYouStrip.tsx');
    expect(strip).toContain('useMemberCoordinationAttention');
    expect(strip).toContain('coordinationAttentionPresentation');
    expect(strip).not.toContain('HOST_REQUESTS_PATH');
    const api = read('apps/api/src/services/member-coordination-attention.ts');
    expect(api).not.toMatch(/\blabel\s*:/);
    expect(api).not.toContain('/host/requests');
  });

  it('G-manage: desktop hosting schedule uses dedicated hub (not consumer Plan summary)', () => {
    // Hub is mounted on its own route (`/hosting`); My Plans redirects the hosting filter there.
    const hostingPage = read('src/hosting/HostingHubPage.tsx');
    expect(hostingPage).toContain('HostingHubView');
    expect(hostingPage).toContain('PlanHostingManageProvider');
    expect(hostingPage).toContain('HOSTING_HUB_PATH');
    expect(hostingPage).not.toContain('PlanGoalsProgressSummary');
    expect(hostingPage).not.toContain('PlanWishlistView');
    const plan = read('src/plan/PlanPage.tsx');
    expect(plan).not.toContain('HostingHubView');
    expect(plan).toMatch(/navigate\(HOSTING_HUB_PATH/);
    const hub = read('src/hosting/HostingHubView.tsx');
    expect(hub).not.toContain('PlanGoalsProgressSummary');
    expect(hub).not.toContain('PlanWishlistView');
    expect(hub).toContain('HostedActivityListRow');
    expect(hub).not.toContain('plan-hosting-copy-heading');
    expect(hub).not.toMatch(/TIME_LENS_TABS/);
  });

  it('G-manage: hosted Plan opens ActivityManageSheet (approve via host API, not /host shell)', () => {
    const plan = read('src/plan/PlanPage.tsx');
    expect(plan).toContain('PlanUpcomingView');
    const upcoming = read('src/components/plan/PlanUpcomingView.tsx');
    expect(upcoming).not.toContain('PlanHostingUpcoming');
    expect(upcoming).not.toContain('PlanHostingManageProvider');
    const sheets = read('src/components/plan/PlanHostingManageSheets.tsx');
    expect(sheets).toContain('ActivityManageSheet');
    expect(read('src/hosting/HostingHubView.tsx')).not.toMatch(/HostingSeekingPostsSection/);
    const sheet = read('src/components/activity/ActivityManageSheet.tsx');
    expect(sheet).toContain('decideActivityJoinRequest');
    expect(sheet).toContain('planHostedActivityManagePath');
  });

  it('G-profile: badges and submissions live on Profile launcher (not Plan)', () => {
    const launcher = read('src/components/profile/ProfileQuickLauncher.tsx');
    expect(launcher).toContain('PROFILE_BADGES_PATH');
    expect(launcher).toContain('PROFILE_SUBMISSIONS_PATH');
    const submissions = read('src/pages/Submissions.tsx');
    expect(submissions).toContain('PROFILE_REVIEWS_PATH');
    const plan = read('src/plan/PlanPage.tsx');
    expect(plan).not.toContain('PROFILE_BADGES_PATH');
    expect(plan).not.toContain('PROFILE_SUBMISSIONS_PATH');
  });

  it('G-profile: hub shortcuts use profile/plan paths (not host shell)', () => {
    const launcher = read('src/components/profile/ProfileQuickLauncher.tsx');
    expect(launcher).toContain('BUDDIES_PATH');
    expect(launcher).toContain('PROFILE_HISTORY_PATH');
    expect(launcher).toContain('PROFILE_SETTINGS_PATH');
    expect(launcher).not.toMatch(/\/profile\/settings/);
    expect(launcher).toContain('planHostedSchedulePath()');
    expect(launcher).not.toMatch(/HOST_OVERVIEW_PATH/);
    const settings = read('src/components/profile/AppSettingsBody.tsx');
    expect(settings).toMatch(/visibility/i);
  });

  it('G-profile: goals teaser links to Plan lens (no duplicate goals CRUD on hub)', () => {
    const hub = read('src/components/profile/ProfileConsumerHub.tsx');
    expect(hub).toContain('ProfilePlanGoalsTeaser');
    expect(hub).not.toContain('ProfileGoalsSection');
    const teaser = read('src/components/profile/ProfilePlanGoalsTeaser.tsx');
    expect(teaser).toContain('planGoalsWishlistPath');
  });

  it('G-arch: Profile business entry uses pro membership (not host overview)', () => {
    const hub = read('src/components/profile/ProfileConsumerHub.tsx');
    expect(hub).toContain('PRO_MEMBERSHIP_PATH');
    expect(hub).not.toMatch(/\/host\/overview/);
    const launcher = read('src/components/profile/ProfileQuickLauncher.tsx');
    expect(launcher).toContain('planHostedSchedulePath()');
    expect(launcher).not.toMatch(/\/host\//);
  });

  it('G-arch: org public profile owner CTAs avoid consumer /host/* routes', () => {
    const orgProfile = read('src/components/organisation-console/OrganisationPublicProfile.tsx');
    // Owner no longer gets a "Manage events" link here (the console Activities chip owns that list).
    expect(orgProfile).toContain('PRO_MEMBERSHIP_PATH');
    expect(orgProfile).not.toMatch(/HOST_(ACTIVITIES|TEAM|REQUESTS)_PATH/);
    expect(orgProfile).not.toMatch(/PUBLISHING_(ACTIVITIES|TEAM|REQUESTS|OVERVIEW)_PATH/);
    expect(orgProfile).not.toMatch(/['"]\/(?:host|operator|publishing)\//);
  });

  it('G-plan: wishlist tab surfaces saved-to-map suggested rail', () => {
    const wishlist = read('src/components/plan/PlanWishlistView.tsx');
    expect(wishlist).toContain('PlanSuggestedRail');
    expect(wishlist).toContain('PlanSavedSection');
    const rail = read('src/components/plan/PlanSuggestedRail.tsx');
    expect(rail).toContain('usePlanWishlistSuggestions');
    expect(rail).not.toMatch(/\bapi\./);
  });

  it('G-plan: profile history does not reuse My Plans upcoming resolver branches', () => {
    const history = read('src/pages/ProfileHistory.tsx');
    expect(history).toContain('resolveProfileHistoryContentKey');
    expect(history).not.toMatch(/mainView:\s*['"]plans['"]/);
    const resolver = read('src/member-plan/resolvePlanHubView.ts');
    expect(resolver).not.toMatch(/plans-all|plans-joined|plans-hosted/);
  });

  it('G-plan: My Plans mobile FAB opens Add a Plan on Plan (no Explore bounce)', () => {
    const plan = read('src/plan/PlanPage.tsx');
    const add = read('src/plan/usePlanAddFlow.ts');
    expect(plan).toMatch(/usePlanAddFlow/);
    expect(plan).toMatch(/PLAN_ADD_FAB_LABEL/);
    expect(plan).toMatch(/PlanAddIntentSheet/);
    expect(add).toMatch(/handleCreateTap\(\{ surface: 'menu', intent: 'host' \}\)/);
    expect(add).toMatch(/availabilityOpenCompose/);
    expect(plan).not.toMatch(/explorePath\(\{ compose/);
    expect(plan).not.toMatch(/CreateHostingActivityFlow|HostingFlowHost/);
  });

  it('G-plan: Plan page is forward-looking (past outings on profile history)', () => {
    const plan = read('src/plan/PlanPage.tsx');
    expect(plan).not.toMatch(/timeScope=["']past["']/);
    expect(plan).not.toMatch(/segment=["']completed["']/);
    expect(plan).toContain('PROFILE_HISTORY_PATH');
    expect(plan).toContain('JOURNEY_MAP_PATH');
    expect(plan).not.toContain('ProfileHistoryMainTabs');
    expect(plan).not.toContain('JoinedSection');
    expect(plan).not.toContain('HostedActivitiesSection');
    expect(plan).not.toContain('SeekingIntentsSection');
  });

  it('G-plan: Plan routing helpers live under src/member-plan', () => {
    const catalog = read('src/config/routingCatalog.ts');
    expect(catalog).toContain("from '../member-plan/planHubRouting'");
    expect(catalog).not.toMatch(/from '\.\.\/trips\//);
  });

  it('G-chat: empty inbox is coordination-first (no Start a conversation CTA)', () => {
    const list = read('src/components/chat/MessagesInboxList.tsx');
    expect(list).not.toMatch(/Start a conversation/);
    const messages = read('src/pages/Messages.tsx');
    expect(messages).toMatch(/ChatInboxLayout/);
    expect(messages).toMatch(/FloatingActionButton/);
    expect(messages).not.toMatch(/hasInboxThreads/);
  });

  it('AD-arch: activity detail uses single shell (no HostActivityDetailView shim)', () => {
    const route = read('src/pages/ActivityDetail.tsx');
    expect(route).toContain('ActivityDetailByKind');
    expect(route).not.toContain('HostActivityDetailView');
    expect(route).not.toMatch(/<ActivityDetailView/);

    const manage = read('src/components/activity/ActivityManageSheet.tsx');
    expect(manage).toContain('ActivityDetailByKind');
    expect(manage).not.toContain('HostActivityDetailView');
    expect(() => read('src/components/activity/HostActivityDetailView.tsx')).toThrow();
    expect(() => read('src/explore/activityMapPeekActions.ts')).toThrow();
  });

  it('AD-arch: Tier-1 documents consumer transport strip (organize capture)', () => {
    const nav = read('docs/NAVIGATION.md');
    expect(nav).toMatch(/Transport.*strip/i);
    expect(nav).toMatch(/consumerDetailLayout|scroll layout/i);
    const create = read('docs/CREATE_FLOW.md');
    expect(create).toMatch(/resolveActivityEngagementPolicy|buildActivityDetailPageShellCard/);
  });

  it('AD-arch: activity detail phases tracked in code guards (not experiment docs)', () => {
    expect(read('src/activity/activityDetailAcceptance.test.ts')).toMatch(/AD-PEEK-03/);
    expect(read('src/activity/activityDetailAcceptance.test.ts')).toMatch(/AD-SEEK-01/);
    expect(read('docs/SYSTEM_COHERENCE.md')).toMatch(/§6\.2/);
  });

  it('NA-3: crew surfaces come from wire only (no client fallback)', () => {
    const presentation = read('src/activity/activityDetailPresentation.ts');
    expect(presentation).toMatch(/resolveActivityEngagementPolicy/);
    expect(presentation).not.toMatch(/isHostUser \|\| input\.isConfirmedParticipant/);
    const detail = read('src/pages/ActivityDetail.tsx');
    expect(detail).not.toMatch(/canAccessCrewSurfaces \?\? true/);
  });

  it('AD-6: host crew chat policy UI patches activity groupChatPostPolicy', () => {
    const sidebar = read('src/components/activity/detail/ActivityDetailPricingSidebar.tsx');
    expect(sidebar).toContain('ActivityCrewChatPostPolicyCard');
    expect(sidebar).toContain('groupChatPostPolicy');
    const card = read('src/components/activity/ActivityCrewChatPostPolicyCard.tsx');
    expect(card).toContain('updateActivityGroupChatPostPolicy');
    const audience = read('src/explore/ui/hostingWizard/steps/audience-step.tsx');
    expect(audience).toContain('HostingCrewChatPostPolicyField');
    expect(audience).toContain('groupChatPostPolicy');
  });

  it('AD-3 detail shell: tab footers, host Buddies hub, hero status on activity detail', () => {
    const planColumn = read('src/components/activity/detail/ActivityDetailPlanColumn.tsx');
    const sidebarColumn = read('src/components/activity/detail/ActivityDetailSidebarColumn.tsx');
    const model = read('src/components/activity/detail/useActivityDetailViewModel.tsx');
    expect(read('src/components/activity/ActivityDetailView.tsx')).toContain('wireFooterByTab');
    expect(read('src/pages/ActivityDetail.tsx')).toContain('resolveActivityDetailWirePresentation');
    expect(read('src/activity/resolveActivityDetailEngagement.ts')).toContain(
      'resolveActivityDetailEngagementFooterKind'
    );
    expect(sidebarColumn).toContain('ActivityDetailBuddiesAside');
    expect(planColumn).toContain('ActivityDetailPlanExtras');
    expect(model).toContain('useActivityDetailJoinSurfaces');
    expect(read('src/components/activity/detail/useActivityDetailJoinSurfaces.tsx')).toContain(
      'ActivityDetailStickyFooter'
    );
    const buddiesAside = read('src/components/activity/detail/tabs/ActivityDetailBuddiesAside.tsx');
    expect(buddiesAside).toContain('ActivityDetailHostBuddiesHub');
    expect(model).toContain('resolveActivityDetailHeroStatusChips');
    const footersShim = read('src/activity/activityDetailTabFooters.ts');
    expect(footersShim).toContain('@uaetrail/shared-types');
    const footersPolicy = read('packages/shared-types/src/activity-detail-tab-footers.ts');
    expect(footersPolicy).toContain('transport_empty');
    expect(footersPolicy).toContain('plan_host_share');
    expect(read('packages/shared-types/src/activity-detail-presentation.ts')).toContain(
      'buildActivityPresentationDTO'
    );
    expect(read('apps/api/src/services/activity-public-read.ts')).toContain('presentation');
  });

  it('AD-8: post check-in review prompts on activity detail Plan/Buddies', () => {
    const planColumn = read('src/components/activity/detail/ActivityDetailPlanColumn.tsx');
    const sidebar = read('src/components/activity/detail/ActivityDetailPricingSidebar.tsx');
    const model = read('src/components/activity/detail/useActivityDetailViewModel.tsx');
    expect(planColumn).toContain('ActivityPostCheckInReviewPrompts');
    expect(sidebar).toContain('ActivityHostCheckInReviewPrompt');
    expect(model).toContain('buildParticipantPostCheckInReviewPrompts');
    const copy = read('src/content/activityDetailCopy.ts');
    expect(copy).toContain('ACTIVITY_DETAIL_POST_CHECK_IN_REVIEWS_TITLE');
  });

  it('AD-5: transport offer/add gated on wire entitlements', () => {
    expect(existsSync(join(process.cwd(), 'src/components/activity/HostActivityCtas.tsx'))).toBe(
      false
    );
    const caps = read('src/activity/activityManageCapabilities.ts');
    expect(caps).toContain('canAddLinkedRide');
    const offer = read('src/explore/linkActivityRideshareOffer.ts');
    expect(offer).toContain('canShowAvailabilityLinkRideshareOffer');
    const availabilityPeek = read('src/explore/ui/peek/availability/AvailabilityPeekActions.tsx');
    expect(availabilityPeek).toMatch(/onOfferRideshare/);
    expect(availabilityPeek).toContain('HOSTING_OFFER_RIDESHARE_LABEL');
    expect(offer).toMatch(/canOfferTransport/);
    const entitlements = read('packages/shared-types/src/activity-viewer-entitlements.ts');
    expect(entitlements).toMatch(/link_rideshare.*canAddLinkedRide/);
  });

  it('AD-6: public activity SEO omits meeting from JSON-LD', () => {
    const schemas = read('src/components/seo/schemas.ts');
    const sharedSeo = read('packages/shared-types/src/activity-public-seo.ts');
    expect(schemas).toContain('buildActivityEventJsonLd');
    expect(sharedSeo).toContain('buildActivityEventJsonLd');
    expect(sharedSeo).not.toMatch(/meetingPoint/);
  });

  it('NA-6: API viewer access uses buildActivityViewerAccess', () => {
    const mod = read('apps/api/src/services/activity-viewer-access.ts');
    expect(mod).toContain('export const buildActivityViewerAccess');
    expect(mod).not.toContain('resolveActivityViewerAccess');
    const compose = read('apps/api/src/services/compose-activity-viewer-access.ts');
    expect(compose).toMatch(/buildActivityViewerAccess/);
    expect(compose).not.toMatch(/resolveActivityViewerAccess\(/);
  });

  it('NA-4: peek actions prefer wire mapPeekActions (no client recompute on empty list)', () => {
    const peekEngagement = read('src/activity/activityPeekEngagement.ts');
    expect(peekEngagement).toMatch(/if \(fromApi !== undefined\)/);
    expect(peekEngagement).toMatch(/resolveActivityEngagementPolicy/);
    expect(existsSync(join(process.cwd(), 'src/activity/resolveActivityPresentation.ts'))).toBe(
      false
    );
    expect(read('src/activity/activityDetailPresentation.ts')).toMatch(
      /resolveActivityDetailPresentation/
    );
    const privateItem = read('src/explore/privateActivityExploreItem.ts');
    expect(privateItem).not.toMatch(/computeActivityMapPeekActions/);
  });

  it('NA-2: activity detail route does not import entitlement context resolver', () => {
    const routes = read('apps/api/src/routes/user/registerPublicActivityRoutes.ts');
    expect(routes).not.toMatch(/resolveActivityViewEntitlementContext/);
    expect(routes).not.toMatch(/activity-view-entitlement-context/);
    expect(routes).not.toMatch(/composeActivityViewerAccess/);
    expect(read('apps/api/src/services/activity-participation-commands.ts')).toContain(
      'composeActivityViewerAccess'
    );
  });

  it('NA-arch: viewer-access naming in Tier-1 + no sentence-long entitlement helpers', () => {
    const canon = read('docs/DOMAIN_CANONICALS.md');
    expect(canon).toContain('### 15.11 Naming vocabulary');

    const entitlements = read('packages/shared-types/src/activity-viewer-entitlements.ts');
    expect(entitlements).not.toMatch(/activityViewerEntitlementsCan/);
    const barrel = read('packages/shared-types/src/index.ts');
    expect(barrel).not.toMatch(/activityViewerEntitlementsCan/);
  });

  it('AD-4: activity peek uses strip component and presentation resolver', () => {
    const body = read('src/explore/ui/peek/activity/ActivityPeekBody.tsx');
    expect(body).toContain('ActivityPeekStrips');
    const strips = read('src/explore/ui/peek/activity/ActivityPeekStrips.tsx');
    expect(strips).toContain('resolveActivityMapPeekStrips');
    expect(() => read('src/explore/activityMapPeekActions.ts')).toThrow();
    const shared = read('packages/shared-types/src/activity-map-peek-actions.ts');
    expect(shared).toContain("id: 'open_crew_chat'");
    expect(shared).not.toMatch(/level === 'public'[\s\S]*message_host/);
  });

  it('G-plan: Tier-1 FAB vocabulary is Host · Find crew · Add on map', () => {
    const create = read('docs/CREATE_FLOW.md');
    expect(create).toMatch(/Host · Find crew · Add on map/);
    const index = read('docs/DOCS_INDEX.md');
    expect(index).toMatch(/Host · Find crew · Add on map/);
    const coherence = read('docs/SYSTEM_COHERENCE.md');
    expect(coherence).toMatch(/\*\*FAB \(UI\)\*\* \| \*\*Host\*\*/);
    expect(coherence).not.toMatch(/\| F1–F6 \| FAB \*\*Plan·Contribute\*\*/);
  });

  it('G-plan: My Plans routing module and /profile/plans alias', () => {
    const routing = read('src/plan/planRouting.ts');
    expect(routing).toContain('normalizePlanSearchParams');
    expect(routing).toContain('planHostedSchedulePath');
    const app = readAppRouteRegistry();
    expect(app).toContain('path="/profile/plans"');
    expect(app).toContain('PlanBrowseRoute');
    const planRoute = read('src/routing/planBrowseRoute.tsx');
    expect(planRoute).toContain("import('../plan/PlanPage')");
    const planPage = read('src/plan/PlanPage.tsx');
    expect(planPage).toContain('normalizePlanSearchParams');
    const nav = read('docs/NAVIGATION.md');
    expect(nav).toMatch(/Host.*Find crew.*Add on map/);
    expect(nav).toContain('disambiguation');
  });

  it('G-chat: /groups is manage-only; threads use /chat?group=', () => {
    const groups = read('src/pages/Groups.tsx');
    expect(groups).not.toMatch(/GroupChatThread/);
    expect(groups).not.toMatch(/chat-app/);
    expect(groups).not.toMatch(/groups-app/);
    expect(groups).not.toMatch(/FormTabBar/);
    expect(groups).not.toMatch(/SocialHubNav/);
    expect(groups).toMatch(/layout="stack"/);
    expect(groups).toMatch(/PRODUCT_GROUPS_SURFACE_LABEL/);
    expect(groups).toMatch(/backChrome/);
    expect(groups).toMatch(/SettingsMenuRow/);
    expect(groups).toMatch(/\+Invite/);
    expect(groups).toMatch(/Add Kids/);
    expect(groups).toMatch(/GroupMembersPanel/);
    expect(groups).toMatch(/GroupEditPanel/);
    expect(groups).toMatch(/openGroupManage\(.*'edit'\)/);
    expect(groups).toMatch(/navigateToGroupChatFromSocial/);
    expect(groups).toMatch(/groupsManagePath/);
    expect(groups).toMatch(/openGroupManage/);
    const routing = read('src/utils/notificationRouting.ts');
    expect(routing).toMatch(/normalizeConsumerChatDeepLinkPath/);
    expect(routing).toMatch(/messagesGroupPath/);
  });

  it('Social hub: Settings menu rows only — no stacked FormTabBar / hub tab strips', () => {
    const buddies = read('src/pages/Buddies.tsx');
    const hub = read('src/components/social/SocialHubNav.tsx');
    const groups = read('src/pages/Groups.tsx');
    expect(buddies).not.toMatch(/FormTabBar/);
    expect(buddies).toMatch(/SocialHubIndex/);
    expect(buddies).toMatch(/searchParams\.get\('section'\)/);
    expect(buddies).toMatch(/useSocialHubBackChrome/);
    expect(buddies).not.toMatch(/ChevronLeft/);
    expect(groups).toMatch(/PRODUCT_GROUPS_SURFACE_LABEL/);
    expect(groups).toMatch(/shellTitle/);
    expect(groups).not.toMatch(/ChevronLeft/);
    expect(groups).toMatch(/photoUrl/);
    expect(groups).toMatch(/GroupMembersPanel/);
    expect(hub).toMatch(/SettingsMenuRow/);
    expect(hub).toMatch(/SocialHubIndex/);
    expect(hub).not.toMatch(/border-b-2/);
  });
});
