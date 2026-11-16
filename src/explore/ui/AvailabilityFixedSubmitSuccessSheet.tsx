import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { fetchPublicActivityDetail } from '../../hooks/publicActivityClientApi';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import { EXPLORE_Z } from '../../config/exploreTheme';
import {
  DEMAND_SUBMIT_SUCCESS_BODY_OFF_MAP,
  DEMAND_SUBMIT_SUCCESS_BODY_ON_MAP,
  DEMAND_SUBMIT_SUCCESS_TITLE,
  DEMAND_SUBMIT_VIEW_CTA,
  HOSTING_RIDESHARE_LINKED_NOTICE,
} from '../createFlowCopy';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import {
  AVAILABILITY_FIXED_TYPE_OPTIONS,
  availabilityWhenShowsTime,
  type AvailabilityFixedDraft,
  type AvailabilityFixedKind,
} from './availabilityFlowEngine';
import { LinkRidesharePanel } from './LinkRidesharePanel';
import { canLinkRideshareToActivity, parentMapKindMayOfferLinkedRideshare } from '../linkActivityRideshareOffer';

type AvailabilityFixedSubmitSuccessSheetProps = {
  open: boolean;
  onClose: () => void;
  kind: AvailabilityFixedKind;
  draft: AvailabilityFixedDraft;
  visibleOnMap: boolean;
  tenantId: string | null;
  publishedActivity: ActivityDTO | null;
  onPrimaryAction: () => void | Promise<void>;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
  onRideshareLinked?: () => void;
  onRideshareLinkError?: (message: string) => void;
};

const SuccessDetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[minmax(4.5rem,5.5rem)_minmax(0,1fr)] items-start gap-x-3 border-t border-neutral-200/80 py-2.5 first:border-t-0 first:pt-0">
    <dt className="text-xs font-medium text-neutral-500">{label}</dt>
    <dd className="text-right text-sm font-semibold leading-snug text-neutral-900 break-words">{value}</dd>
  </div>
);

const formatWhenLine = (draft: AvailabilityFixedDraft, kind: AvailabilityFixedKind): string => {
  if (!draft.date) return 'Flexible';
  const timePart =
    availabilityWhenShowsTime(kind) && draft.timeMode === 'specific' && draft.time
      ? ` · ${draft.time}`
      : availabilityWhenShowsTime(kind)
        ? ' · flexible time'
        : '';
  return `${draft.date}${timePart}`;
};

export const AvailabilityFixedSubmitSuccessSheet = ({
  open,
  onClose,
  kind,
  draft,
  visibleOnMap,
  tenantId,
  publishedActivity,
  onPrimaryAction,
  onRideshareLinked,
  onRideshareLinkError,
}: AvailabilityFixedSubmitSuccessSheetProps) => {
  const [canAddLinkedRide, setCanAddLinkedRide] = useState(false);
  const [rideLinked, setRideLinked] = useState(Boolean(publishedActivity?.linkedRideshareActivityId));
  const [rideshareNotice, setRideshareNotice] = useState<string | null>(null);

  useSafeAsyncEffect(
    async (isActive) => {
      if (!open || !publishedActivity?.id) {
        if (isActive()) setCanAddLinkedRide(false);
        return;
      }
      try {
        const detail = await fetchPublicActivityDetail(publishedActivity.id);
        if (isActive()) {
          setCanAddLinkedRide(detail.viewerAccess?.entitlements?.canAddLinkedRide ?? false);
        }
      } catch {
        if (isActive()) setCanAddLinkedRide(false);
      }
    },
    [open, publishedActivity?.id]
  );

  const typeLabel = AVAILABILITY_FIXED_TYPE_OPTIONS.find((option) => option.key === kind)?.title ?? kind;
  const destination = draft.preferredArea.trim() ? draft.preferredArea.trim() : null;

  const showLinkRideshare =
    visibleOnMap &&
    Boolean(tenantId && publishedActivity) &&
    parentMapKindMayOfferLinkedRideshare(kind) &&
    canLinkRideshareToActivity(publishedActivity) &&
    canAddLinkedRide &&
    !rideLinked;

  const handleLinked = () => {
    setRideLinked(true);
    setRideshareNotice(HOSTING_RIDESHARE_LINKED_NOTICE);
    onRideshareLinked?.();
  };

  const handleLinkError = (message: string) => {
    setRideshareNotice(message);
    onRideshareLinkError?.(message);
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
      ariaLabel={DEMAND_SUBMIT_SUCCESS_TITLE}
      viewportAdaptive
      panelClassName="min-w-0 overflow-x-hidden"
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
            {DEMAND_SUBMIT_SUCCESS_TITLE}
          </h2>
          <p className="mt-2 max-w-[18rem] text-pretty text-sm leading-relaxed text-neutral-600">
            {visibleOnMap ? DEMAND_SUBMIT_SUCCESS_BODY_ON_MAP : DEMAND_SUBMIT_SUCCESS_BODY_OFF_MAP}
          </p>
        </div>

        <div className="mt-5 min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/90 px-4 py-3">
          <p className="text-base font-semibold leading-snug text-neutral-900 break-words">
            {draft.title.trim() || typeLabel}
          </p>
          <dl className="mt-1">
            <SuccessDetailRow label="Looking for" value={typeLabel} />
            <SuccessDetailRow label="When" value={formatWhenLine(draft, kind)} />
            {destination ? <SuccessDetailRow label="Area" value={destination} /> : null}
            <SuccessDetailRow
              label="Party"
              value={draft.partySize === 1 ? 'Just me' : `${draft.partySize} people`}
            />
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

        {showLinkRideshare && tenantId && publishedActivity ? (
          <div className="mt-4 min-w-0">
            <LinkRidesharePanel
              tenantId={tenantId}
              parentActivityId={publishedActivity.id}
              variant="pickExisting"
              onLinked={handleLinked}
              onError={handleLinkError}
            />
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => void onPrimaryAction()}
            className="min-h-12 w-full rounded-xl bg-emerald-600 px-3 py-3 text-base font-bold text-white shadow-md shadow-emerald-600/20"
          >
            {visibleOnMap ? DEMAND_SUBMIT_VIEW_CTA : 'Done'}
          </button>
        </div>
      </div>
    </ExploreResponsiveSheet>
  );
};
