import type { ReactNode } from 'react';
import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityGroupChatPostPolicy,
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
import type { ActivityDetailKind } from '../../activity/detail/activityDetailKind';
import type { ActivityDetailTabFooterKind } from '../../activity/activityDetailTabFooters';
import { ActivityDetailBody } from './detail/ActivityDetailBody';
import { ActivityDetailMarketingFold } from './detail/ActivityDetailMarketingFold';
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
  /** Consumer page template (`HikingActivityDetailPage`, …) — set by `ActivityDetailByKind`. */
  detailKind?: ActivityDetailKind;
  /** Consumer route — §6.0 marketing fold above tabs (`ActivityDetailPageShell` only). */
  showConsumerMarketingFold?: boolean;
  viewerAccess?: ActivityViewerAccessDTO | null;
  onOfferLinkedRideshare?: () => void;
}

export const ActivityDetailView = ({
  activity,
  previewMode = false,
  requiresSignIn = false,
  showJoinRequiredHint = false,
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
  hostCrewChatPolicy,
  hostBuddiesHub,
  wireFooterByTab = null,
  wireTabs = null,
  wireStrips = null,
  onHostShareOuting,
  detailKind,
  showConsumerMarketingFold = false,
  viewerAccess = null,
  onOfferLinkedRideshare,
}: ActivityDetailViewProps) => {
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
    onHostShareOuting,
    showConsumerMarketingFold,
    viewerAccess,
    onOfferLinkedRideshare,
  });

  if (model.isEmbedded) {
    return <ActivityDetailBody {...model} />;
  }

  return (
    <div data-activity-detail-template={detailKind ?? undefined}>
      <MobileDetailShell
        backTo={backTo}
        backLabel={backLabel}
        footer={model.stickyFooter}
        headerAction={
          model.showInviteShare ? (
            <ShareButton
              title={model.sharePayload.title}
              text={model.sharePayload.text}
              path={model.sharePayload.path}
              iconOnly
              light
            />
          ) : undefined
        }
        banner={{
          src: model.heroImage,
          alt: model.activityTitle,
          title: previewMode ? model.activityTitle : model.titleChromeLine,
          eyebrow: activityDetailEyebrowForActivity(model.activity.activityType, model.activity.activityMode),
          showMobileChrome: !previewMode,
          showJourney: !previewMode,
          journeyFallbackTo: backTo,
          journeyLabel: backLabel,
        }}
      >
        {showConsumerMarketingFold ? <ActivityDetailMarketingFold model={model} /> : null}
        <ActivityDetailBody {...model} />
      </MobileDetailShell>
    </div>
  );
};
