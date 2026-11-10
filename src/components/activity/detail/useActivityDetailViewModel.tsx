import { useMemo } from 'react';
import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityGroupChatPostPolicy,
  ActivityPresentationConsumerLayoutDTO,
  ActivityPresentationTabsDTO,
  ActivityViewerAccessDTO,
  MyActivityRequestDTO,
  ActivityParticipationDTO,
  ReviewDTO,
} from '@uaetrail/shared-types';
import {
  exploreActivityPublisherTypeLabel,
  resolveActivityPublisherProfilePath,
} from '@uaetrail/shared-types';
import { PARTICIPANT_PRIVACY } from '../../../config/platform';
import type { ActivityViewerEntitlementsDTO } from '@uaetrail/shared-types';
import { buildGoogleMapsSearchUrl } from '../../../utils/mapLinks';
import { activityRegistryPlacePath } from '../../../utils/activityRegistryPlacePath';
import type { ActivityDetailTabId } from '../../../activity/activityDetailTab';
import {
  activityKindChromeEmoji,
  activityKindChromeLabel,
  activityTitleChromeLine,
} from '../../../activity/activityKindChrome';
import {
  activityDetailShowHostProfileProUpsell,
  activityDetailShowRosterProUpsell,
} from '../../../activity/activityDetailProSocial';
import { activityDetailPath, proMembershipPath } from '../../../config/routingCatalog';
import { useAuth } from '../../../context/AuthContext';
import { viewerCanManageActivityOuting } from '../../../utils/viewerHostsActivity';
import { activityScheduleHasEnded } from '@uaetrail/shared-types';
import {
  buildParticipantPostCheckInReviewPrompts,
  participantPostCheckInReviewsPending,
} from '../../../activity/activityPostCheckInReviewPrompts';
import { useHostParticipantReviewHints } from '../../../hooks/useHostParticipantReviewHints';
import { extractActivityTransportReachLines } from '../../../activity/activityDetailReachBy';
import { resolveActivityDetailTabUi } from '../../../activity/resolveActivityDetailTabUi';
import {
  buildActivityDetailPageModel,
  resolveActivityDetailShowTransportTab,
  resolveVisibleActivityDetailTabs,
} from '../../../activity/detail/buildActivityDetailPageModel';
import type { ActivityDetailKind } from '../../../activity/detail/activityDetailKind';
import type { ActivityDetailTabFooterKind } from '../../../activity/activityDetailTabFooters';
import {
  resolveActivityDetailHeroStatusChips,
  resolveActivityDetailMarketingStatusChips,
} from '../../../activity/activityDetailHeroStatus';
import { buildActivityDetailPageShellCard } from '../../../activity/detail/activityDetailPageShellCard';
import { resolveActivityDetailHeroImage } from '../../../activity/resolveActivityDetailHeroImage';
import { resolveActivityDetailWirePresentation } from '../../../activity/resolveActivityDetailWirePresentation';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { activityDetailTabPanelClass } from './activityDetailTabPanelClass';
import { useActivityDetailJoinSurfaces } from './useActivityDetailJoinSurfaces';
import {
  ActivityDetailEngagementActions,
  type ActivityDetailEngagementModel,
} from './ActivityDetailEngagementActions';
import type { ActivityMapPeekActionHandlers } from '../../../activity/executeActivityMapPeekAction';
import { activityHostUserId } from '../../../utils/hostLabels';
import { resolveJoinRequestUiState } from '../../../utils/joinRequestUi';
import type { ReactNode } from 'react';
import type { ActivityRequestView } from '../../../api/types';

