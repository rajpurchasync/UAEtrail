import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { fetchPublicActivityDetail } from '../../hooks/publicActivityClientApi';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { EXPLORE_REGION_PILL_LABELS } from '../../config/regions';
import {
  DEMAND_SUBMIT_SUCCESS_BODY_OFF_MAP,
  DEMAND_SUBMIT_SUCCESS_BODY_ON_MAP,
  DEMAND_SUBMIT_SUCCESS_TITLE,
  DEMAND_SUBMIT_VIEW_CTA,
  ORGANIZE_LINK_RIDESHARE_LABEL,
  ORGANIZE_LINK_RIDESHARE_PASTE_CTA,
  ORGANIZE_RIDESHARE_LINKED_NOTICE,
} from '../createFlowCopy';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import {
  DEMAND_TYPE_OPTIONS,
  demandWhenShowsTime,
  usesCampingDemandFlow,
  usesHikingDemandFlow,
  type DemandDraft,
  type DemandKind,
} from './seekingFlowEngine';
import { LinkRidesharePanel } from './LinkRidesharePanel';
import { canLinkRideshareToActivity, parentMapKindMayOfferLinkedRideshare } from '../linkActivityRideshareOffer';

type DemandSubmitSuccessSheetProps = {
  open: boolean;
  onClose: () => void;
  kind: DemandKind;
  draft: DemandDraft;
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

const formatWhenLine = (draft: DemandDraft, kind: DemandKind): string => {
  if (!draft.date) return 'Flexible';
  const timePart =
    demandWhenShowsTime(kind) && draft.timeMode === 'specific' && draft.time
      ? ` · ${draft.time}`
      : demandWhenShowsTime(kind)
        ? ' · flexible time'
        : '';
  return `${draft.date}${timePart}`;
};

const linkButtonClass =
  'text-sm font-semibold text-sky-800 underline underline-offset-2 hover:text-sky-950';

export const DemandSubmitSuccessSheet = ({
  open,
  onClose,
  kind,
  draft,
  visibleOnMap,
  tenantId,
  publishedActivity,
  onPrimaryAction,
  onCreateLinkedRideshare,
  onRideshareLinked,
  onRideshareLinkError,
}: DemandSubmitSuccessSheetProps) => {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [canAddLinkedRide, setCanAddLinkedRide] = useState(false);
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

  const typeLabel = DEMAND_TYPE_OPTIONS.find((option) => option.key === kind)?.title ?? kind;
  const destination =
    (usesHikingDemandFlow(kind) || usesCampingDemandFlow(kind)) && draft.preferredArea
      ? EXPLORE_REGION_PILL_LABELS[draft.preferredArea] ?? draft.preferredArea
      : null;

  const showLinkRideshare =
    visibleOnMap &&
    Boolean(tenantId && publishedActivity) &&
    parentMapKindMayOfferLinkedRideshare(kind) &&
    canLinkRideshareToActivity(publishedActivity) &&
    canAddLinkedRide;

  const handleCreateLinked = () => {
    if (!publishedActivity || !onCreateLinkedRideshare) {
      setRideshareNotice('Open this plan from Explore to create a linked rideshare.');
      return;
    }
    onCreateLinkedRideshare(publishedActivity);
  };

  const handleLinked = () => {
    setRideshareNotice(ORGANIZE_RIDESHARE_LINKED_NOTICE);
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
              rideshareNotice === ORGANIZE_RIDESHARE_LINKED_NOTICE
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {rideshareNotice}
          </p>
        ) : null}

        {showLinkRideshare && pasteOpen && tenantId && publishedActivity ? (
          <div className="mt-4 min-w-0">
            <LinkRidesharePanel
              tenantId={tenantId}
              parentActivityId={publishedActivity.id}
              variant="pasteOnly"
              onCreateRideshare={handleCreateLinked}
              onLinked={() => {
                handleLinked();
                setPasteOpen(false);
              }}
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
          {showLinkRideshare ? (
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              <button type="button" onClick={handleCreateLinked} className={linkButtonClass}>
                {ORGANIZE_LINK_RIDESHARE_LABEL}
              </button>
              <button
                type="button"
                aria-expanded={pasteOpen}
                onClick={() => setPasteOpen((value) => !value)}
                className={linkButtonClass}
              >
                {ORGANIZE_LINK_RIDESHARE_PASTE_CTA}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </ExploreResponsiveSheet>
  );
};
