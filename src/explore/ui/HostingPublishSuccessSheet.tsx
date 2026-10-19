import { useState } from 'react';
import { usePublicActivityDetail } from '../../hooks/usePublicActivityDetail';
import { CheckCircle2 } from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { LinkRidesharePanel } from './LinkRidesharePanel';
import {
  HOSTING_RIDESHARE_LINKED_NOTICE,
  HOSTING_LINK_RIDESHARE_LABEL,
  HOSTING_LINK_RIDESHARE_PASTE_CTA,
  HOSTING_PUBLISH_SUCCESS_BODY,
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
  onCreateLinkedRideshare: () => void;
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

const linkButtonClass =
  'text-sm font-semibold text-sky-800 underline underline-offset-2 hover:text-sky-950';

export const HostingPublishSuccessSheet = ({
  open,
  onClose,
  tenantId,
  publishedActivity,
  draft,
  kind,
  showPostPublishRideshare,
  rideshareNotice,
  onCreateLinkedRideshare,
  onRideshareLinked,
  onRideshareLinkError,
  onViewOnMap,
  planWithBuddyUserId = null,
}: HostingPublishSuccessSheetProps) => {
  const [pasteOpen, setPasteOpen] = useState(false);
  const activityId = open ? publishedActivity.id : undefined;
  const { viewerAccess } = usePublicActivityDetail(activityId);
  const canAddLinkedRide = viewerAccess?.entitlements?.canAddLinkedRide ?? false;

  const showLinkRideshare =
    showPostPublishRideshare &&
    tenantId &&
    canLinkRideshareToActivity(publishedActivity) &&
    canAddLinkedRide;

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
      ariaLabel={HOSTING_PUBLISH_SUCCESS_TITLE}
      panelClassName="min-w-0 overflow-x-hidden px-5 pb-5 pt-10 sm:px-6 sm:pb-6"
    >
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-col items-center text-center">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
            aria-hidden
          >
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-tight text-neutral-900">
            {HOSTING_PUBLISH_SUCCESS_TITLE}
          </h2>
          <p className="mt-2 max-w-[18rem] text-pretty text-sm leading-relaxed text-neutral-600">
            {publishedActivity.joinMode === 'private'
              ? HOSTING_PUBLISH_SUCCESS_BODY_PRIVATE
              : HOSTING_PUBLISH_SUCCESS_BODY}
          </p>
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

        {showLinkRideshare && pasteOpen ? (
          <div className="mt-4 min-w-0">
            <LinkRidesharePanel
              tenantId={tenantId}
              parentActivityId={publishedActivity.id}
              variant="pasteOnly"
              onCreateRideshare={onCreateLinkedRideshare}
              onLinked={() => {
                onRideshareLinked();
                setPasteOpen(false);
              }}
              onError={onRideshareLinkError}
            />
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={onViewOnMap}
            className="min-h-12 w-full rounded-xl bg-emerald-600 px-3 py-3 text-base font-bold text-white shadow-md shadow-emerald-600/20"
          >
            {HOSTING_PUBLISH_VIEW_CTA}
          </button>
          {showLinkRideshare ? (
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              <button type="button" onClick={onCreateLinkedRideshare} className={linkButtonClass}>
                {HOSTING_LINK_RIDESHARE_LABEL}
              </button>
              <button
                type="button"
                aria-expanded={pasteOpen}
                onClick={() => setPasteOpen((value) => !value)}
                className={linkButtonClass}
              >
                {HOSTING_LINK_RIDESHARE_PASTE_CTA}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </ExploreResponsiveSheet>
  );
};
