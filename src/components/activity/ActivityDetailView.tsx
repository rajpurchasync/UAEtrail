import type { ReactNode } from 'react';
import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveJoinRequestUiState } from '../../utils/joinRequestUi';
import { useAuth } from '../../context/AuthContext';
import { useActivityDetailMapPeekHandlers } from '../../activity/useActivityDetailMapPeekHandlers';
import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityGroupChatPostPolicy,
  ActivityPresentationConsumerLayoutDTO,
  ActivityPresentationTabsDTO,
  MyActivityRequestDTO,
  ActivityParticipationDTO,
  ReviewDTO,
} from '@uaetrail/shared-types';
import { activityDetailEyebrowForActivity } from '../../config/activityTypes';
import { detailBackPath } from '../../config/routingCatalog';
import type { ActivityViewerAccessDTO, ActivityViewerEntitlementsDTO } from '@uaetrail/shared-types';
import { MobileDetailShell } from '../mobile/MobileDetailShell';
import { ShareButton } from '../ui';
import type { ActivityDetailTabId } from '../../activity/activityDetailTab';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityManageInitialView } from './activityManageViews';
import type { ActivityDetailKind } from '../../activity/detail/activityDetailKind';
import type { ActivityDetailPlanSectionsComponent } from '../../activity/detail/composers';
import { activityDetailPlanSectionsForKind } from '../../activity/detail/composers';
import type { ActivityDetailTabFooterKind } from '../../activity/activityDetailTabFooters';
import { ActivityDetailBody } from './detail/ActivityDetailBody';
import { ActivityConsumerDetailPage } from '../../activity/detail/templates/ActivityConsumerDetailPage';
import { ActivityConsumerDetailModalShell } from '../../activity/detail/templates/ActivityConsumerDetailModalShell';
import { resolveActivityConsumerDetailHeaderChrome } from '../../activity/activityConsumerDetailHeader';
import { useActivityDetailViewModel } from './detail/useActivityDetailViewModel';
import type { ActivityRequestView } from '../../api/types';

export interface ActivityDetailViewProps {
  activity: ActivityDetailDTO;
  /** Host publish preview overlay only — not guest/redacted viewers. */
  previewMode?: boolean;
  /** Guest — same shell; Plan tab shows sign-in gate instead of sensitive plan body. */
  requiresSignIn?: boolean;
  /** Signed-in, not on roster — inline hint on Plan tab. */
  showJoinRequiredHint?: boolean;
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
  /** Host — crew chat post policy (`groupChatPostPolicy` on activity). */
  hostCrewChatPolicy?: {
    tenantId: string;
    onSaved?: (policy: ActivityGroupChatPostPolicy) => void;
    onError?: (message: string) => void;
  };
  /** Host Buddies tab — roster, pending queue, check-in (detail shell). */
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
  /** Wire `presentation.consumerLayout` — public scroll template slots. */
  consumerLayout?: ActivityPresentationConsumerLayoutDTO | null;
  onHostShareOuting?: () => void;
  /** Consumer page template (`HikingActivityDetailPage`, …) — set by `ActivityDetailByKind`. */
  detailKind?: ActivityDetailKind;
  /** Consumer kind composer — defaults from `detailKind` when host embed omits template. */
  planSections?: ActivityDetailPlanSectionsComponent;
  /** Public route scroll layout (`ActivityDetailPageShell` only). */
  consumerDetailLayout?: boolean;
  viewerAccess?: ActivityViewerAccessDTO | null;
  onOfferLinkedRideshare?: () => void;
  linkRideshareTenantId?: string | null;
  onMapPeekChatError?: (message: string) => void;
  onParticipantInviteFriends?: () => void;
  /** Host on `/activity/:id` — same Manage sheet as map peek (`manage_activity` wire). */
  onOpenHostManage?: (activity: ActivityDTO, initialView?: ActivityManageInitialView) => void;
}

