import { useState } from 'react';
import { usePublicActivityDetail } from '../../hooks/usePublicActivityDetail';
import { CheckCircle2, Clock, Share2 } from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { useAuth } from '../../context/AuthContext';
import { useShareSheet } from '../../context/ShareSheetContext';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { LinkRidesharePanel } from './LinkRidesharePanel';
import { LinkParentActivityPanel } from './LinkParentActivityPanel';
import {
  HOSTING_RIDESHARE_LINKED_NOTICE,
  HOSTING_PUBLISH_SHARE_CTA,
  HOSTING_PUBLISH_SUCCESS_BODY,
  HOSTING_RIDESHARE_PENDING_DESTINATION_BODY,
  HOSTING_RIDESHARE_SUCCESS_BODY,
  HOSTING_PENDING_VENUE_BODY,
  HOSTING_PENDING_VENUE_TITLE,
  HOSTING_PUBLISH_SUCCESS_BODY_PRIVATE,
  HOSTING_PUBLISH_SUCCESS_TITLE,
  HOSTING_PUBLISH_VIEW_CTA,
} from '../createFlowCopy';
import type { CreateActivityDraft, CreateActivityKind } from './hostingFlowEngine';
import { formatHostingPricePreview, resolveActivityDifficultyLabel } from './hostingFlowEngine';
import { canLinkRideshareToActivity } from '../linkActivityRideshareOffer';
import { ActivityInviteLauncher } from '../../components/activity/ActivityInviteLauncher';
import { activityShareInputFromActivity } from '../../utils/activityShare';

type HostingPublishSuccessSheetProps = {
  open: boolean;
  onClose: () => void;
  tenantId: string | null;
  publishedActivity: ActivityDTO;
  draft: CreateActivityDraft;
  kind: CreateActivityKind;
  showPostPublishRideshare: boolean;
  rideshareNotice: string | null;
  onRideshareLinked: () => void;
  onRideshareLinkError: (message: string) => void;
  onViewOnMap: () => void;
  /** Buddy from Social “Host an outing” — pre-select on post-publish invite. */
  planWithBuddyUserId?: string | null;
};

const SuccessDetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[minmax(4.5rem,5.5rem)_minmax(0,1fr)] items-start gap-x-3 border-t border-neutral-200/80 py-2.5 first:border-t-0 first:pt-0">
    <dt className="text-xs font-medium text-neutral-500">{label}</dt>
    <dd className="text-right text-sm font-semibold leading-snug text-neutral-900 break-words">{value}</dd>
  </div>
);

const primaryButtonClass =
  'min-h-12 w-full rounded-xl bg-emerald-600 px-3 py-3 text-base font-bold text-white shadow-md shadow-emerald-600/20';
const secondaryButtonClass =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-base font-bold text-neutral-900';

