import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityGroupChatPostPolicy,
  ActivityPresentationTabsDTO,
  MyActivityRequestDTO,
  ActivityParticipationDTO,
  ReviewDTO,
} from '@uaetrail/shared-types';
import { activityJoinCtaLabel } from '@uaetrail/shared-types';
import { formatDate } from '../../utils';
import { activityPriceLabel } from '../../utils/activityPricing';
import { showTenantBrand, activityHostAvatar, activityHostName, activityHostUserId } from '../../utils/hostLabels';
import {
  exploreActivityPublisherTypeLabel,
  resolveActivityPublisherProfilePath,
} from '@uaetrail/shared-types';
import { activityDetailEyebrowForActivity } from '../../config/activityTypes';
import { detailBackPath } from '../../config/routingCatalog';
import { PARTICIPANT_PRIVACY } from '../../config/platform';
import type { ActivityViewerEntitlementsDTO } from '@uaetrail/shared-types';
import { buildGoogleMapsSearchUrl } from '../../utils/mapLinks';
import { MobileDetailShell } from '../mobile/MobileDetailShell';
import {
  ShareButton,
  ParticipantPreview,
  HostMessageButton,
  ActivityParticipationStatus,
  SecureAvatar,
  JoinRequestActions,
} from '../ui';
import { resolveJoinRequestUiState } from '../../utils/joinRequestUi';
import { activityRegistryPlacePath } from '../../utils/activityRegistryPlacePath';
import { ActivityInviteLauncher } from './ActivityInviteLauncher';
import { ActivityDetailMobileFooter } from './ActivityDetailMobileFooter';
import type { ActivityDetailTabId } from '../../activity/activityDetailTab';
import {
  activityKindChromeEmoji,
  activityKindChromeLabel,
  activityTitleChromeLine,
} from '../../activity/activityKindChrome';
import { ActivityDetailTabBar } from './detail/ActivityDetailTabBar';
import { ActivityDetailMobileHero } from './detail/ActivityDetailMobileHero';
import {
  ACTIVITY_DETAIL_PRO_HOST_PROFILE_HINT,
  ACTIVITY_DETAIL_PRO_ROSTER_HINT,
  ACTIVITY_DETAIL_PRO_SOCIAL_CTA,
} from '../../content/activityDetailCopy';
import {
  activityDetailShowHostProfileProUpsell,
  activityDetailShowRosterProUpsell,
} from '../../activity/activityDetailProSocial';
import { activityDetailPath, proMembershipPath } from '../../config/routingCatalog';
import { ActivityCrewChatPostPolicyCard } from './ActivityCrewChatPostPolicyCard';
import { buildActivitySharePayload, activityShareInputFromActivity } from '../../utils/activityShare';
import { useAuth } from '../../context/AuthContext';
import {
  buildParticipantPostCheckInReviewPrompts,
  participantPostCheckInReviewsPending,
} from '../../activity/activityPostCheckInReviewPrompts';
import { ActivityPostCheckInReviewPrompts } from './ActivityPostCheckInReviewPrompts';
import { ActivityHostCheckInReviewPrompt } from './ActivityHostCheckInReviewPrompt';
import { useHostParticipantReviewHints } from '../../hooks/useHostParticipantReviewHints';
import { extractActivityTransportReachLines } from '../../activity/activityDetailReachBy';
import { resolveActivityDetailTabUi } from '../../activity/resolveActivityDetailTabUi';
import type { ActivityDetailTabFooterKind } from '../../activity/activityDetailTabFooters';
import { resolveActivityDetailHeroStatusChips } from '../../activity/activityDetailHeroStatus';
import { activityDetailTabPanelClass } from './detail/activityDetailTabPanelClass';
import { ActivityDetailPlanAboutCard } from './detail/tabs/ActivityDetailPlanAboutCard';
import { ActivityDetailPlaceTabPanels } from './detail/tabs/ActivityDetailPlaceTabPanels';
import { ActivityDetailTransportTabPanels } from './detail/tabs/ActivityDetailTransportTabPanels';
import { ActivityDetailBuddiesAside } from './detail/tabs/ActivityDetailBuddiesAside';
import { ActivityDetailPlanExtras } from './detail/tabs/ActivityDetailPlanExtras';
import { ActivityDetailStickyFooter } from './detail/ActivityDetailStickyFooter';
import type { ActivityRequestView } from '../../api/index';

