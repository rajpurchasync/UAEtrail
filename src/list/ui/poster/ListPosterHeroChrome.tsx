import type { BrowsePosterScheduleGrid } from '../../listPosterPresentation';
import {
  formatListFeedPosterTitleLines,
  resolveBrowsePosterHeroTitle,
  resolveBrowsePosterActivityTypeLabel,
  resolveBrowsePosterPlaceLine,
  resolveBrowsePosterRequirementLabels,
  resolveBrowsePosterScheduleGrid,
} from '../../listPosterPresentation';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';

export type ResolvedPosterCopy = {
  placeLine: string | null;
  heroTitle: string;
  titleLines: ReturnType<typeof formatListFeedPosterTitleLines>;
  activityTypeLabel: string | null;
  schedule: BrowsePosterScheduleGrid;
  labels: string[];
  requirementLabels: string[];
};

export const resolveListPosterCopy = (card: DiscoveryCardModel): ResolvedPosterCopy => {
  const heroTitle = resolveBrowsePosterHeroTitle(card);
  return {
    placeLine: resolveBrowsePosterPlaceLine(card),
    heroTitle,
    titleLines: formatListFeedPosterTitleLines(heroTitle),
    activityTypeLabel: resolveBrowsePosterActivityTypeLabel(card),
    schedule: resolveBrowsePosterScheduleGrid(card),
    labels: resolveBrowsePosterRequirementLabels(card),
    requirementLabels: resolveBrowsePosterRequirementLabels(card),
  };
};

/** Discover home half-hero — activity type + location only (facts below image). */
const DISCOVER = {
  topScrim:
    'pointer-events-none absolute inset-x-0 top-0 z-[2] bg-gradient-to-b from-black/50 via-black/15 to-transparent px-2.5 pb-4 pt-2 text-left',
  textShadow: '[text-shadow:0_1px_2px_rgba(0,0,0,.45)]',
  activityType: 'truncate text-[10px] font-bold uppercase tracking-wide text-white/95',
  place: 'mt-0.5 line-clamp-2 text-[12px] font-semibold leading-snug text-white',
  scheduleRow: 'flex items-baseline justify-between gap-2 text-[11px] font-semibold',
  scheduleLeft: 'min-w-0 truncate text-left text-neutral-800',
  scheduleRight: 'shrink-0 text-right tabular-nums text-neutral-600',
  requirementLine: 'line-clamp-2 text-[10px] font-medium leading-snug text-neutral-500',
  requirementOnPhoto:
    'line-clamp-2 text-center text-[10px] font-medium leading-snug text-white/90',
  bottomScrim:
    'pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/75 via-black/40 to-transparent px-2.5 pb-2 pt-5 text-center',
  body: 'flex flex-col gap-1',
};

export const ListPosterDiscoverHeroEyebrow = ({
  activityTypeLabel,
  placeLine,
}: {
  activityTypeLabel: string | null;
  placeLine: string | null;
}) => {
  if (!activityTypeLabel && !placeLine) return null;
  return (
    <div className={`${DISCOVER.topScrim} ${DISCOVER.textShadow}`}>
      {activityTypeLabel ? <p className={DISCOVER.activityType}>{activityTypeLabel}</p> : null}
      {placeLine ? <p className={DISCOVER.place}>{placeLine}</p> : null}
    </div>
  );
};

/** Discover home rail — pets / women-only etc. on the half-hero image. */
export const ListPosterDiscoverHeroRequirements = ({ labels }: { labels: string[] }) => {
  if (labels.length === 0) return null;
  return (
    <div className={DISCOVER.bottomScrim}>
      <p className={`${DISCOVER.requirementOnPhoto} ${DISCOVER.textShadow}`}>
        {labels.slice(0, 3).join(' · ')}
      </p>
    </div>
  );
};

export const ListPosterDiscoverScheduleBody = ({
  schedule,
  requirementLabels = [],
  className = '',
}: {
  schedule: BrowsePosterScheduleGrid;
  requirementLabels?: string[];
  className?: string;
}) => {
  const row1 = schedule.dateLabel || schedule.timeLabel;
  const row2 = schedule.spotsLabel || schedule.priceLabel;
  const requirements = requirementLabels.length > 0 ? requirementLabels.join(' · ') : null;
  if (!row1 && !row2 && !requirements) return null;

  return (
    <div className={`${DISCOVER.body} ${className}`.trim()}>
      {row1 ? (
        <div className={DISCOVER.scheduleRow}>
          <span className={DISCOVER.scheduleLeft}>{schedule.dateLabel ?? '—'}</span>
          <span className={DISCOVER.scheduleRight}>{schedule.timeLabel ?? ''}</span>
        </div>
      ) : null}
      {row2 ? (
        <div className={DISCOVER.scheduleRow}>
          <span className={DISCOVER.scheduleLeft}>{schedule.spotsLabel ?? ''}</span>
          <span className={DISCOVER.scheduleRight}>{schedule.priceLabel ?? ''}</span>
        </div>
      ) : null}
      {requirements ? <p className={DISCOVER.requirementLine}>{requirements}</p> : null}
    </div>
  );
};
