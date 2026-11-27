/**
 * Activity detail + map peek wiring gates (code is source of truth).
 * @see docs/SYSTEM_COHERENCE.md §6.2 · mapDetailEngagementParity.test.ts · activity-detail-cta-matrix.test.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readAppRouteRegistry } from '../../scripts/dev/readAppRouteRegistry.mjs';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('activity detail program — wiring', () => {
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
    const peopleRow = read('src/explore/ui/DiscoveryCardPresentation.tsx');
    expect(peopleRow).toMatch(/showHostSelfProfileLink/);
    expect(peopleRow).toMatch(/ACTIVITY_PEEK_MY_HOST_PROFILE_SUBTITLE/);
    const copy = read('src/content/activityPeekCopy.ts');
    expect(copy).toMatch(/ACTIVITY_PEEK_MY_HOST_PROFILE_SUBTITLE/);
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
    expect(actions).toMatch(/useExploreSelectionMapPeekAction/);
    const mapPeekWire = read('src/explore/ui/useExploreSelectionMapPeekAction.ts');
    expect(mapPeekWire).toMatch(/executeActivityMapPeekAction/);
    expect(mapPeekWire).toMatch(/shareActivity:/);
    expect(actions).toMatch(/handleSharePeek/);
    expect(read('src/explore/ui/useExplorePeekShareAction.ts')).toMatch(/shareSheet\.openShare/);
    expect(mapPeekWire).toMatch(/manageActivity:/);
    expect(actions).toMatch(/onOpenHostManage/);
    const model = read('src/explore/shell/useExploreExperienceModel.ts');
    expect(model).toMatch(/useHostActivitySheetBundle/);
    expect(model).toMatch(/onOpenHostManage: tenantId/);
    expect(existsSync(join(process.cwd(), 'src/activity/publishedActivityCtaHandlers.ts'))).toBe(
      false
    );
    const detail = read('src/pages/ActivityDetail.tsx');
    expect(detail).toMatch(/onOpenHostManage/);
    expect(read('src/components/activity/ActivityDetailView.tsx')).toMatch(/onOpenHostManage/);
    expect(actions).toMatch(/onShareHostedActivity/);
    expect(model).toMatch(/onShareHostedActivity: shareHostedActivity/);
    const listFeed = read('src/list/browse/ListFeedActionsProvider.tsx');
    expect(listFeed).toMatch(/onShareHostedActivity/);
    const sticky = read('src/components/activity/detail/ActivityDetailStickyFooter.tsx');
    expect(sticky).toMatch(/onHostShareOuting/);
  });

  it('AD-HYGIENE-02: list wire footers share ListFeedWireFooterButtons', () => {
    const shared = read('src/list/browse/ListFeedWireFooterButtons.tsx');
    expect(shared).toMatch(/ListFeedWireFooterVariant/);
    expect(existsSync(join(process.cwd(), 'src/list/ui/ListFeedPosterFooter.tsx'))).toBe(false);
    const compact = read('src/explore/ui/ExploreListRowWireFooter.tsx');
    expect(compact).toMatch(/DiscoveryCardWireEngagementFooter/);
    expect(read('src/discovery/DiscoveryCardWireEngagementFooter.tsx')).toMatch(
      /ListFeedWireFooterButtons/
    );
  });

  it('AD-HYGIENE-01: People browse panel is not wrapped in ListFeedActionsProvider', () => {
    const browsePanels = read('src/explore/shell/ExploreExperienceBrowsePanels.tsx');
    expect(browsePanels).toMatch(/CrewsBrowsePanel/);
    expect(browsePanels).not.toMatch(/ListFeedActionsProvider/);
    expect(browsePanels).not.toMatch(/ExploreBrowsePanel/);
  });

  it('AD-LIST-08: list feed and map peek share executeActivityMapPeekAction', () => {
    const executor = read('src/activity/executeActivityMapPeekAction.ts');
    expect(executor).toMatch(/withdraw_join/);
    expect(executor).toMatch(/offer_rideshare/);
    const listFeed = read('src/list/browse/ListFeedActionsProvider.tsx');
    expect(listFeed).toMatch(/executeActivityMapPeekAction/);
    const exploreActions = read('src/explore/ui/useExploreSelectionActions.ts');
    expect(exploreActions).toMatch(/useExploreSelectionMapPeekAction/);
    const mapPeekWire = read('src/explore/ui/useExploreSelectionMapPeekAction.ts');
    expect(mapPeekWire).toMatch(/executeActivityMapPeekAction/);
  });

  it('AD-MANAGE-01: publishing + hosting hub use map-peek wire footer (no parallel host resolvers)', () => {
    const wireFooter = read('src/components/activity/ActivityMapPeekWireFooter.tsx');
    expect(wireFooter).toMatch(/resolveActivityMapPeekActionsForHostDto/);
    expect(wireFooter).toMatch(/resolveListFeedFooterFromMapPeekWire/);
    expect(wireFooter).toMatch(/executeActivityMapPeekAction/);
    expect(wireFooter).toMatch(/DiscoveryCardMapPeekEngagementFooter/);
    const publishing = read('src/pages/publishing/Activities.tsx');
    expect(publishing).toMatch(/ActivityMapPeekWireFooter/);
    const hub = read('src/hosting/HostingHubView.tsx');
    expect(hub).toMatch(/mapPeekHandlersFor/);
    const row = read('src/components/activity/HostedActivityListRow.tsx');
    expect(row).toMatch(/ActivityMapPeekWireFooter/);
    const historyHosted = read('src/components/activity/HostedActivitiesSection.tsx');
    expect(historyHosted).toMatch(/mapPeekHandlersFor/);
    const peekFooter = read('src/explore/ui/peek/activity/ActivityPeekStandardFooter.tsx');
    expect(peekFooter).toMatch(/resolveListFeedFooterModel/);
    expect(existsSync(join(process.cwd(), 'src/activity/resolveHostActivityPeekTwoSlot.ts'))).toBe(
      false
    );
    expect(
      existsSync(join(process.cwd(), 'src/components/activity/HostedActivityEngagementActions.tsx'))
    ).toBe(false);
  });

  it('AD-PEEK-07: list explorer opens entity detail; people rows omit join CTAs without provider', () => {
    const explorerLink = read('src/list/browse/BrowseItemLink.tsx');
    expect(explorerLink).toMatch(/browseListEntityLinkState/);
    const browsePanels = read('src/explore/shell/ExploreExperienceBrowsePanels.tsx');
    expect(browsePanels).not.toMatch(/ListFeedActionsProvider/);
    const listRow = read('src/explore/ui/ExploreListRow.tsx');
    expect(listRow).toMatch(/ExploreListRowWireFooter/);
    const wireFooter = read('src/explore/ui/ExploreListRowWireFooter.tsx');
    expect(wireFooter).toMatch(/DiscoveryCardWireEngagementFooter/);
    expect(read('src/discovery/DiscoveryCardWireEngagementFooter.tsx')).toMatch(
      /useListFeedActionsOptional/
    );
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
    expect(page).not.toMatch(/hostSheets/);
    expect(read('src/activity/detail/templates/ActivityDetailSections.tsx')).toMatch(/activityCrewPath/);
    expect(read('src/activity/detail/templates/ActivityDetailSections.tsx')).not.toMatch(
      /ActivityDetailHostCrewHub/
    );
    expect(read('src/pages/ActivityCrewPage.tsx')).toMatch(/ActivityDetailHostCrewHub/);
    expect(read('src/routing/AppRoutes.tsx')).toMatch(/\/activity\/:id\/crew/);
    expect(page).not.toMatch(/CreateHostingActivityFlow/);
    expect(page).not.toMatch(/hostDetailCtas/);
    expect(page).not.toMatch(/footerOverride/);
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(view).not.toMatch(/hostMobilePlanAccessory/);
  });

  it('AD-PART-SPINE-01: host Crew tab approves via publishingJoinQueueClientApi', () => {
    const hub = read('src/components/activity/detail/ActivityDetailHostCrewHub.tsx');
    expect(hub).toMatch(/publishingJoinQueueClientApi/);
    expect(hub).toMatch(/afterHostJoinDecisionClientRefresh/);
    expect(hub).not.toMatch(/\bapi\./);
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
    const consumerBody = read('src/activity/detail/templates/ActivityDetailSections.tsx');
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(view).toMatch(/MobileDetailScrollShell/);
    expect(view).toMatch(/footer=\{model\.stickyFooter\}/);
    expect(consumerBody).toMatch(/ActivityDetailHostRow/);
    const joinSurfaces = read('src/components/activity/detail/useActivityDetailJoinSurfaces.tsx');
    expect(joinSurfaces).toMatch(/consumerWireEngagementCta/);
    expect(consumerBody).toMatch(/ActivityDetailGettingThere/);
    expect(consumerBody).toMatch(/ActivityDetailLead/);
    expect(consumerBody).toMatch(/ConsumerDetailHeroGeoLine/);
    expect(consumerBody).toMatch(/resolveActivityDetailGeoHero/);
    expect(consumerBody).toMatch(/ActivityDetailSocialRow/);
    expect(consumerBody).toMatch(/activity-detail-meeting-point/);
    const actions = read('src/components/activity/detail/ActivityDetailEngagementActions.tsx');
    expect(actions).toMatch(/resolveActivityMapPeekActions/);
    expect(actions).toMatch(/participant_invite/);
    expect(actions).not.toMatch(/ActivityParticipationManageSheet/);
  });

  it('AD-GUEST-01: guests get in-page sign-in gate on the consumer template (map peek uses browse gate)', () => {
    const template = read('src/activity/detail/templates/ActivityDetailSections.tsx');
    expect(template).toMatch(/ActivityDetailGuestGate/);
    expect(template).toMatch(/requiresSignIn/);
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
    expect(shell).not.toMatch(/scrollDetailLayout/);
    const handlers = read('src/activity/useActivityDetailMapPeekHandlers.ts');
    expect(handlers).toMatch(/publicDetail/);
    expect(handlers).toMatch(/onOpenParticipationManage/);
  });

  it('AD-LAYOUT-02: guests share the consumer detail shell (compact sign-in gate in the same panel)', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/inviteOnlyLock/);
    expect(page).toMatch(/backLabel=""/);
    const template = read('src/activity/detail/templates/ActivityDetailSections.tsx');
    expect(template).toMatch(/ActivityDetailGuestGate/);
    expect(template).toMatch(/compact/);
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(view).toMatch(/backLabel = ''/);
    expect(view).toMatch(/MobileDetailScrollShell/);
  });

  it('AD-PRIVATE-01: private hosted plans stay off Explore/Browse and invite-only on detail', () => {
    const catalog = read('apps/api/src/lib/discovery-catalog-builder.ts');
    expect(catalog).toMatch(/resolveJoinMode\(event\.joinMode, event\.requirements\) === 'private'/);
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

  it('AD-SEEK-01: legacy seeking outings stay on activity route but join is disabled', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/ActivityDetailByKind/);
    expect(page).not.toMatch(/demand:/);
    expect(page).not.toMatch(/ParticipantIntentManageSheet/);
    expect(page).toMatch(/activityDetailIsRetiredSeekingPost/);
    expect(page).toMatch(/joinDisabled=\{isRetiredSeekingPost\}/);
    expect(page).toMatch(/RETIRED_SEEKING_ACTIVITY_DETAIL_NOTICE/);
    const header = read('src/activity/activityDetailHeaderChrome.ts');
    expect(header).toMatch(/activityDetailIsRetiredSeekingPost/);
    expect(header).toMatch(/RETIRED_SEEKING_ACTIVITY_DETAIL_HEADER/);
    const app = readAppRouteRegistry();
    expect(app).toMatch(/path="\/activity\/:id"/);
    expect(app).not.toMatch(/path="\/demand/);
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
      expect(existsSync(join(process.cwd(), file))).toBe(false);
    }
    expect(read('src/pages/PlaceDetailPage.tsx')).toMatch(/PlaceDetailPageShell/);
    expect(read('src/pages/DestinationDetailPage.tsx')).toMatch(/DestinationDetailView/);
  });

  it('AD-PAGE-MODEL-01 (S13-W7): L1 page model drives tab bar + plan facts', () => {
    expect(read('src/activity/detail/buildActivityDetailPageModel.ts')).toMatch(
      /buildActivityDetailPageModel/
    );
    const vm = read('src/components/activity/detail/useActivityDetailViewModel.tsx');
    expect(vm).toMatch(/buildActivityDetailPageModel/);
    expect(vm).toMatch(/visibleMobileTabs/);
    expect(read('src/components/activity/detail/ActivityDetailBody.tsx')).not.toMatch(
      /ActivityDetailTabBar/
    );
    const planColumn = read('src/components/activity/detail/ActivityDetailPlanColumn.tsx');
    expect(planColumn).toMatch(/KindPlanSections/);
    expect(planColumn).not.toMatch(/ActivityDetailPlanFactsSection/);
    expect(planColumn).not.toMatch(/showPlaceTab|showTransportTab/);
    const body = read('src/components/activity/detail/ActivityDetailBody.tsx');
    expect(body).toMatch(/ActivityDetailPlanColumn/);
    expect(body).toMatch(/ActivityDetailSidebarColumn/);
    expect(body).toMatch(/showPlaceTab/);
    expect(body).toMatch(/showTransportTab/);
    expect(body).toMatch(/ActivityDetailPlaceTabPanels/);
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
    expect(read('src/pages/PlaceDetailPage.tsx')).toMatch(/PlaceDetailPageShell/);
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
    expect(shell).toMatch(/ActivityDetailView/);
    const consumerBody = read('src/activity/detail/templates/ActivityDetailSections.tsx');
    expect(consumerBody).toMatch(/ActivityDetailGettingThere/);
    expect(consumerBody).toMatch(/ActivityDetailLead/);
    expect(consumerBody).toMatch(/ConsumerDetailHeroGeoLine/);
    expect(consumerBody).toMatch(/resolveActivityDetailGeoHero/);
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(view).toMatch(/ActivityDetailSections/);
    expect(read('src/activity/detail/activityDetailPageShellCard.ts')).toMatch(
      /buildActivityDetailPageShellCard/
    );
  });

  it('AD-BODY-01: public sections host profile + facts; embed body owns place and transport', () => {
    const body = read('src/components/activity/detail/ActivityDetailPlanColumn.tsx');
    const embed = read('src/components/activity/detail/ActivityDetailBody.tsx');
    const aboutIdx = body.indexOf('<ActivityDetailPlanAboutCard');
    const extrasIdx = body.indexOf('<ActivityDetailPlanExtras');
    const placeIdx = embed.indexOf('<ActivityDetailPlaceTabPanels');
    const consumerBody = read('src/activity/detail/templates/ActivityDetailSections.tsx');
    const hostIdx = consumerBody.indexOf('<ActivityDetailHostRow');
    const publishedFactsIdx = consumerBody.indexOf('<ActivityDetailLead');
    const sidebarColumn = read('src/components/activity/detail/ActivityDetailSidebarColumn.tsx');
    const sidebar = read('src/components/activity/detail/ActivityDetailPricingSidebar.tsx');
    const model = read('src/components/activity/detail/useActivityDetailViewModel.tsx');
    const peekCard = read('src/components/activity/detail/activityDetailViewModelPeekCard.ts');
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(aboutIdx).toBeGreaterThan(-1);
    expect(body).not.toMatch(/<ActivityDetailHostProfileCard/);
    expect(hostIdx).toBeGreaterThan(-1);
    expect(publishedFactsIdx).toBeGreaterThan(-1);
    expect(model).toMatch(/resolveActivityDetailPeekParityCard/);
    expect(peekCard).toMatch(/buildActivityDetailPageShellCard/);
    expect(extrasIdx).toBeGreaterThan(aboutIdx);
    expect(body).not.toMatch(/consumerInline|ActivityDetailPlaceTabPanels/);
    expect(consumerBody).toMatch(/factsOnly/);
    expect(placeIdx).toBeGreaterThan(-1);
    expect(embed.indexOf('<ActivityDetailTransportTabPanels')).toBeGreaterThan(placeIdx);
    expect(sidebarColumn).toMatch(
      /hideHostProfile=\{model\.publicDetail \|\| model\.requiresSignIn\}/
    );
    expect(sidebar).toMatch(/hideHostProfile/);
    expect(sidebar).toMatch(/ActivityDetailHostProfileCard/);
    expect(view).toMatch(/MobileDetailScrollShell/);
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
  it('AD-PRO-01: peek people row gates roster with canViewFullFriendRoster', () => {
    const peopleRow = read('src/explore/ui/DiscoveryCardPresentation.tsx');
    expect(peopleRow).toMatch(/canViewFullFriendRoster/);
    expect(peopleRow).toMatch(/friendUserIdsOnActivity/);
  });

  it('AD-PRES-02: public route uses presentation.sections; embed keeps tab wire', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/wireSections=/);
    expect(page).not.toMatch(/wireFooterByTab/);
    expect(page).not.toMatch(/wireTabs=/);
    const consumerBody = read('src/activity/detail/templates/ActivityDetailSections.tsx');
    expect(consumerBody).toMatch(/model\.sections/);
    expect(consumerBody).not.toMatch(/showPublishedCatalog: true/);
    expect(read('packages/shared-types/src/activity-detail-presentation.ts')).toMatch(
      /sections: ActivityPresentationSectionsDTO/
    );
    const manage = read('src/components/activity/ActivityManageSheet.tsx');
    expect(manage).toMatch(/wireSections/);
    expect(manage).not.toMatch(/wireTabs/);
    const model = read('src/components/activity/detail/useActivityDetailViewModel.tsx');
    expect(model).toMatch(/resolveActivityDetailTabUi/);
    expect(page).toMatch(/resolveActivityDetailWirePresentation/);
    expect(page).toMatch(/effectiveWirePresentation/);
    expect(page).toMatch(/mergeActivityDetailWirePresentation/);
  });
});

describe('discovery refactor — RF-01 list feed footers', () => {
  it('RF-01: list feed footer actions delegate join CTAs to L1 peek engagement', () => {
    const footerActions = read('src/list/browse/listFeedFooterActions.ts');
    expect(footerActions).toMatch(/resolveActivityPeekEngagement/);
    expect(footerActions).toMatch(/resolveListFeedFooterModel/);
    expect(footerActions).not.toMatch(/\bswitch\s*\(/);
    expect(footerActions).not.toMatch(/participantIntentId/);

    const provider = read('src/list/browse/ListFeedActionsProvider.tsx');
    expect(provider).toMatch(/executeActivityMapPeekAction/);
    expect(provider).toMatch(/resolveListFeedFooterModel/);
    expect(provider).toMatch(/applyPeekJoinOpenAfterClick/);
    expect(provider).not.toMatch(/\bswitch\s*\([^)]*actionId/);
    expect(read('src/discovery/DiscoveryBrowseListEngagementFooter.tsx')).not.toMatch(/primaryOnly/);
    expect(footerActions).toMatch(/resolveListFeedPeekSecondary/);
    expect(footerActions).toMatch(/peekActionLabelContext/);
    expect(read('src/list/browse/listMapPeekEngagementParity.test.ts')).toMatch(/listMapPeekEngagementParity/);
    expect(read('src/activity/resolveActivityPeekStatusChips.ts')).toMatch(/resolveActivityPeekStatusChips/);
    expect(read('src/list/browse/BrowseActivityStatusChips.tsx')).toMatch(
      /resolveActivityPeekStatusChips/
    );
  });
});

describe('activity detail program — structure (R6)', () => {
  it('R6-01: wire presentation resolver has executing contract tests', () => {
    expect(read('src/activity/resolveActivityDetailWirePresentation.test.ts')).toMatch(
      /resolveActivityDetailWirePresentation/
    );
  });

  it('R6-02: host desk routing contract test present', () => {
    expect(read('src/activity/activityHostDeskRouting.contract.test.ts')).toMatch(/activityCrewPath/);
    expect(read('src/hooks/useHostActivitySheetBundle.tsx')).not.toMatch(/ActivityManageSheet/);
  });

  it('R6-03: activity detail shell contract covers thin ActivityDetailView', () => {
    expect(read('src/components/activity/detail/activityDetailShell.test.ts')).toMatch(/ActivityDetailView/);
  });
});