export interface ActivityDetailViewProps {
  activity: ActivityDetailDTO;
  previewMode?: boolean;
  backTo?: string;
  backLabel?: string;
  participation?: ActivityParticipationDTO | null;
  myRequest?: MyActivityRequestDTO | null;
  message?: string | null;
  error?: string | null;
  onJoin?: () => void;
  onWithdraw?: () => void;
  /** Host Chat + Manage (sticky `plan_host_share` + desktop sidebar). */
  hostDetailCtas?: ReactNode;
  sidebarJoinOverride?: ReactNode;
  /** Desktop sidebar — full crew chat / notifications cards (hidden on mobile; use footer shortcuts). */
  confirmedSidebarExtras?: ReactNode;
  joinDisabled?: boolean;
  /** Confirmed participant — may send Join me invites to buddies (host uses console). */
  canSendJoinInvites?: boolean;
  activityReviews?: ReviewDTO[];
  onActivityReviewSubmitted?: (review: ReviewDTO) => void;
  canWriteActivityReview?: boolean;
  mobileTab?: ActivityDetailTabId;
  onMobileTabChange?: (tab: ActivityDetailTabId) => void;
  /** Meeting point + group roster — confirmed joiners and hosts only. */
  canAccessCrewSurfaces?: boolean;
  /** Mobile sticky footer — group chat + alerts (confirmed participant, not host). */
  showParticipantFooterShortcuts?: boolean;
  /** Mobile Buddies tab lock card — from `resolveActivityPresentation.showCrewLockedHint`. */
  showCrewLockedHint?: boolean;
  /** Layer 7 from `viewerAccess.entitlements` — roster / host profile gates. */
  viewerEntitlements?: ActivityViewerEntitlementsDTO | null;
  /** Host manage sheet — same tabs/content without page chrome or sticky join footer. */
  layout?: 'page' | 'embedded';
  /** Host ⋯ on mobile Plan hero (duplicate, delete, …). */
  hostMobilePlanAccessory?: ReactNode;
  /** Host — crew chat post policy (`groupChatPostPolicy` on activity). */
  hostCrewChatPolicy?: {
    tenantId: string;
    onSaved?: (policy: ActivityGroupChatPostPolicy) => void;
    onError?: (message: string) => void;
  };
  /** Host Buddies tab — roster, pending queue, check-in (v3.2). */
  hostBuddiesHub?: {
    joinRequests: ActivityRequestView[];
    requestsLoading: boolean;
    onRequestsChanged: () => void | Promise<void>;
  };
  /** Wire `presentation.footerByTab` from GET /activities/:id (AD-PRES-02). */
  wireFooterByTab?: Record<ActivityDetailTabId, ActivityDetailTabFooterKind> | null;
  /** Wire `presentation.tabs` from GET /activities/:id (AD-PRES-02). */
  wireTabs?: ActivityPresentationTabsDTO | null;
  /** Wire `presentation.strips` — host invited chip on hero, etc. */
  wireStrips?: ActivityEngagementStripsDTO | null;
  onHostShareOuting?: () => void;
}

