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
  ActivityPresentationSectionsDTO,
  MyActivityRequestDTO,
  ActivityParticipationDTO,
  ReviewDTO,
} from '@uaetrail/shared-types';
import { activityDetailEyebrowForActivity } from '../../config/activityTypes';
import { detailBackPath } from '../../config/routingCatalog';
import type { ActivityViewerAccessDTO, ActivityViewerEntitlementsDTO } from '@uaetrail/shared-types';
import { activityShareInputFromActivity } from '../../utils/activityShare';
import { ShareButton } from '../ui';
import type { ActivityDetailTabId } from '../../activity/activityDetailTab';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityManageInitialView } from './activityManageViews';
import type { ActivityHostManageSurfaceProps } from './ConsumerDetailHostManageSection';
import type { ActivityDetailKind } from '../../activity/detail/activityDetailKind';
import type { ActivityDetailPlanSectionsComponent } from '../../activity/detail/composers';
import { activityDetailPlanSectionsForKind } from '../../activity/detail/composers';
import type { ActivityDetailTabFooterKind } from '../../activity/activityDetailTabFooters';
import { ActivityDetailBody } from './detail/ActivityDetailBody';
import { ActivityDetailSections } from '../../activity/detail/templates/ActivityDetailSections';
import { MobileDetailScrollShell } from '../mobile/MobileDetailScrollShell';
import { MobileDetailShell } from '../mobile/MobileDetailShell';
import { resolveActivityDetailHeaderChrome } from '../../activity/activityDetailHeaderChrome';
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
  /** Confirmed participant — may send Join me invites to friends (host uses console). */
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
  /** Mobile Crew tab lock card — from `resolveActivityPresentation.showCrewLockedHint`. */
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
  /** Host Crew tab — roster, pending queue, check-in (detail shell; wire `?tab=crew`). */
  hostCrewHub?: {
    joinRequests: ActivityRequestView[];
    requestsLoading: boolean;
    onRequestsChanged: () => void | Promise<void>;
  };
  /** Wire `presentation.footerByTab` from GET /activities/:id (AD-PRES-02). */
  wireFooterByTab?: Record<ActivityDetailTabId, ActivityDetailTabFooterKind> | null;
  /** Wire `presentation.strips` — host invited chip on hero, etc. */
  wireStrips?: ActivityEngagementStripsDTO | null;
  /** Wire `presentation.sections` — section visibility for the public page and embed. */
  wireSections?: ActivityPresentationSectionsDTO | null;
  onHostShareOuting?: () => void;
  /** Consumer page template (`HikingActivityDetailPage`, …) — set by `ActivityDetailByKind`. */
  detailKind?: ActivityDetailKind;
  /** Consumer kind composer — defaults from `detailKind` when host embed omits template. */
  planSections?: ActivityDetailPlanSectionsComponent;
  viewerAccess?: ActivityViewerAccessDTO | null;
  onOfferLinkedRideshare?: () => void;
  linkRideshareTenantId?: string | null;
  onMapPeekChatError?: (message: string) => void;
  onParticipantInviteFriends?: () => void;
  /** Host on `/activity/:id` — manage sheet (roster, options); not the edit wizard. */
  onOpenHostManage?: (activity: ActivityDTO, initialView?: ActivityManageInitialView) => void;
  /** Rideshare host attached a parent outing — refresh detail. */
  onRideshareParentLinked?: () => void;
  /** Host manage sheet overview — participants queue + hosting actions on the scroll template. */
  hostManageSurface?: ActivityHostManageSurfaceProps | null;
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
  hostCrewHub,
  wireFooterByTab = null,
  wireStrips = null,
  wireSections = null,
  onHostShareOuting,
  detailKind,
  planSections,
  viewerAccess = null,
  onOfferLinkedRideshare,
  linkRideshareTenantId = null,
  onMapPeekChatError,
  onParticipantInviteFriends,
  onOpenHostManage,
  onRideshareParentLinked,
  hostManageSurface = null,
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
    publicDetail: !previewMode && layout !== 'embedded',
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
    hostCrewHub,
    wireFooterByTab,
    wireStrips,
    wireSections,
    onHostShareOuting,
    viewerAccess,
    onOfferLinkedRideshare,
    detailKind,
    mapPeekActionHandlers,
    linkRideshareTenantId,
    onParticipantInviteFriends,
  });

  const PlanSections =
    planSections ?? (detailKind ? activityDetailPlanSectionsForKind(detailKind) : null);

  const shareControl =
    model.showInviteShare ? (
      <ShareButton
        title={model.sharePayload.title}
        text={model.sharePayload.text}
        path={model.sharePayload.path}
        activityShare={activityShareInputFromActivity(activity)}
        canSendFriendInvites={Boolean(user && canSendJoinInvites)}
        iconOnly
        light
      />
    ) : null;

  if (model.isEmbedded) {
    return <ActivityDetailBody {...model} planSections={PlanSections} />;
  }

  if (model.publicDetail) {
    const headerChrome = resolveActivityDetailHeaderChrome(
      model.activity,
      model.peekParityCard
    );
    return (
      <div
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
        data-activity-detail-template={detailKind ?? undefined}
      >
        <MobileDetailScrollShell
          backTo={backTo}
          backLabel={backLabel}
          headerChrome={headerChrome}
          headerAction={shareControl}
          footer={model.stickyFooter}
        >
          <ActivityDetailSections
            model={model}
            planSections={PlanSections}
            onRideshareParentLinked={onRideshareParentLinked}
            hostManageSurface={hostManageSurface}
          />
        </MobileDetailScrollShell>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      data-activity-detail-template={detailKind ?? undefined}
    >
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