export const HostingPublishSuccessSheet = ({
  open,
  onClose,
  tenantId,
  publishedActivity,
  draft,
  kind,
  showPostPublishRideshare,
  rideshareNotice,
  onRideshareLinked,
  onRideshareLinkError,
  onViewOnMap,
  planWithBuddyUserId = null,
}: HostingPublishSuccessSheetProps) => {
  const { user } = useAuth();
  const shareSheet = useShareSheet();
  const [rideLinked, setRideLinked] = useState(Boolean(publishedActivity.linkedRideshareActivityId));
  const [parentLinked, setParentLinked] = useState(Boolean(publishedActivity.linkedActivityId));
  const activityId = open ? publishedActivity.id : undefined;
  usePublicActivityDetail(activityId);

  const showLinkRide =
    showPostPublishRideshare &&
    Boolean(tenantId) &&
    canLinkRideshareToActivity(publishedActivity) &&
    !rideLinked;
  const showLinkParentOuting =
    kind === 'rideshare' && Boolean(tenantId) && !parentLinked;
  const pendingVenue = draft.placeLabelSource === 'custom';
  const successTitle = pendingVenue ? HOSTING_PENDING_VENUE_TITLE : HOSTING_PUBLISH_SUCCESS_TITLE;

  const successBody =
    publishedActivity.joinMode === 'private'
      ? HOSTING_PUBLISH_SUCCESS_BODY_PRIVATE
      : kind === 'rideshare' && draft.rideshareDestinationKind === 'pending_place'
        ? HOSTING_RIDESHARE_PENDING_DESTINATION_BODY
        : kind === 'rideshare'
          ? HOSTING_RIDESHARE_SUCCESS_BODY
          : draft.placeLabelSource === 'custom'
            ? HOSTING_PENDING_VENUE_BODY
            : HOSTING_PUBLISH_SUCCESS_BODY;

  const handleShare = () => {
    shareSheet.openShareFromActivity(publishedActivity, {
      canSendBuddyInvites: Boolean(user),
    });
  };

  return (
    <ExploreResponsiveSheet
      open={open}
      onClose={onClose}
      layout="centered"
      maxWidthClass="max-w-[min(100vw-2rem,22rem)] sm:max-w-md"
      zClass={EXPLORE_Z.composeFlow}
      overlayFixed
      showCloseButton
      showHandle={false}
      ariaLabel={successTitle}
      viewportAdaptive
      panelClassName="min-w-0 overflow-x-hidden"
    >
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              pendingVenue ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
            }`}
            aria-hidden
          >
            {pendingVenue ? <Clock className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-tight text-neutral-900">{successTitle}</h2>
          <p className="mt-2 max-w-[18rem] text-pretty text-sm leading-relaxed text-neutral-600">{successBody}</p>
        </div>

        <div className="mt-5 min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/90 px-4 py-3">
          <p className="text-base font-semibold leading-snug text-neutral-900 break-words">
            {publishedActivity.title}
          </p>
          <dl className="mt-1">
            {kind === 'hiking' ? (
              <SuccessDetailRow
                label="Difficulty"
                value={resolveActivityDifficultyLabel(draft.difficulty)}
              />
            ) : null}
            <SuccessDetailRow label="Price" value={formatHostingPricePreview(draft, kind)} />
            {draft.trailName.trim() ? (
              <SuccessDetailRow label="Trail" value={draft.trailName.trim()} />
            ) : null}
          </dl>
        </div>

        {rideshareNotice ? (
          <p
            className={`mt-3 rounded-lg px-3 py-2 text-sm leading-snug ${
              rideshareNotice === HOSTING_RIDESHARE_LINKED_NOTICE
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {rideshareNotice}
          </p>
        ) : null}

        {planWithBuddyUserId ? (
          <div className="mt-4 min-w-0">
            <ActivityInviteLauncher
              activity={activityShareInputFromActivity(publishedActivity)}
              canSendBuddyInvites
              initialSelectedBuddyIds={[planWithBuddyUserId]}
              defaultOpen
            />
          </div>
        ) : null}

        {showLinkRide && tenantId ? (
          <div className="mt-4 min-w-0">
            <LinkRidesharePanel
              tenantId={tenantId}
              parentActivityId={publishedActivity.id}
              variant="pickExisting"
              onLinked={() => {
                setRideLinked(true);
                onRideshareLinked();
              }}
              onError={onRideshareLinkError}
            />
          </div>
        ) : null}

        {showLinkParentOuting && tenantId ? (
          <div className="mt-4 min-w-0">
            <LinkParentActivityPanel
              tenantId={tenantId}
              rideshareActivityId={publishedActivity.id}
              onLinked={() => {
                setParentLinked(true);
                onRideshareLinked();
              }}
              onError={onRideshareLinkError}
            />
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          <button type="button" onClick={onViewOnMap} className={primaryButtonClass}>
            {HOSTING_PUBLISH_VIEW_CTA}
          </button>
          <button type="button" onClick={handleShare} className={secondaryButtonClass}>
            <Share2 className="h-4 w-4" aria-hidden />
            {HOSTING_PUBLISH_SHARE_CTA}
          </button>
        </div>
      </div>
    </ExploreResponsiveSheet>
  );
};