export const ActivityDetailView = ({
  activity,
  previewMode = false,
  backTo = detailBackPath('activity'),
  backLabel = 'Explore',
  participation = null,
  myRequest = null,
  message = null,
  error = null,
  onJoin,
  onWithdraw,
  hostDetailCtas,
  sidebarJoinOverride,
  confirmedSidebarExtras,
  joinDisabled,
  canSendJoinInvites = false,
  activityReviews = [],
  onActivityReviewSubmitted,
  canWriteActivityReview = false,
  mobileTab = 'plan',
  onMobileTabChange,
  canAccessCrewSurfaces = false,
  showParticipantFooterShortcuts = false,
  showCrewLockedHint = false,
  viewerEntitlements = null,
  layout = 'page',
  hostMobilePlanAccessory,
  hostCrewChatPolicy,
  hostBuddiesHub,
  wireFooterByTab = null,
  wireTabs = null,
  wireStrips = null,
  onHostShareOuting,
}: ActivityDetailViewProps) => {
  const { user } = useAuth();
  const isEmbedded = layout === 'embedded';
  const joinActionDisabled = joinDisabled ?? false;

  const linkedRideshareId =
    activity.linkedRideshare?.id ?? activity.linkedParentActivity?.id ?? null;
  const tabUi = useMemo(
    () =>
      resolveActivityDetailTabUi({
        wireTabs,
        previewMode,
        isEmbedded,
        onMobileTabChange,
        canAccessCrewSurfaces,
        showCrewLockedHint,
        showParticipantFooterShortcuts,
        rideshareEnabled: Boolean(activity.rideshareEnabled),
        hasLinkedRideshare: Boolean(
          linkedRideshareId || activity.linkedParentActivity || activity.linkedRideshare
        ),
      }),
    [
      wireTabs,
      previewMode,
      isEmbedded,
      onMobileTabChange,
      canAccessCrewSurfaces,
      showCrewLockedHint,
      showParticipantFooterShortcuts,
      activity.rideshareEnabled,
      activity.linkedParentActivity,
      activity.linkedRideshare,
      linkedRideshareId,
    ]
  );
  const {
    showMobileTabs,
    showPlanTransportTeaser,
    showPlaceCrewBody,
    showPlaceLockedOnMobile,
    showCrewLockedHint: buddiesCrewLockedHint,
    showParticipantFooterShortcuts: participantFooterShortcuts,
    showHostManageHub,
    showTransportEncouragementOnTab,
  } = tabUi;

  const heroImage =
    activity.images?.[0] ??
    activity.location?.images?.[0] ??
    (activity.activityType === 'camping'
      ? 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600'
      : activity.activityType === 'event'
        ? 'https://images.unsplash.com/photo-1452626038306-9fff603b72e5?w=1600'
        : 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600');

  const participants = activity.participants ?? [];
  const rosterParticipants = useMemo(() => {
    if (!canAccessCrewSurfaces || !PARTICIPANT_PRIVACY.showPreJoin) return [];
    if (!viewerEntitlements || viewerEntitlements.canViewFullBuddyRoster) {
      return participants;
    }
    const buddySet = new Set(viewerEntitlements?.buddyUserIdsOnActivity ?? []);
    return participants.filter((row) => buddySet.has(row.id));
  }, [participants, viewerEntitlements, canAccessCrewSurfaces]);
  const participantReviewPrompts = useMemo(
    () =>
      buildParticipantPostCheckInReviewPrompts({
        activity,
        viewerUserId: user?.id ?? null,
        activityReviews,
        checkedIn: canWriteActivityReview,
      }),
    [activity, user?.id, activityReviews, canWriteActivityReview]
  );
  const showParticipantReviewPrompts =
    !previewMode && participantPostCheckInReviewsPending(participantReviewPrompts);

  const hostReviewHints = useHostParticipantReviewHints(
    hostCrewChatPolicy?.tenantId ?? null,
    activity.id,
    Boolean(hostCrewChatPolicy && !previewMode)
  );
  const showHostCheckInPrompt = Boolean(
    hostCrewChatPolicy && !previewMode && !hostReviewHints.loading
  );

  const publishingProfileKind = activity.publishingProfileKind ?? 'community';
  const hostProfilePath = previewMode
    ? null
    : resolveActivityPublisherProfilePath({
        publishingProfileKind,
        tenantSlug: activity.tenantSlug,
        hostUserId: activityHostUserId(activity),
      });
  const canOpenHostProfile =
    !viewerEntitlements || viewerEntitlements.canViewHostProfileBeforeJoin;
  const hostPath = hostProfilePath && canOpenHostProfile ? hostProfilePath : null;
  const hostProfileHint =
    publishingProfileKind && publishingProfileKind !== 'community'
      ? `${exploreActivityPublisherTypeLabel(publishingProfileKind)} · view profile`
      : 'Runs this activity · view profile';
  const isFull = (activity.slotsAvailable ?? 0) <= 0;
  const accessLat =
    activity.startLat ?? activity.meetingLat ?? activity.parkingLat ?? activity.location?.latitude ?? null;
  const accessLng =
    activity.startLng ?? activity.meetingLng ?? activity.parkingLng ?? activity.location?.longitude ?? null;
  const hasAccessCoordinates = accessLat != null && accessLng != null;
  const registryPlacePath = previewMode ? null : activityRegistryPlacePath(activity);
  const registryPlaceName = activity.location?.name?.trim() || activity.locationName?.trim() || null;
  const openInGoogleMapsUrl =
    activity.location?.parkingLink ?? (hasAccessCoordinates ? buildGoogleMapsSearchUrl(accessLat, accessLng) : null);

  const dateRangeLabel = activity.endDate
    ? `${formatDate(activity.date)} – ${formatDate(activity.endDate)}`
    : formatDate(activity.date);

  const sharePayload = buildActivitySharePayload(activityShareInputFromActivity(activity));

  const activityTitle = activity.title || activity.locationName;
  const titleChromeLine = activityTitleChromeLine(activity.activityType, activityTitle);
  const showTransportTab = true;
  const transportReachLines = useMemo(
    () => extractActivityTransportReachLines(activity.requirements),
    [activity.requirements]
  );
  const joinUiState = resolveJoinRequestUiState({ myRequest, participation });
  const showTransportEncouragementMobile = showTransportEncouragementOnTab(mobileTab);
  const showTransportHostProUpsell =
    showTransportEncouragementMobile &&
    Boolean(hostCrewChatPolicy) &&
    viewerEntitlements &&
    !viewerEntitlements.canAddLinkedRide;
  const showTransportParticipantProUpsell =
    showTransportEncouragementMobile &&
    participantFooterShortcuts &&
    viewerEntitlements &&
    !viewerEntitlements.canOfferTransport;
  const mobilePlanPanel = activityDetailTabPanelClass('plan', mobileTab);
  const mobilePlacePanel = activityDetailTabPanelClass('place', mobileTab);
  const mobileBuddiesPanel = activityDetailTabPanelClass('buddies', mobileTab);
  const mobileTransportPanel = activityDetailTabPanelClass('transport', mobileTab);
  const mobileSidebarPanel =
    mobileTab === 'plan' || mobileTab === 'buddies' ? 'block' : 'hidden md:block';

  const showInviteShare = !previewMode && activity.status === 'published';

  const joinLabel = activityJoinCtaLabel({
    participationMode: activity.participationMode,
    requirements: activity.requirements,
    isFull,
  });

  const handleJoinClick = () => {
    onJoin?.();
  };
  const isHostUser = Boolean(hostCrewChatPolicy);
  const heroStatusChips = resolveActivityDetailHeroStatusChips({
    joinUiState,
    slotsAvailable: activity.slotsAvailable ?? 0,
    slotsTotal: activity.slotsTotal ?? 0,
    previewMode,
    isHostUser,
    pendingJoinInviteCount: wireStrips?.pendingJoinInviteCount,
    confirmedParticipantCount: activity.participants?.length ?? 0,
  });
  const heroFactChips =
    showMobileTabs && !previewMode
      ? [
          {
            label: `${activityKindChromeEmoji(activity.activityType)} ${activityKindChromeLabel(activity.activityType)}`,
            tone: 'neutral' as const,
          },
          ...heroStatusChips,
        ]
      : heroStatusChips;

  const tabFooterKind = wireFooterByTab?.[mobileTab] ?? 'plan_join';
  const consumerJoinEnabled = !isEmbedded && !previewMode;
  const hostUserId = activityHostUserId(activity);
  const showFooterMessageHost =
    consumerJoinEnabled &&
    !canAccessCrewSurfaces &&
    !hostCrewChatPolicy &&
    viewerEntitlements?.canMessageHostBeforeJoin &&
    Boolean(hostUserId);
  const showHostProfileProUpsell = activityDetailShowHostProfileProUpsell(
    viewerEntitlements,
    Boolean(hostProfilePath),
    previewMode,
    Boolean(hostCrewChatPolicy)
  );
  const showRosterProUpsell = activityDetailShowRosterProUpsell(
    viewerEntitlements,
    canAccessCrewSurfaces,
    participants.length,
    rosterParticipants.length
  );
  const proSocialMembershipPath = proMembershipPath({
    intent: 'discover-members',
    redirect: activityDetailPath(activity.id),
  });

  const previewFooter = (
    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center">
      <p className="text-sm font-semibold text-amber-900">Draft preview</p>
      <p className="text-xs text-amber-800 mt-1">This is how your activity will look once published.</p>
    </div>
  );

  const wrapMobileFooter = (content: ReactNode, showParticipantShortcuts = false) =>
    previewMode ? (
      content
    ) : (
      <ActivityDetailMobileFooter
        activityId={activity.id}
        showParticipantShortcuts={showParticipantShortcuts}
        showMessageHost={showFooterMessageHost}
        hostUserId={hostUserId}
      >
        {content}
      </ActivityDetailMobileFooter>
    );

  const pendingOrConfirmedFooter =
    (joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed') && onWithdraw
      ? wrapMobileFooter(
          <JoinRequestActions
            uiState={joinUiState}
            joinLabel={joinLabel}
            isFull={isFull}
            onWithdraw={onWithdraw}
            joinButtonClassName="ios-btn shadow-lg"
          />,
          participantFooterShortcuts
        )
      : null;

  const joinButton = consumerJoinEnabled
    ? hostDetailCtas ??
      (previewMode
        ? previewFooter
        : pendingOrConfirmedFooter ??
          wrapMobileFooter(
            <JoinRequestActions
              uiState={joinUiState}
              joinLabel={joinLabel}
              isFull={isFull}
              onJoin={handleJoinClick}
              onWithdraw={onWithdraw}
              joinDisabled={joinActionDisabled}
              joinButtonClassName="ios-btn shadow-lg"
            />,
            participantFooterShortcuts
          ))
    : undefined;

  const stickyFooter = (
    <ActivityDetailStickyFooter
      tabScopedFooterEnabled={showMobileTabs && !previewMode && consumerJoinEnabled}
      tabFooterKind={tabFooterKind}
      joinButton={joinButton}
      wrapMobileFooter={wrapMobileFooter}
      hasAccessCoordinates={hasAccessCoordinates}
      accessLat={accessLat}
      accessLng={accessLng}
      canSendJoinInvites={canSendJoinInvites}
      inviteActivity={{
        id: activity.id,
        title: activity.title || activity.locationName,
        activityType: activity.activityType,
        date: activity.date,
        locationName: activity.locationName,
      }}
      linkedRideshareId={linkedRideshareId}
      showInviteShare={showInviteShare}
      sharePayload={sharePayload}
      showParticipantFooterShortcuts={participantFooterShortcuts}
      hostSecondaryActions={hostDetailCtas}
      onHostShareOuting={onHostShareOuting}
    />
  );

  const sidebarJoin = consumerJoinEnabled
    ? sidebarJoinOverride ??
      (previewMode ? (
      <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        Preview only — join is disabled until you publish.
      </p>
    ) : participation ? (
      <>
        {confirmedSidebarExtras}
        <ActivityParticipationStatus participation={participation} />
        {(joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed') && onWithdraw && (
          <div className="hidden md:block">
            <JoinRequestActions
              uiState={joinUiState}
              joinLabel={joinLabel}
              isFull={isFull}
              onWithdraw={onWithdraw}
            />
          </div>
        )}
      </>
    ) : joinUiState.kind !== 'open' && onWithdraw ? (
      <div className="hidden md:block">
        <JoinRequestActions
          uiState={joinUiState}
          joinLabel={joinLabel}
          isFull={isFull}
          onWithdraw={onWithdraw}
        />
      </div>
    ) : (
      <button
        type="button"
        onClick={handleJoinClick}
        disabled={joinActionDisabled}
        className={`hidden md:block w-full mt-4 px-4 py-3 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors ${
          isFull ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {joinLabel}
      </button>
    ))
    : null;

  const detailBody = (
    <>
      {showMobileTabs && onMobileTabChange ? (
        <ActivityDetailTabBar
          active={mobileTab}
          onChange={onMobileTabChange}
          showTransportTab={showTransportTab}
        />
      ) : null}
      {showMobileTabs && !isEmbedded ? (
        <ActivityDetailMobileHero
          date={activity.date}
          title={activityTitle}
          statusChips={heroFactChips}
          venueLine={
            registryPlacePath && registryPlaceName ? (
              <Link to={registryPlacePath} className="font-medium text-emerald-800">
                {registryPlaceName}
              </Link>
            ) : (
              activity.locationName
            )
          }
          trailing={mobileTab === 'plan' ? hostMobilePlanAccessory : undefined}
        />
      ) : null}
      <div
        className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 ${
          isEmbedded ? 'px-0 py-2' : 'px-4 py-6'
        }`}
      >
        <div className="lg:col-span-2 space-y-4">
          {showInviteShare && canSendJoinInvites ? (
            <ActivityInviteLauncher
              activity={{
                id: activity.id,
                title: activity.title || activity.locationName,
                activityType: activity.activityType,
                date: activity.date,
                locationName: activity.locationName,
              }}
              canSendBuddyInvites
            />
          ) : null}

          {showParticipantReviewPrompts ? (
            <ActivityPostCheckInReviewPrompts
              items={participantReviewPrompts}
              panelClassName={mobilePlanPanel}
              onMobileTabChange={onMobileTabChange}
            />
          ) : null}

          <ActivityDetailPlanAboutCard
            panelClassName={mobilePlanPanel}
            activity={activity}
            showMobileTabs={showMobileTabs}
            showPlanTransportTeaser={showPlanTransportTeaser}
            onMobileTabChange={onMobileTabChange}
          />

          <ActivityDetailPlaceTabPanels
            panelClassName={mobilePlacePanel}
            activity={activity}
            previewMode={previewMode}
            showMobileTabs={showMobileTabs}
            showPlaceCrewBody={showPlaceCrewBody}
            showPlaceLockedOnMobile={showPlaceLockedOnMobile}
            registryPlacePath={registryPlacePath}
            registryPlaceName={registryPlaceName}
            hasAccessCoordinates={hasAccessCoordinates}
            accessLat={accessLat}
            accessLng={accessLng}
            openInGoogleMapsUrl={openInGoogleMapsUrl}
            onMobileTabChange={onMobileTabChange}
          />

          <ActivityDetailTransportTabPanels
            panelClassName={mobileTransportPanel}
            activity={activity}
            transportReachLines={transportReachLines}
            showTransportEncouragementMobile={showTransportEncouragementMobile}
            showTransportHostProUpsell={showTransportHostProUpsell}
            showTransportParticipantProUpsell={showTransportParticipantProUpsell}
          />

          <ActivityDetailPlanExtras
            panelClassName={mobilePlanPanel}
            activity={activity}
            previewMode={previewMode}
            activityReviews={activityReviews}
            canWriteActivityReview={canWriteActivityReview}
            onActivityReviewSubmitted={onActivityReviewSubmitted}
          />
        </div>

        <div className={`space-y-4 ${mobileSidebarPanel}`}>
          <ActivityDetailBuddiesAside
            panelClassName={mobileBuddiesPanel}
            previewMode={previewMode}
            showMobileTabs={showMobileTabs}
            showCrewLockedHint={buddiesCrewLockedHint}
            activityId={activity.id}
            activityTitle={activity.title || activity.locationName}
            hostBuddiesHub={
              showHostManageHub ? hostBuddiesHub : undefined
            }
            hostCrewChatPolicy={hostCrewChatPolicy}
          />
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 lg:sticky lg:top-20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-bold text-gray-900">{activityPriceLabel(activity)}</p>
                <p className="text-sm text-gray-500">Indicative — pay host directly</p>
              </div>
              {!previewMode && (
                <div className="hidden md:block">
                  <ShareButton
                    title={sharePayload.title}
                    text={sharePayload.text}
                    path={sharePayload.path}
                  />
                </div>
              )}
            </div>

            {sidebarJoin}

            {message && <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{message}</p>}
            {error && <p className="mt-3 text-sm text-amber-800 bg-amber-50 px-3 py-2 rounded-lg">{error}</p>}

            <div
              className={`mt-5 pt-5 border-t border-gray-100 ${showMobileTabs ? mobileBuddiesPanel : ''}`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Host</p>
              <div className="flex items-center gap-2">
                {hostPath ? (
                  <Link to={hostPath} className="flex items-center gap-3 group flex-1 min-w-0">
                    <SecureAvatar
                      src={activityHostAvatar(activity)}
                      name={activityHostName(activity)}
                      className="w-11 h-11 text-sm ring-2 ring-emerald-50 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-emerald-700 truncate">
                        {activityHostName(activity)}
                      </p>
                      {showTenantBrand(activity) && activity.tenantName && (
                        <p className="text-xs text-gray-500 truncate">{activity.tenantName}</p>
                      )}
                      <p className="text-xs text-gray-500">{hostProfileHint}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SecureAvatar
                      src={activityHostAvatar(activity)}
                      name={activityHostName(activity)}
                      className="w-11 h-11 text-sm ring-2 ring-emerald-50 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{activityHostName(activity)}</p>
                      {showTenantBrand(activity) && activity.tenantName && (
                        <p className="text-xs text-gray-500 truncate">{activity.tenantName}</p>
                      )}
                      {!hostPath && hostProfileHint ? (
                        <p className="text-xs text-gray-500">{hostProfileHint}</p>
                      ) : null}
                    </div>
                  </div>
                )}
                {!previewMode && canOpenHostProfile && (
                  <HostMessageButton hostUserId={hostUserId} activityId={activity.id} size="md" />
                )}
              </div>
              {showHostProfileProUpsell ? (
                <p className="mt-3 text-xs leading-relaxed text-amber-900/90">
                  {ACTIVITY_DETAIL_PRO_HOST_PROFILE_HINT}{' '}
                  <Link to={proSocialMembershipPath} className="font-semibold text-emerald-700 hover:underline">
                    {ACTIVITY_DETAIL_PRO_SOCIAL_CTA}
                  </Link>
                </p>
              ) : null}
              {activity.hostBio && <p className="mt-3 text-sm text-gray-600 leading-relaxed">{activity.hostBio}</p>}
            </div>

            {showHostCheckInPrompt ? (
              <ActivityHostCheckInReviewPrompt
                activityId={activity.id}
                rateableCount={hostReviewHints.rateableCount}
                activityEnded={hostReviewHints.activityEnded}
                panelClassName={showMobileTabs ? `${mobileBuddiesPanel} mt-5` : 'mt-5'}
              />
            ) : null}

            {showParticipantReviewPrompts ? (
              <ActivityPostCheckInReviewPrompts
                items={participantReviewPrompts}
                panelClassName={showMobileTabs ? `${mobileBuddiesPanel} mt-5` : 'mt-5'}
                onMobileTabChange={onMobileTabChange}
              />
            ) : null}

            {hostCrewChatPolicy && !previewMode ? (
              <div className={`${showMobileTabs ? mobileBuddiesPanel : ''} mb-4`}>
                <ActivityCrewChatPostPolicyCard
                  activityId={activity.id}
                  tenantId={hostCrewChatPolicy.tenantId}
                  value={activity.groupChatPostPolicy}
                  onSaved={hostCrewChatPolicy.onSaved}
                  onError={hostCrewChatPolicy.onError}
                />
              </div>
            ) : null}

            {PARTICIPANT_PRIVACY.showPreJoin && !previewMode && canAccessCrewSurfaces && (
              <div
                className={`mt-5 pt-5 border-t border-gray-100 ${showMobileTabs ? mobileBuddiesPanel : ''}`}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Who&apos;s going ({participants.length})
                </p>
                <ParticipantPreview
                  participants={rosterParticipants}
                  size="md"
                  showNames
                  linkToProfile
                  emptyLabel="No confirmed participants yet — be the first to join!"
                />
                {rosterParticipants.length > 0 && (
                  <p className="mt-2 text-[11px] text-gray-400">Tap a name to view profile</p>
                )}
                {showRosterProUpsell ? (
                  <p className="mt-3 text-xs leading-relaxed text-amber-900/90">
                    {ACTIVITY_DETAIL_PRO_ROSTER_HINT}{' '}
                    <Link to={proSocialMembershipPath} className="font-semibold text-emerald-700 hover:underline">
                      {ACTIVITY_DETAIL_PRO_SOCIAL_CTA}
                    </Link>
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (isEmbedded) {
    return detailBody;
  }

  return (
    <MobileDetailShell
      backTo={backTo}
      backLabel={backLabel}
      footer={stickyFooter}
      headerAction={
        showInviteShare ? (
          <ShareButton
            title={sharePayload.title}
            text={sharePayload.text}
            path={sharePayload.path}
            iconOnly
            light
          />
        ) : undefined
      }
      banner={{
        src: heroImage,
        alt: activityTitle,
        title: previewMode ? activityTitle : titleChromeLine,
        eyebrow: activityDetailEyebrowForActivity(activity.activityType, activity.activityMode),
        showMobileChrome: !previewMode,
        showJourney: !previewMode,
        journeyFallbackTo: backTo,
        journeyLabel: backLabel,
      }}
    >
      {detailBody}
    </MobileDetailShell>
  );
};
