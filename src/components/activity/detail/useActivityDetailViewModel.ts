import { useMemo } from 'react';
import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityGroupChatPostPolicy,
  ActivityPresentationTabsDTO,
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
import {
  buildParticipantPostCheckInReviewPrompts,
  participantPostCheckInReviewsPending,
} from '../../../activity/activityPostCheckInReviewPrompts';
import { useHostParticipantReviewHints } from '../../../hooks/useHostParticipantReviewHints';
import { extractActivityTransportReachLines } from '../../../activity/activityDetailReachBy';
import { resolveActivityDetailTabUi } from '../../../activity/resolveActivityDetailTabUi';
import type { ActivityDetailTabFooterKind } from '../../../activity/activityDetailTabFooters';
import { resolveActivityDetailHeroStatusChips } from '../../../activity/activityDetailHeroStatus';
import { activityDetailTabPanelClass } from './activityDetailTabPanelClass';
import { useActivityDetailJoinSurfaces } from './useActivityDetailJoinSurfaces';
import { activityHostUserId } from '../../../utils/hostLabels';
import type { ReactNode } from 'react';
import type { ActivityRequestView } from '../../../api/types';

export type ActivityDetailViewModelInput = {
  activity: ActivityDetailDTO;
  previewMode?: boolean;
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
  onHostShareOuting?: () => void;
};

/** Tab layout, join surfaces, hero, and sidebar inputs for activity detail (R6). */
export const useActivityDetailViewModel = ({
  activity,
  previewMode = false,
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
  onHostShareOuting,
}: ActivityDetailViewModelInput) => {
  const { user } = useAuth();
  const isEmbedded = layout === 'embedded';

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
  const mobileSidebarPanel =
    mobileTab === 'plan' || mobileTab === 'buddies' ? 'block' : 'hidden md:block';

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

  const { joinUiState, sharePayload, stickyFooter, sidebarJoin } = useActivityDetailJoinSurfaces({
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
  });

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
    mobileTab,
    onMobileTabChange,
    onActivityReviewSubmitted,
    activityReviews,
    canWriteActivityReview,
    canSendJoinInvites,
    showMobileTabs,
    showPlanTransportTeaser,
    showPlaceCrewBody,
    showPlaceLockedOnMobile,
    buddiesCrewLockedHint,
    showHostManageHub,
    hostBuddiesHub,
    hostCrewChatPolicy,
    heroImage,
    activityTitle,
    titleChromeLine,
    heroFactChips,
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
  };
};
