import type { ActivityDTO } from '@uaetrail/shared-types';
import { Calendar, MapPin, Users } from 'lucide-react';
import { ActivityActionsMenu, type ActivityMenuItem } from '../activities/ActivityActionsMenu';
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
  menuItems: ActivityMenuItem[];
  pendingRequestCount?: number;
  onOpenDetail: () => void;
};

/** Hosted outings list — title, schedule, venue, participants, overflow menu. */
export const HostedActivityListRow = ({
  activity,
  menuItems,
  pendingRequestCount = 0,
  onOpenDetail,
}: HostedActivityListRowProps) => {
  const title = resolveActivityTitle(activity);
  const venue = activity.locationName?.trim() || 'Venue TBD';
  const when = [formatDate(activity.date), activity.time].filter(Boolean).join(' · ');
  const participants = activity.participantPreviews ?? [];
  const capacityLabel = formatActivityCapacity(activity);

  return (
    <div className="glass-card-interactive flex w-full items-stretch gap-0 overflow-hidden">
      <button
        type="button"
        onClick={onOpenDetail}
        className="flex min-w-0 flex-1 flex-col gap-2 p-3.5 text-left"
      >
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
          <span className="text-neutral-300" aria-hidden>·</span>
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
      </button>

      <div className="flex shrink-0 items-start border-l border-neutral-100/90 px-0.5 pt-1">
        <ActivityActionsMenu items={menuItems} align="right" />
      </div>
    </div>
  );
};