export const ActivityDetailView = ({
  activity,
  previewMode = false,
  requiresSignIn = false,
  showJoinRequiredHint = false,
  backTo = detailBackPath('activity'),
  backLabel = '',
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
  detailKind,
  planSections,
  consumerDetailLayout = false,
  viewerAccess = null,
  onOfferLinkedRideshare,
  linkRideshareTenantId = null,
  onMapPeekChatError,
  onParticipantInviteFriends,
  onOpenHostManage,
}: ActivityDetailViewProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isHostUser = Boolean(hostCrewChatPolicy);

  const joinUiState = useMemo(
    () =>
      resolveJoinRequestUiState({
        myRequest: myRequest ?? null,
        participation: participation ?? null,
      }),
    [myRequest, participation]
  );

  const openParticipationManageRef = useRef<() => void>(() => {});

  const mapPeekActionHandlers = useActivityDetailMapPeekHandlers({
    activity,
    user,
    joinUiState,
    navigate,
    onJoin,
    onWithdraw,
    onHostShareOuting,
    onParticipantInviteFriends,
    onOfferLinkedRideshare,
    onMobileTabChange,
    onChatError: onMapPeekChatError,
    isHostUser,
    onOpenHostManage,
    consumerDetailLayout,
    onOpenParticipationManage: () => openParticipationManageRef.current(),
  });

  const model = useActivityDetailViewModel({
    activity,
    previewMode,
    requiresSignIn,
    showJoinRequiredHint,
    participation,
    myRequest,
    message,
    error,
    onJoin,
    onWithdraw,
    hostDetailCtas,
    sidebarJoinOverride,
    confirmedSidebarExtras,
    joinDisabled,
    canSendJoinInvites,
    activityReviews,
    onActivityReviewSubmitted,
    canWriteActivityReview,
    mobileTab,
    onMobileTabChange,
    canAccessCrewSurfaces,
    showParticipantFooterShortcuts,
    showCrewLockedHint,
    viewerEntitlements,
    layout,
    hostCrewChatPolicy,
    hostBuddiesHub,
    wireFooterByTab,
    wireTabs,
    wireStrips,
    consumerLayout,
    onHostShareOuting,
    consumerDetailLayout,
    viewerAccess,
    onOfferLinkedRideshare,
    detailKind,
    mapPeekActionHandlers,
    linkRideshareTenantId,
    onParticipantInviteFriends,
    participationManageOpenerRef: openParticipationManageRef,
  });

  const PlanSections =
    planSections ?? (detailKind ? activityDetailPlanSectionsForKind(detailKind) : null);

  const shareControl =
    model.showInviteShare ? (
      <ShareButton
        title={model.sharePayload.title}
        text={model.sharePayload.text}
        path={model.sharePayload.path}
        iconOnly
        light
      />
    ) : null;

  if (model.isEmbedded) {
    return <ActivityDetailBody {...model} planSections={PlanSections} />;
  }

  const openParticipantInviteFriends = () => {
    if (onParticipantInviteFriends) {
      onParticipantInviteFriends();
      return;
    }
    mapPeekActionHandlers.inviteCrew?.();
  };

  if (consumerDetailLayout) {
    const headerChrome = resolveActivityConsumerDetailHeaderChrome(
      model.activity,
      model.peekParityCard
    );
    return (
      <div data-activity-detail-template={detailKind ?? undefined}>
        <ActivityConsumerDetailModalShell
          backTo={backTo}
          backLabel={backLabel}
          headerChrome={headerChrome}
          headerAction={shareControl}
          footer={model.stickyFooter}
        >
          <ActivityConsumerDetailPage
            model={model}
            canInviteFriends={
              canSendJoinInvites ||
              model.joinUiState.kind === 'pending' ||
              model.joinUiState.kind === 'confirmed'
            }
            onInviteFriends={openParticipantInviteFriends}
          />
        </ActivityConsumerDetailModalShell>
      </div>
    );
  }

  return (
    <div data-activity-detail-template={detailKind ?? undefined}>
      <MobileDetailShell
        backTo={backTo}
        backLabel={backLabel}
        footer={model.stickyFooter}
        headerAction={shareControl}
        banner={{
          src: model.heroImage,
          alt: model.activityTitle,
          title: previewMode ? model.activityTitle : model.titleChromeLine,
          eyebrow: activityDetailEyebrowForActivity(
            model.activity.activityType,
            model.activity.activityMode
          ),
          showMobileChrome: !previewMode,
          showJourney: !previewMode,
          journeyFallbackTo: backTo,
          journeyLabel: backLabel,
          topRightOverlay: shareControl,
        }}
      >
        <ActivityDetailBody {...model} planSections={PlanSections} />
      </MobileDetailShell>
    </div>
  );
};
