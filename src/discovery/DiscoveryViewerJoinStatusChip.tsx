import type { DiscoveryCardModel } from './discoveryCardModel';
import {
  activityPeekViewerIsJoined,
  activityPeekViewerJoinIsPending,
} from '../activity/activityPeekEngagement';
import {
  ACTIVITY_STATUS_JOIN_REQUESTED,
  ACTIVITY_STATUS_JOINED,
} from '../content/activityParticipationCopy';

export type DiscoveryViewerJoinStatus = 'joined' | 'pending' | null;

/** Wire-level join status for browse thumbs / list rows (no client join modal state). */
export const resolveDiscoveryViewerJoinStatus = (
  card: DiscoveryCardModel
): DiscoveryViewerJoinStatus => {
  if (card.source !== 'activity') return null;
  if (activityPeekViewerIsJoined(card)) return 'joined';
  if (activityPeekViewerJoinIsPending(card)) return 'pending';
  return null;
};

type ChipProps = {
  card: DiscoveryCardModel;
  /** Poster overlay (dark media) vs list row (light surface). */
  variant?: 'overlay' | 'inline';
  className?: string;
};

const overlayClass =
  'inline-flex rounded-md bg-emerald-500/95 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm';
const overlayPendingClass =
  'inline-flex rounded-md bg-amber-400/95 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow-sm';
const inlineClass =
  'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900';
const inlinePendingClass =
  'inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900';

/** Compact “Joined” / “Pending” chip for explore browse thumbs, list rows, and poster banners. */
export const DiscoveryViewerJoinStatusChip = ({
  card,
  variant = 'inline',
  className = '',
}: ChipProps) => {
  const status = resolveDiscoveryViewerJoinStatus(card);
  if (!status) return null;

  if (status === 'joined') {
    return (
      <span className={`${variant === 'overlay' ? overlayClass : inlineClass} ${className}`.trim()}>
        {ACTIVITY_STATUS_JOINED}
      </span>
    );
  }

  return (
    <span
      className={`${variant === 'overlay' ? overlayPendingClass : inlinePendingClass} ${className}`.trim()}
    >
      {ACTIVITY_STATUS_JOIN_REQUESTED}
    </span>
  );
};
