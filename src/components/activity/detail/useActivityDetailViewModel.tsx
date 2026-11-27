import { useMemo } from 'react';
import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityGroupChatPostPolicy,
  ActivityPresentationSectionsDTO,
  ActivityViewerAccessDTO,
  MyActivityRequestDTO,
  ActivityParticipationDTO,
  ReviewDTO,
} from '@uaetrail/shared-types';
import { activityIsConsumerDiscoverable } from '@uaetrail/shared-types';
import { PARTICIPANT_PRIVACY } from '../../../config/platform';
import type { ActivityViewerEntitlementsDTO } from '@uaetrail/shared-types';
import type { ActivityDetailTabId } from '../../../activity/activityDetailTab';
import { activityTitleChromeLine } from '../../../activity/activityKindChrome';
import {
  activityDetailShowHostProfileProUpsell,
  activityDetailShowRosterProUpsell,
} from '../../../activity/activityDetailProSocial';
import { activityDetailPath, proMembershipPath } from '../../../config/routingCatalog';
import { useAuth } from '../../../context/AuthContext';
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
import { resolveActivityDetailViewModelHeroFacts } from './activityDetailViewModelHeroFacts';
import { resolveActivityDetailPeekParityCard } from './activityDetailViewModelPeekCard';
import { resolveActivityDetailHeroImage } from '../../../activity/resolveActivityDetailHeroImage';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
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
import {
  resolveActivityDetailHostProfileSurface,
  resolveActivityDetailPlaceAccess,
} from './activityDetailViewModelPlaceAccess';
import { filterActivityDetailRosterParticipants } from './activityDetailViewModelRoster';

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
  hostCrewHub?: {
    joinRequests: ActivityRequestView[];
    requestsLoading: boolean;
    onRequestsChanged: () => void | Promise<void>;
  };
  wireFooterByTab?: Record<ActivityDetailTabId, ActivityDetailTabFooterKind> | null;
  wireStrips?: ActivityEngagementStripsDTO | null;
  /** Wire `presentation.sections` — one section policy for public page and embed. */
  wireSections?: ActivityPresentationSectionsDTO | null;
  onHostShareOuting?: () => void;
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
  hostCrewHub,
  wireFooterByTab = null,
  wireStrips = null,
  wireSections = null,
  onHostShareOuting,
  viewerAccess = null,
  onOfferLinkedRideshare,
  detailKind,
  mapPeekActionHandlers,
  linkRideshareTenantId = null,
  onParticipantInviteFriends,
}: ActivityDetailViewModelInput) => {
  const { user } = useAuth();
  const isEmbedded = layout === 'embedded';
  const publicDetail = !isEmbedded && !previewMode;

  const pageModel = useMemo(
    () => buildActivityDetailPageModel(activity, { detailKind }),
    [activity, detailKind]
  );

  const linkedRideshareId =
    activity.linkedRideshare?.id ?? activity.linkedRideshareActivityId ?? null;
  const tabUi = useMemo(
    () =>
      resolveActivityDetailTabUi({
        publicDetail,
        isHostUser: Boolean(hostCrewChatPolicy),
        showMeetingPoint: wireSections?.showMeetingPoint ?? canAccessCrewSurfaces,
        previewMode,
        isEmbedded,
        onMobileTabChange,
        showCrewLockedHint,
        showParticipantFooterShortcuts,
        rideshareEnabled: Boolean(activity.rideshareEnabled),
        hasLinkedRideshare: Boolean(
          linkedRideshareId || activity.linkedParentActivity || activity.linkedRideshare
        ),
      }),
    [
      publicDetail,
      hostCrewChatPolicy,
      wireSections,
      previewMode,
      isEmbedded,
      onMobileTabChange,
      showCrewLockedHint,
      showParticipantFooterShortcuts,
      activity.rideshareEnabled,
      activity.linkedParentActivity,
      activity.linkedRideshare,
      linkedRideshareId,
      canAccessCrewSurfaces,
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

  const showMobileTabs = wireShowMobileTabs;
  const guestViewer = requiresSignIn && !previewMode && !isEmbedded;
  const showPlaceCrewBody = guestViewer ? false : wireShowPlaceCrewBody;
  const showPlaceLockedOnMobile = guestViewer ? true : wireShowPlaceLockedOnMobile;
  const crewLockedHint = wireCrewLockedHint || guestViewer;

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
  const rosterParticipants = useMemo(
    () =>
      filterActivityDetailRosterParticipants(
        participants,
        Boolean(canAccessCrewSurfaces),
        viewerEntitlements,
        PARTICIPANT_PRIVACY.showPreJoin
      ),
    [participants, viewerEntitlements, canAccessCrewSurfaces]
  );

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
    hostCrewChatPolicy && !previewMode && !hostReviewHints.loading
  );

  const { hostPath, hostProfileHint, canOpenHostProfile, hostProfilePath } =
    resolveActivityDetailHostProfileSurface(
    activity,
    previewMode,
    viewerEntitlements
  );
  const { accessLat, accessLng, hasAccessCoordinates, registryPlacePath, registryPlaceName, openInGoogleMapsUrl } =
    resolveActivityDetailPlaceAccess(activity, previewMode);

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

  const mobilePlanPanel = '';
  const mobilePlacePanel = '';
  const mobileCrewPanel = '';
  const mobileTransportPanel = '';
  const mobileSidebarPanel = publicDetail ? 'hidden md:block' : 'block';

  const showInviteShare = !previewMode && activityIsConsumerDiscoverable(activity.status);
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

  const sections = wireSections;

  const joinUiStateForSurfaces = useMemo(
    () => resolveJoinRequestUiState({ myRequest, participation }),
    [myRequest, participation]
  );

  const consumerWireEngagementCta =
    publicDetail && !guestViewer && mapPeekActionHandlers
      ? (
          <ActivityDetailEngagementActions
            model={
              {
                activity,
                viewerAccess: viewerAccess ?? null,
                wireStrips: wireStrips ?? null,
                joinUiState: joinUiStateForSurfaces,
              } satisfies ActivityDetailEngagementModel
            }
            handlers={mapPeekActionHandlers}
            linkRideshareTenantId={linkRideshareTenantId}
            onParticipantInviteFriends={onParticipantInviteFriends}
            onWithdraw={onWithdraw}
            isHostUser={Boolean(hostCrewChatPolicy)}
          />
        )
      : undefined;

  const { joinUiState, sharePayload, stickyFooter, sidebarJoin, planRequestManagePanel, partyEditPanel } =
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
    consumerWireEngagement: publicDetail,
    isHostViewer: Boolean(hostCrewChatPolicy),
    consumerWireEngagementCta,
    viewerUserId: user?.id,
  });

  const isHostUser = Boolean(hostCrewChatPolicy);
  const { consumerStatusChips, heroFactChips } = resolveActivityDetailViewModelHeroFacts({
    activity,
    joinUiState,
    previewMode,
    isHostUser,
    wireStrips,
    publicDetail,
    showMobileTabs,
  });
  const peekParityCard = useMemo(
    (): DiscoveryCardModel | null =>
      resolveActivityDetailPeekParityCard(
        activity,
        previewMode,
        publicDetail,
        viewerAccess,
        wireStrips
      ),
    [activity, previewMode, publicDetail, viewerAccess, wireStrips]
  );

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
    crewLockedHint,
    showHostManageHub,
    hostCrewHub,
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
    mobileCrewPanel,
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
    partyEditPanel,
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
    publicDetail,
    sections,
    viewerAccess,
    wireStrips,
    joinUiState,
    consumerEngagementActions: consumerWireEngagementCta,
    onOfferLinkedRideshare,
    linkRideshareTenantId,
    detailKind: pageModel.kind,
    visibleMobileTabs,
    showPlaceTab,
    showTransportTab,
  };
};
