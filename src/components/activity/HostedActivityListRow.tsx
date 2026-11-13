import type { ActivityDTO } from '@uaetrail/shared-types';
import { Calendar, ChevronRight, MapPin, Users } from 'lucide-react';
import { ParticipantPreview } from '../ui/ParticipantPreview';
import {
  formatActivityCapacity,
  formatActivityType,
  resolveActivityTitle,
} from '../../utils/activityIdentity';
import { formatDate } from '../../utils';

const statusPillClass: Record<string, string> = {
  draft: 'bg-neutral-500/10 text-neutral-600',
  published: 'bg-emerald-500/15 text-emerald-700',
  cancelled: 'bg-red-500/15 text-red-600',
  suspended: 'bg-orange-500/15 text-orange-700',
};

type HostedActivityListRowProps = {
  activity: ActivityDTO;
  pendingRequestCount?: number;
  onOpenDetail: () => void;
  onDuplicate?: () => void;
  layout?: 'default' | 'desktop-actions';
};

/** Hosted outings list — title, schedule, venue, participants; tap opens host detail. */
export const HostedActivityListRow = ({
  activity,
  pendingRequestCount = 0,
  onOpenDetail,
  onDuplicate,
  layout = 'default',
}: HostedActivityListRowProps) => {
  const title = resolveActivityTitle(activity);
  const venue = activity.locationName?.trim() || 'Venue TBD';
  const when = [formatDate(activity.date), activity.time].filter(Boolean).join(' · ');
  const participants = activity.participantPreviews ?? [];
  const capacityLabel = formatActivityCapacity(activity);

  const body = (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-900">{title}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
            statusPillClass[activity.status] ?? statusPillClass.draft
          }`}
        >
          {activity.status}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-neutral-600">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
        <span className="truncate">{when}</span>
        <span className="text-neutral-300" aria-hidden>
          ·
        </span>
        <span className="shrink-0 text-neutral-500">{formatActivityType(activity.activityType)}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
        <span className="truncate">{venue}</span>
      </div>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <Users className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
          {participants.length > 0 ? (
            <ParticipantPreview participants={participants} max={4} size="sm" />
          ) : (
            <span className="text-xs text-neutral-400">No participants yet</span>
          )}
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-neutral-600">{capacityLabel}</span>
      </div>

      {pendingRequestCount > 0 ? (
        <p className="text-[11px] font-semibold text-amber-700">
          {pendingRequestCount} join request{pendingRequestCount === 1 ? '' : 's'} pending
        </p>
      ) : null}
    </div>
  );

  if (layout === 'desktop-actions') {
    return (
      <div className="glass-card flex w-full items-stretch gap-2 p-3.5">
        {body}
        <div className="flex shrink-0 flex-col justify-center gap-2">
          <button
            type="button"
            onClick={onOpenDetail}
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            Open
          </button>
          {onDuplicate ? (
            <button
              type="button"
              onClick={onDuplicate}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Copy
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenDetail}
      className="glass-card-interactive flex w-full items-stretch gap-2 p-3.5 text-left"
    >
      {body}
      <div className="flex shrink-0 items-center self-center text-neutral-400" aria-hidden>
        <ChevronRight className="h-5 w-5" />
      </div>
    </button>
  );
};