export type ActivityDetailViewModelInput = {
  activity: ActivityDetailDTO;
  previewMode?: boolean;
  requiresSignIn?: boolean;
  showJoinRequiredHint?: boolean;
  participation?: ActivityParticipationDTO | null;
  myRequest?: MyActivityRequestDTO | null;
  message?: string | null;
  error?: string | null;
  onJoin?: () => void;
  onWithdraw?: () => void;
  hostDetailCtas?: ReactNode;
  sidebarJoinOverride?: ReactNode;
  confirmedSidebarExtras?: ReactNode;
  joinDisabled?: boolean;
  canSendJoinInvites?: boolean;
  activityReviews?: ReviewDTO[];
  onActivityReviewSubmitted?: (review: ReviewDTO) => void;
  canWriteActivityReview?: boolean;
  mobileTab?: ActivityDetailTabId;
  onMobileTabChange?: (tab: ActivityDetailTabId) => void;
  canAccessCrewSurfaces?: boolean;
  showParticipantFooterShortcuts?: boolean;
  showCrewLockedHint?: boolean;
  viewerEntitlements?: ActivityViewerEntitlementsDTO | null;
  layout?: 'page' | 'embedded';
  hostCrewChatPolicy?: {
    tenantId: string;
    onSaved?: (policy: ActivityGroupChatPostPolicy) => void;
    onError?: (message: string) => void;
  };
  hostBuddiesHub?: {
    joinRequests: ActivityRequestView[];
    requestsLoading: boolean;
    onRequestsChanged: () => void | Promise<void>;
  };
  wireFooterByTab?: Record<ActivityDetailTabId, ActivityDetailTabFooterKind> | null;
  wireTabs?: ActivityPresentationTabsDTO | null;
  wireStrips?: ActivityEngagementStripsDTO | null;
  consumerLayout?: ActivityPresentationConsumerLayoutDTO | null;
  onHostShareOuting?: () => void;
  /** Public `/activity/:id` scroll layout (`ActivityDetailPageShell`). */
  consumerDetailLayout?: boolean;
  viewerAccess?: ActivityViewerAccessDTO | null;
  onOfferLinkedRideshare?: () => void;
  /** Consumer kind template (`ActivityDetailByKind`) — drives tab visibility + plan facts. */
  detailKind?: ActivityDetailKind;
  mapPeekActionHandlers?: ActivityMapPeekActionHandlers;
  linkRideshareTenantId?: string | null;
  onParticipantInviteFriends?: () => void;
};

