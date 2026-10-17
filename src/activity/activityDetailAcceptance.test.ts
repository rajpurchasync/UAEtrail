/**
 * Activity detail + map peek program gates.
 * @see docs/experiment/activity-detail-tabs-implementation-plan.md
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const PROGRAM_DOC = 'docs/experiment/activity-detail-tabs-implementation-plan.md';
const MEMBER_SURFACES = 'docs/experiment/member-surfaces-implementation-plan.md';

describe('activity detail program — governance', () => {
  it('AD-ARCH-01: canonical program doc exists with phase status', () => {
    const plan = read(PROGRAM_DOC);
    expect(plan).toMatch(/\*\*Status:\*\* `(in_progress|complete)`/);
    expect(plan).toMatch(/## 8\. Trace matrix/);
    expect(plan).toMatch(/AD-PEEK-03/);
  });

  it('AD-ARCH-02: member-surfaces §21 points at program doc (not a second truth)', () => {
    const member = read(MEMBER_SURFACES);
    expect(member).toMatch(/activity-detail-tabs-implementation-plan\.md/);
    expect(member).toMatch(/exit criteria live here|canonical program|program doc/i);
  });

  it('AD-ARCH-03: cursor rule for activity detail program', () => {
    const rule = read('.cursor/rules/activity-detail-program.mdc');
    expect(rule).toMatch(/activity-detail-tabs-implementation-plan/);
    expect(rule).toMatch(/Definition of done/i);
    expect(rule).toMatch(/§6\.2/);
  });

  it('AD-ARCH-04: dynamic CTA matrix spec present (§6.2 A–E + §6.7)', () => {
    const plan = read(PROGRAM_DOC);
    expect(plan).toMatch(/### 6\.7 Implementation sequence/);
    expect(plan).toMatch(/AD-CTA-01/);
    expect(read('src/activity/activity-detail-cta-matrix.test.ts')).toMatch(/AD-ARCH-04/);
  });

  it('AD-PEEK-02 (partial): L1 resolveActivityEngagementPolicy owns map peek base actions', () => {
    const policy = read('packages/shared-types/src/activity-engagement-policy.ts');
    expect(policy).toMatch(/resolveActivityEngagementPolicy/);
    expect(policy).toMatch(/projectActivityMapPeekActions/);
    const api = read('apps/api/src/lib/explore-map-viewer-access.ts');
    expect(api).toMatch(/resolveActivityEngagementMapPeekActionsBase/);
    expect(api).not.toMatch(/computeActivityMapPeekActions\(/);
  });

  it('AD-DEDUPE-01: explore peek has no showHostActivityCtas / host CTA handler plumbing', () => {
    const model = read('src/discovery/discoveryCardModel.ts');
    expect(model).not.toMatch(/showHostActivityCtas/);
    const experience = read('src/explore/ui/ExploreExperience.tsx');
    expect(experience).not.toMatch(/showHostActivityCtas/);
    expect(experience).not.toMatch(/publishedActivityCtaHandlers/);
    const peekSlots = read('src/explore/ui/map-peek/mapPeekSlots.tsx');
    expect(peekSlots).not.toMatch(/HostActivityCtas/);
    const presentation = read('src/activity/activityDetailPresentation.ts');
    expect(presentation).toMatch(/resolveActivityEngagementPolicy/);
  });

  it('AD-PEEK-05: host peek uses My host profile subtitle from mapPeekStrips wire', () => {
    const peopleRow = read('src/explore/ui/ExploreCardPresentation.tsx');
    expect(peopleRow).toMatch(/showHostSelfProfileLink/);
    expect(peopleRow).toMatch(/ACTIVITY_PEEK_MY_ORGANIZER_PROFILE_SUBTITLE/);
    const copy = read('src/content/activityPeekCopy.ts');
    expect(copy).toMatch(/ACTIVITY_PEEK_MY_ORGANIZER_PROFILE_SUBTITLE/);
  });

  it('AD-DEDUPE-01 (finish): mapPeekStrips carries pendingJoinInviteCount + peek UI chip', () => {
    const policy = read('packages/shared-types/src/activity-engagement-policy.ts');
    expect(policy).toMatch(/pendingJoinInviteCount/);
    const api = read('apps/api/src/lib/explore-map-viewer-access.ts');
    expect(api).toMatch(/pendingJoinInviteCountByActivityId/);
    const strips = read('src/explore/ui/peek/activity/ActivityPeekStrips.tsx');
    expect(strips).toMatch(/pendingJoinInviteCount/);
    expect(strips).toMatch(/activityPeekPendingInviteChipLabel/);
  });

  it('AD-PEEK-06: host peek share_activity + manage_activity handlers wired', () => {
    const actions = read('src/explore/ui/useExploreSelectionActions.ts');
    expect(actions).toMatch(/executeActivityMapPeekAction/);
    expect(actions).toMatch(/shareActivity:/);
    expect(actions).toMatch(/navigator\.share/);
    expect(actions).toMatch(/manageActivity:/);
    expect(actions).toMatch(/onOpenHostManage/);
    const model = read('src/explore/shell/useExploreExperienceModel.ts');
    expect(model).toMatch(/useHostActivitySheetBundle/);
    expect(model).toMatch(/onOpenHostManage: tenantId/);
    const hostHandlers = read('src/activity/publishedActivityCtaHandlers.ts');
    expect(hostHandlers).toMatch(/onViewParticipants\?:/);
    const detail = read('src/pages/ActivityDetail.tsx');
    expect(detail).toMatch(/onOpenHostManage/);
    expect(read('src/components/activity/ActivityDetailView.tsx')).toMatch(/onOpenHostManage/);
    expect(actions).toMatch(/onShareHostedActivity/);
    expect(model).toMatch(/onShareHostedActivity: shareHostedActivity/);
    const listFeed = read('src/list/ui/ListFeedActionsProvider.tsx');
    expect(listFeed).toMatch(/onShareHostedActivity/);
    const sticky = read('src/components/activity/detail/ActivityDetailStickyFooter.tsx');
    expect(sticky).toMatch(/onHostShareOuting/);
  });

  it('AD-HYGIENE-02: list wire footers share ListFeedWireFooterButtons', () => {
    const shared = read('src/list/ui/ListFeedWireFooterButtons.tsx');
    expect(shared).toMatch(/ListFeedWireFooterVariant/);
    const poster = read('src/list/ui/ListFeedPosterFooter.tsx');
    expect(poster).toMatch(/ListFeedWireFooterButtons/);
    const compact = read('src/explore/ui/ExploreListRowWireFooter.tsx');
    expect(compact).toMatch(/ListFeedWireFooterButtons/);
  });

  it('AD-HYGIENE-01: People browse panel is not wrapped in ListFeedActionsProvider', () => {
    const browsePanels = read('src/explore/shell/ExploreExperienceBrowsePanels.tsx');
    const peoplePanelBlock = browsePanels.match(
      /const mobileListPeopleBrowsePanel = \([\s\S]*?\n {2}\);/
    )?.[0];
    expect(peoplePanelBlock).toBeTruthy();
    expect(peoplePanelBlock!).toMatch(/PeopleBrowsePanel/);
    expect(peoplePanelBlock!).not.toMatch(/ListFeedActionsProvider/);
    expect(browsePanels).toMatch(/const mobileMapListPanel[\s\S]*ExploreBrowsePanel/);
    expect(browsePanels).not.toMatch(/const mobileMapListPanel[\s\S]*ListFeedActionsProvider/);
  });

  it('AD-LIST-08: list feed and map peek share executeActivityMapPeekAction', () => {
    const executor = read('src/activity/executeActivityMapPeekAction.ts');
    expect(executor).toMatch(/withdraw_join/);
    expect(executor).toMatch(/offer_rideshare/);
    const listFeed = read('src/list/ui/ListFeedActionsProvider.tsx');
    expect(listFeed).toMatch(/executeActivityMapPeekAction/);
    const exploreActions = read('src/explore/ui/useExploreSelectionActions.ts');
    expect(exploreActions).toMatch(/executeActivityMapPeekAction/);
  });

  it('AD-PEEK-07: explore map list rows open peek without inline join CTAs', () => {
    const browsePanels = read('src/explore/shell/ExploreExperienceBrowsePanels.tsx');
    expect(browsePanels).not.toMatch(/ListFeedActionsProvider/);
    const listRow = read('src/explore/ui/ExploreListRow.tsx');
    expect(listRow).toMatch(/ExploreListRowWireFooter/);
    const wireFooter = read('src/explore/ui/ExploreListRowWireFooter.tsx');
    expect(wireFooter).toMatch(/useListFeedActionsOptional/);
  });

  it('AD-PEEK-03: activity map peek must not branch to HostActivityCtas', () => {
    const peekActions = read('src/explore/ui/peek/activity/ActivityPeekActions.tsx');
    expect(peekActions).not.toMatch(/showHostActivityCtas[\s\S]*HostActivityCtas/);
    expect(peekActions).not.toMatch(/<HostActivityCtas/);
  });

  it('AD-PRES-03: host detail uses wire CTAs + ActivityManageSheet (no legacy host footer override)', () => {
    const sticky = read('src/components/activity/detail/ActivityDetailStickyFooter.tsx');
    expect(sticky).toMatch(/hostSecondaryActions/);
    expect(sticky).toMatch(/plan_host_share/);
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/onOpenHostManage/);
    expect(page).toMatch(/hostSheets\.hostManageSheet/);
    expect(page).not.toMatch(/hostDetailCtas/);
    expect(page).not.toMatch(/footerOverride/);
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(view).not.toMatch(/hostMobilePlanAccessory/);
  });

  it('AD-PRES-01: public activity detail returns presentation envelope', () => {
    const readModel = read('apps/api/src/services/activity-public-read.ts');
    expect(readModel).toMatch(/presentation/);
    expect(readModel).toMatch(/buildActivityPresentationForDetail/);
    expect(readModel).toMatch(/pendingJoinInviteCount/);
    expect(read('apps/api/src/routes/user/registerPublicActivityRoutes.ts')).toMatch(
      /loadPublicActivityDetail/
    );
    const hero = read('src/activity/activityDetailHeroStatus.ts');
    expect(hero).toMatch(/pendingJoinInviteCount/);
  });

  it('AD-PRES-04: consumer detail wire CTAs — modal sheet footer (peek parity)', () => {
    const consumerBody = read('src/activity/detail/templates/ActivityConsumerDetailPage.tsx');
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(view).toMatch(/ActivityConsumerDetailModalShell/);
    expect(view).toMatch(/footer=\{model\.stickyFooter\}/);
    expect(consumerBody).toMatch(/ConsumerDetailHostRow/);
    const joinSurfaces = read('src/components/activity/detail/useActivityDetailJoinSurfaces.tsx');
    expect(joinSurfaces).toMatch(/consumerWireEngagementCta/);
    expect(consumerBody).toMatch(/ConsumerDetailGettingThere/);
    expect(consumerBody).toMatch(/ConsumerDetailLead/);
    expect(consumerBody).toMatch(/ConsumerDetailSocialRow/);
    expect(consumerBody).toMatch(/activity-detail-meeting-point/);
    const actions = read('src/components/activity/detail/ActivityDetailEngagementActions.tsx');
    expect(actions).toMatch(/resolveActivityMapPeekActions/);
    expect(actions).toMatch(/view_detail/);
  });

  it('AD-GUEST-01: guests get page-level sign-in gate only (map peek uses browse gate)', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/ActivityDetailGuestGate/);
    expect(page).toMatch(/if \(!user\)/);
    const peekJoin = read('src/explore/ui/useExploreSelectionPeekJoin.ts');
    expect(peekJoin).toMatch(/openGuestBrowseGate/);
    const access = read('src/access/mapViewerAccessToUi.ts');
    expect(access).toMatch(/guest_gate/);
  });

  it('AD-LAYOUT-01: public route uses consumer scroll layout (embed keeps tab wire)', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).not.toMatch(/previewMode=\{isRedactedPreview\}/);
    expect(page).toMatch(/requiresSignIn/);
    const shell = read('src/activity/detail/templates/ActivityDetailPageShell.tsx');
    expect(shell).toMatch(/consumerDetailLayout/);
    const handlers = read('src/activity/useActivityDetailMapPeekHandlers.ts');
    expect(handlers).toMatch(/consumerDetailLayout/);
    expect(handlers).toMatch(/onOpenParticipationManage/);
  });

  it('AD-LAYOUT-02: guests never render consumer detail shell (sign-in gate only)', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/inviteOnlyLock/);
    expect(page).toMatch(/if \(!user\) \{[\s\S]*ActivityDetailGuestGate/);
    expect(page).toMatch(/backLabel=""/);
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(view).toMatch(/backLabel = ''/);
  });

  it('AD-PRIVATE-01: private hosted plans stay off Explore/Browse and invite-only on detail', () => {
    const mapBase = read('apps/api/src/lib/explore-map-base.ts');
    expect(mapBase).toMatch(/resolveJoinMode\(event\.joinMode, event\.requirements\) === 'private'/);
    const assembler = read('apps/api/src/lib/activity-read-assembler.ts');
    expect(assembler).toMatch(/shouldHideActivityFromExploreMap/);
    const access = read('packages/shared-types/src/activity-viewer-access.ts');
    expect(access).toMatch(/gateReason: 'invite_only'/);
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/not listed on Explore/);
    const commands = read('apps/api/src/services/activity-participation-commands.ts');
    expect(commands).toMatch(/assertPrivateActivityJoinAllowed/);
    expect(read('apps/api/src/routes/user/registerPublicActivityRoutes.ts')).toMatch(
      /submitPublicActivityJoinRequest/
    );
  });

  it('AD-TEMPLATE-01: `/activity/:id` routes through per-kind consumer page templates', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/ActivityDetailByKind/);
    expect(page).not.toMatch(/<ActivityDetailView/);
    const byKind = read('src/activity/detail/templates/ActivityDetailByKind.tsx');
    expect(byKind).toMatch(/resolveActivityDetailKind/);
    for (const file of [
      'src/activity/detail/templates/HikingActivityDetailPage.tsx',
      'src/activity/detail/templates/CampingActivityDetailPage.tsx',
      'src/activity/detail/templates/RideshareActivityDetailPage.tsx',
      'src/activity/detail/templates/OtherActivityDetailPage.tsx',
      'src/activity/detail/templates/ActivityDetailPageShell.tsx',
    ]) {
      expect(read(file)).toMatch(/ActivityDetailPageShell|ActivityDetailView/);
    }
    for (const file of [
      'src/pages/place/HikingPlaceDetailPage.tsx',
      'src/pages/place/CampingPlaceDetailPage.tsx',
      'src/pages/place/EventPlaceDetailPage.tsx',
    ]) {
      expect(read(file)).toMatch(/PlaceDetailPage/);
    }
    expect(read('src/pages/AreaDetailPage.tsx')).toMatch(/AreaDetailView/);
  });

  it('AD-PAGE-MODEL-01 (S13-W7): L1 page model drives tab bar + plan facts', () => {
    expect(read('src/activity/detail/buildActivityDetailPageModel.ts')).toMatch(
      /buildActivityDetailPageModel/
    );
    const vm = read('src/components/activity/detail/useActivityDetailViewModel.tsx');
    expect(vm).toMatch(/buildActivityDetailPageModel/);
    expect(vm).toMatch(/visibleMobileTabs/);
    const tabBar = read('src/components/activity/detail/ActivityDetailTabBar.tsx');
    expect(tabBar).toMatch(/visibleTabs/);
    const planColumn = read('src/components/activity/detail/ActivityDetailPlanColumn.tsx');
    expect(planColumn).toMatch(/KindPlanSections/);
    expect(planColumn).not.toMatch(/ActivityDetailPlanFactsSection/);
    expect(planColumn).toMatch(/showPlaceTab/);
    expect(planColumn).toMatch(/showTransportTab/);
    const body = read('src/components/activity/detail/ActivityDetailBody.tsx');
    expect(body).toMatch(/ActivityDetailPlanColumn/);
    expect(body).toMatch(/ActivityDetailSidebarColumn/);
    expect(body).not.toMatch(/ActivityDetailPlaceTabPanels/);
    expect(read('src/pages/ActivityDetail.tsx')).toMatch(/resolveActivityDetailMobileTab/);
    expect(read('src/pages/ActivityDetail.tsx')).toMatch(/ActivityDetailByKind/);
    expect(read('src/pages/ActivityDetail.tsx')).not.toMatch(/<ActivityDetailView/);
  });

  it('AD-ROUTE-LAYER-01: route loader vs kind templates (place parity)', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/usePublicActivityDetail/);
    expect(page).toMatch(/ActivityDetailByKind/);
    expect(read('src/activity/detail/templates/ActivityDetailByKind.tsx')).toMatch(
      /PAGE_BY_KIND/
    );
    expect(read('src/pages/place/HikingPlaceDetailPage.tsx')).toMatch(/PlaceDetailPage/);
    expect(read('src/activity/detail/templates/HikingActivityDetailPage.tsx')).toMatch(
      /ActivityDetailPageShell/
    );
  });

  it('AD-KIND-COMPOSER-01 (S13-W7): kind pages wire plan section composers', () => {
    for (const file of [
      'src/activity/detail/templates/HikingActivityDetailPage.tsx',
      'src/activity/detail/templates/CampingActivityDetailPage.tsx',
      'src/activity/detail/templates/RideshareActivityDetailPage.tsx',
      'src/activity/detail/templates/OtherActivityDetailPage.tsx',
    ]) {
      const source = read(file);
      expect(source).toMatch(/planSections=/);
      expect(source).toMatch(/ActivityDetailPlanSections/);
    }
    expect(read('src/activity/detail/composers/index.ts')).toMatch(
      /ACTIVITY_DETAIL_KIND_PLAN_SECTIONS/
    );
  });

  it('AD-FOLD-01: consumer shell uses scroll layout (no tab body on public route)', () => {
    const shell = read('src/activity/detail/templates/ActivityDetailPageShell.tsx');
    expect(shell).toMatch(/consumerDetailLayout/);
    const consumerBody = read('src/activity/detail/templates/ActivityConsumerDetailPage.tsx');
    expect(consumerBody).toMatch(/ConsumerDetailGettingThere/);
    expect(consumerBody).toMatch(/ConsumerDetailLead/);
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(view).toMatch(/ActivityConsumerDetailPage/);
    expect(read('src/activity/detail/activityDetailPageShellCard.ts')).toMatch(
      /buildActivityDetailPageShellCard/
    );
  });

  it('AD-BODY-01: consumer body hosts profile + published facts; embed keeps Plan column', () => {
    const body = read('src/components/activity/detail/ActivityDetailPlanColumn.tsx');
    const aboutIdx = body.indexOf('<ActivityDetailPlanAboutCard');
    const extrasIdx = body.indexOf('<ActivityDetailPlanExtras');
    const placeIdx = body.indexOf('<ActivityDetailPlaceTabPanels');
    const consumerBody = read('src/activity/detail/templates/ActivityConsumerDetailPage.tsx');
    const hostIdx = consumerBody.indexOf('<ConsumerDetailHostRow');
    const publishedFactsIdx = consumerBody.indexOf('<ConsumerDetailLead');
    const sidebarColumn = read('src/components/activity/detail/ActivityDetailSidebarColumn.tsx');
    const sidebar = read('src/components/activity/detail/ActivityDetailPricingSidebar.tsx');
    const model = read('src/components/activity/detail/useActivityDetailViewModel.tsx');
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(aboutIdx).toBeGreaterThan(-1);
    expect(body).not.toMatch(/<ActivityDetailHostProfileCard/);
    expect(hostIdx).toBeGreaterThan(-1);
    expect(publishedFactsIdx).toBeGreaterThan(-1);
    expect(model).toMatch(/buildActivityDetailPageShellCard/);
    expect(extrasIdx).toBeGreaterThan(aboutIdx);
    expect(placeIdx).toBeGreaterThan(extrasIdx);
    expect(sidebarColumn).toMatch(
      /hideHostProfile=\{model\.consumerDetailLayout \|\| model\.requiresSignIn\}/
    );
    expect(sidebar).toMatch(/hideHostProfile/);
    expect(sidebar).toMatch(/ActivityDetailHostProfileCard/);
    expect(view).toMatch(/ActivityConsumerDetailModalShell/);
  });

  it('AD-CHROME-01: mobile chrome uses emoji + activity title (AD-2b, not kind-only chrome)', () => {
    const view = read('src/components/activity/ActivityDetailView.tsx');
    const model = read('src/components/activity/detail/useActivityDetailViewModel.tsx');
    const chrome = read('src/activity/activityKindChrome.ts');
    expect(model).not.toMatch(/kindChromeTitle/);
    expect(model).toMatch(/activityTitleChromeLine/);
    expect(view).toMatch(/titleChromeLine/);
    expect(chrome).toMatch(/activityTitleChromeLine/);
  });
});

describe('activity detail program — engagement wire (AD-PRO-01, AD-PRES-02)', () => {
  it('AD-PRO-01: peek people row gates roster with canViewFullBuddyRoster', () => {
    const peopleRow = read('src/explore/ui/ExploreCardPresentation.tsx');
    expect(peopleRow).toMatch(/canViewFullBuddyRoster/);
    expect(peopleRow).toMatch(/buddyUserIdsOnActivity/);
  });

  it('AD-PRES-02: public route uses presentation.consumerLayout; embed keeps tab wire', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/consumerLayout/);
    expect(page).not.toMatch(/wireFooterByTab/);
    expect(page).not.toMatch(/wireTabs=/);
    const consumerBody = read('src/activity/detail/templates/ActivityConsumerDetailPage.tsx');
    expect(consumerBody).toMatch(/consumerLayout/);
    expect(read('packages/shared-types/src/activity-detail-presentation.ts')).toMatch(
      /consumerLayout/
    );
    const manage = read('src/components/activity/ActivityManageSheet.tsx');
    expect(manage).toMatch(/wireTabs/);
    const model = read('src/components/activity/detail/useActivityDetailViewModel.tsx');
    expect(model).toMatch(/resolveActivityDetailTabUi/);
    expect(page).toMatch(/resolveActivityDetailWirePresentation/);
    expect(page).toMatch(/effectiveWirePresentation/);
    expect(page).toMatch(/mergeActivityDetailWirePresentation/);
  });
});

describe('discovery refactor — RF-01 list feed footers', () => {
  it('RF-01: list feed footer actions delegate join CTAs to L1 peek engagement', () => {
    const footerActions = read('src/list/listFeedFooterActions.ts');
    expect(footerActions).toMatch(/resolveActivityPeekEngagement/);
    expect(footerActions).toMatch(/resolveListFeedFooterModel/);
    expect(footerActions).not.toMatch(/\bswitch\s*\(/);
    expect(footerActions).not.toMatch(/participantIntentId/);

    const provider = read('src/list/ui/ListFeedActionsProvider.tsx');
    expect(provider).toMatch(/executeActivityMapPeekAction/);
    expect(provider).toMatch(/resolveListFeedFooterModel/);
    expect(provider).not.toMatch(/\bswitch\s*\([^)]*actionId/);
  });
});

describe('activity detail program — structure (R6)', () => {
  it('R6-01: embedded surfaces pass wire footers into ActivityDetailView', () => {
    for (const file of [
      'src/components/activities/ActivityPreviewOverlay.tsx',
      'src/components/activity/ActivityManageSheet.tsx',
    ]) {
      const source = read(file);
      expect(source).toMatch(/resolveActivityDetailWirePresentation/);
      expect(source).toMatch(/wireFooterByTab/);
    }
  });

  it('R6-02: explore host manage uses useHostActivitySheetBundle (no second sheet path)', () => {
    expect(read('src/explore/shell/useExploreExperienceModel.ts')).toMatch(/useHostActivitySheetBundle/);
    const bundle = read('src/hooks/useHostActivitySheetBundle.tsx');
    expect(bundle).toMatch(/ActivityManageSheet/);
  });

  it('R6-03: ActivityDetailView shell under 400 LOC', () => {
    const lineCount = read('src/components/activity/ActivityDetailView.tsx').split(/\n/).length;
    expect(lineCount).toBeLessThan(400);
  });
});