/** Tab layout, join surfaces, hero, and sidebar inputs for activity detail (R6). */
export const useActivityDetailViewModel = ({
  activity,
  previewMode = false,
  requiresSignIn = false,
  showJoinRequiredHint = false,
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
  hostCrewChatPolicy,
  hostBuddiesHub,
  wireFooterByTab = null,
  wireTabs = null,
  wireStrips = null,
  consumerLayout = null,
  onHostShareOuting,
  consumerDetailLayout = false,
  viewerAccess = null,
  onOfferLinkedRideshare,
  detailKind,
  mapPeekActionHandlers,
  linkRideshareTenantId = null,
  onParticipantInviteFriends,
}: ActivityDetailViewModelInput) => {
  const { user } = useAuth();
  const isActivityHostViewer = viewerCanManageActivityOuting(
    activity,
    user?.id ?? null,
    user?.role ?? null
  );
  const isEmbedded = layout === 'embedded';

  const pageModel = useMemo(
    () => buildActivityDetailPageModel(activity, { detailKind }),
    [activity, detailKind]
  );

  const linkedRideshareId =
    activity.linkedRideshare?.id ?? activity.linkedRideshareActivityId ?? null;
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
    showMobileTabs: wireShowMobileTabs,
    showPlaceCrewBody: wireShowPlaceCrewBody,
    showPlaceLockedOnMobile: wireShowPlaceLockedOnMobile,
    showCrewLockedHint: wireCrewLockedHint,
    showParticipantFooterShortcuts: participantFooterShortcuts,
    showHostManageHub,
    showTransportEncouragementOnTab,
  } = tabUi;

  const showMobileTabs = wireShowMobileTabs && !consumerDetailLayout;
  const guestViewer = requiresSignIn && !previewMode && !isEmbedded;
  const showPlaceCrewBody = guestViewer ? false : wireShowPlaceCrewBody;
  const showPlaceLockedOnMobile = guestViewer ? true : wireShowPlaceLockedOnMobile;
  const buddiesCrewLockedHint = wireCrewLockedHint || guestViewer;

  const showTransportTab = resolveActivityDetailShowTransportTab(activity, pageModel.kind);
  const visibleMobileTabs = useMemo(
    () =>
      resolveVisibleActivityDetailTabs(pageModel.tabVisibility, {
        showTransportTab,
      }),
    [pageModel.tabVisibility, showTransportTab]
  );
  const showPlaceTab = pageModel.tabVisibility.place;

  const heroImageResolved = resolveActivityDetailHeroImage(activity);
  const heroImage = heroImageResolved.src;
  const heroImageFallback = heroImageResolved.fallback;

  const participants = useMemo(() => activity.participants ?? [], [activity.participants]);
  const rosterParticipants = useMemo(() => {
    if (!PARTICIPANT_PRIVACY.showPreJoin) return [];
    if (canAccessCrewSurfaces) {
      return participants;
    }
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
        checkedIn: Boolean(participation?.checkedInAt),
      }),
    [activity, user?.id, activityReviews, participation?.checkedInAt]
  );
  const outingScheduleEnded = activityScheduleHasEnded(activity);
  const showParticipantReviewPrompts =
    !previewMode &&
    outingScheduleEnded &&
    participantPostCheckInReviewsPending(participantReviewPrompts);

  const hostReviewHints = useHostParticipantReviewHints(
    hostCrewChatPolicy?.tenantId ?? null,
    activity.id,
    Boolean(hostCrewChatPolicy && !previewMode)
  );
  const showHostCheckInPrompt = Boolean(
    isActivityHostViewer && hostCrewChatPolicy && !previewMode && !hostReviewHints.loading
  );

  const publishingProfileKind = activity.publishingProfileKind ?? 'community';
  const hostProfilePath = previewMode
    ? null
    : resolveActivityPublisherProfilePath({
        publishingProfileKind,
        tenantSlug: activity.tenantSlug,
        hostUserId: activityHostUserId(activity),
      });
  const canOpenHostProfile = Boolean(
    !viewerEntitlements || viewerEntitlements.canViewHostProfileBeforeJoin
  );
  const hostPath = hostProfilePath && canOpenHostProfile ? hostProfilePath : null;
  const hostProfileHint =
    publishingProfileKind && publishingProfileKind !== 'community'
      ? `${exploreActivityPublisherTypeLabel(publishingProfileKind)} · view profile`
      : 'Runs this activity · view profile';

  const accessLat =
    activity.startLat ?? activity.meetingLat ?? activity.parkingLat ?? activity.location?.latitude ?? null;
  const accessLng =
    activity.startLng ?? activity.meetingLng ?? activity.parkingLng ?? activity.location?.longitude ?? null;
  const hasAccessCoordinates = accessLat != null && accessLng != null;
  const registryPlacePath = previewMode ? null : activityRegistryPlacePath(activity);
  const registryPlaceName = activity.location?.name?.trim() || activity.locationName?.trim() || null;
  const openInGoogleMapsUrl =
    activity.location?.parkingLink ?? (hasAccessCoordinates ? buildGoogleMapsSearchUrl(accessLat, accessLng) : null);

  const activityTitle = activity.title || activity.locationName;
  const titleChromeLine = activityTitleChromeLine(activity.activityType, activityTitle);
  const transportReachLines = useMemo(
    () => extractActivityTransportReachLines(activity.requirements),
    [activity.requirements]
  );
  const showTransportEncouragementMobile = showTransportEncouragementOnTab(mobileTab);
  const showTransportHostProUpsell = Boolean(
    showTransportEncouragementMobile &&
      hostCrewChatPolicy &&
      viewerEntitlements &&
      !viewerEntitlements.canAddLinkedRide
  );
  const showTransportParticipantProUpsell = Boolean(
    showTransportEncouragementMobile &&
      participantFooterShortcuts &&
      viewerEntitlements &&
      !viewerEntitlements.canOfferTransport
  );

  const mobilePlanPanel = activityDetailTabPanelClass('plan', mobileTab);
  const mobilePlacePanel = activityDetailTabPanelClass('place', mobileTab);
  const mobileBuddiesPanel = activityDetailTabPanelClass('buddies', mobileTab);
  const mobileTransportPanel = activityDetailTabPanelClass('transport', mobileTab);
  const mobileSidebarPanel = consumerDetailLayout
    ? 'hidden md:block'
    : mobileTab === 'plan' || mobileTab === 'buddies'
      ? 'block'
      : 'hidden md:block';

  const showInviteShare = !previewMode && activity.status === 'published';
  const tabFooterKind = wireFooterByTab?.[mobileTab] ?? 'plan_join';
  const consumerJoinEnabled = !isEmbedded && !previewMode;
  const hostUserId = activityHostUserId(activity) ?? null;
  const showFooterMessageHost = Boolean(
    consumerJoinEnabled &&
    !canAccessCrewSurfaces &&
    !hostCrewChatPolicy &&
    viewerEntitlements?.canMessageHostBeforeJoin &&
    Boolean(hostUserId)
  );

  const joinUiStateForSurfaces = useMemo(
    () => resolveJoinRequestUiState({ myRequest, participation }),
    [myRequest, participation]
  );

  const resolvedConsumerLayout = useMemo(() => {
    if (consumerLayout || !consumerDetailLayout || previewMode || isEmbedded) {
      return consumerLayout;
    }
    if (!viewerAccess || activity.status !== 'published') return null;
    const wire = resolveActivityDetailWirePresentation({
      activity,
      viewerAccess,
      isHostUser: isActivityHostViewer,
      joinUiState: joinUiStateForSurfaces,
      myParticipation: participation ?? null,
      myRequest: myRequest
        ? { status: myRequest.status, canWithdraw: myRequest.canWithdraw }
        : null,
    });
    return wire?.consumerLayout ?? null;
  }, [
    consumerLayout,
    consumerDetailLayout,
    previewMode,
    isEmbedded,
    viewerAccess,
    activity,
    isActivityHostViewer,
    joinUiStateForSurfaces,
    participation,
    myRequest,
  ]);

  const engagementModel = {
    activity,
    viewerAccess: viewerAccess ?? null,
    wireStrips: wireStrips ?? null,
    joinUiState: joinUiStateForSurfaces,
    myRequest: myRequest ?? null,
  } satisfies ActivityDetailEngagementModel;

  const engagementActionsBase = consumerDetailLayout && !guestViewer && mapPeekActionHandlers
    ? {
        model: engagementModel,
        handlers: mapPeekActionHandlers,
        linkRideshareTenantId,
        onParticipantInviteFriends,
        onWithdraw,
        isHostUser: isActivityHostViewer,
      }
    : null;

  const consumerWireEngagementCtaMobile = engagementActionsBase ? (
    <ActivityDetailEngagementActions {...engagementActionsBase} layout="mobile-footer" />
  ) : undefined;

  const consumerWireEngagementCtaAside = engagementActionsBase ? (
    <ActivityDetailEngagementActions
      {...engagementActionsBase}
      layout="desktop-aside"
      showDesktopFooterIcons
    />
  ) : undefined;

  const { joinUiState, sharePayload, stickyFooter, sidebarJoin, planRequestManagePanel } =
    useActivityDetailJoinSurfaces({
    activity,
    previewMode,
    isEmbedded,
    participation,
    myRequest,
    onJoin,
    onWithdraw,
    joinDisabled: joinDisabled ?? false,
    hostDetailCtas,
    sidebarJoinOverride,
    confirmedSidebarExtras,
    canSendJoinInvites,
    showMobileTabs,
    tabFooterKind,
    participantFooterShortcuts,
    linkedRideshareId,
    showInviteShare,
    onHostShareOuting,
    hostUserId,
    showFooterMessageHost,
    hasAccessCoordinates,
    accessLat,
    accessLng,
    requiresSignIn: guestViewer,
    consumerWireEngagement: consumerDetailLayout,
    isHostViewer: isActivityHostViewer,
    consumerWireEngagementCta: consumerWireEngagementCtaMobile,
  });

  const isHostUser = isActivityHostViewer;
  const confirmedParticipantCount =
    activity.participants?.length ?? activity.participantPreviews?.length ?? 0;
  const heroStatusChips = resolveActivityDetailHeroStatusChips({
    joinUiState,
    slotsAvailable: activity.slotsAvailable ?? 0,
    slotsTotal: activity.slotsTotal ?? 0,
    previewMode,
    isHostUser,
    pendingJoinInviteCount: wireStrips?.pendingJoinInviteCount,
    confirmedParticipantCount,
  });
  const peekParityCard = useMemo((): DiscoveryCardModel | null => {
    if (!consumerDetailLayout || previewMode) return null;
    return buildActivityDetailPageShellCard({
      activity,
      viewerAccess: viewerAccess ?? null,
      wireStrips: wireStrips ?? null,
    });
  }, [activity, previewMode, consumerDetailLayout, viewerAccess, wireStrips]);

  const consumerStatusChips = resolveActivityDetailMarketingStatusChips({
    joinUiState,
    slotsAvailable: activity.slotsAvailable ?? 0,
    slotsTotal: activity.slotsTotal ?? 0,
    previewMode,
    isHostUser,
    pendingJoinInviteCount: wireStrips?.pendingJoinInviteCount,
    confirmedParticipantCount,
  });

  const heroFactChips = consumerDetailLayout
    ? consumerStatusChips
    : showMobileTabs
      ? [
          {
            label: `${activityKindChromeEmoji(activity.activityType)} ${activityKindChromeLabel(activity.activityType)}`,
            tone: 'neutral' as const,
          },
          ...heroStatusChips,
        ]
      : heroStatusChips;

  const canViewSensitivePlanContent = !requiresSignIn && !previewMode;

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

  return {
    isEmbedded,
    activity,
    previewMode,
    requiresSignIn,
    showJoinRequiredHint,
    canViewSensitivePlanContent,
    mobileTab,
    onMobileTabChange,
    onActivityReviewSubmitted,
    activityReviews,
    canWriteActivityReview,
    canSendJoinInvites,
    showMobileTabs,
    showPlaceCrewBody,
    showPlaceLockedOnMobile,
    buddiesCrewLockedHint,
    showHostManageHub,
    hostBuddiesHub,
    hostCrewChatPolicy,
    heroImage,
    heroImageFallback,
    activityTitle,
    titleChromeLine,
    heroFactChips,
    peekParityCard,
    consumerStatusChips,
    registryPlacePath,
    registryPlaceName,
    transportReachLines,
    showTransportEncouragementMobile,
    showTransportHostProUpsell,
    showTransportParticipantProUpsell,
    mobilePlanPanel,
    mobilePlacePanel,
    mobileBuddiesPanel,
    mobileTransportPanel,
    mobileSidebarPanel,
    showInviteShare,
    showParticipantReviewPrompts,
    participantReviewPrompts,
    hasAccessCoordinates,
    accessLat,
    accessLng,
    openInGoogleMapsUrl,
    sharePayload,
    stickyFooter,
    sidebarJoin,
    planRequestManagePanel,
    message,
    error,
    hostPath,
    hostProfileHint,
    canOpenHostProfile,
    hostUserId,
    showHostProfileProUpsell,
    proSocialMembershipPath,
    showHostCheckInPrompt,
    hostReviewHints,
    canAccessCrewSurfaces,
    participants,
    rosterParticipants,
    showRosterProUpsell,
    consumerDetailLayout,
    consumerLayout: resolvedConsumerLayout,
    viewerAccess,
    wireStrips,
    joinUiState,
    consumerEngagementActions: consumerWireEngagementCtaAside,
    onOfferLinkedRideshare,
    linkRideshareTenantId,
    detailKind: pageModel.kind,
    visibleMobileTabs,
    showPlaceTab,
    showTransportTab,
  };
};
