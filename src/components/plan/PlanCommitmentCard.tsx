import { Calendar, ChevronRight, MapPin, Users } from 'lucide-react';
import { ParticipantPreview } from '../ui/ParticipantPreview';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { formatDate } from '../../utils';
import { formatActivityType, resolveActivityTitle } from '../../utils/activityIdentity';
import { isPlanSummaryFocusScrollGuardActive } from '../../plan/planSummaryFocusScroll';
import { PlanUpcomingDetailLink } from './PlanUpcomingDetailLink';

export type PlanCommitmentBadge =
  | 'Hosting'
  | 'Looking for company'
  | 'Going'
  | 'Pending'
  | 'Waitlist';

const badgeClass: Record<PlanCommitmentBadge, string> = {
  Hosting: 'bg-emerald-500/15 text-emerald-800',
  'Looking for company': 'bg-violet-500/15 text-violet-800',
  Going: 'bg-sky-500/15 text-sky-800',
  Pending: 'bg-amber-500/15 text-amber-900',
  Waitlist: 'bg-neutral-500/15 text-neutral-700',
};

const cardShellClass =
  'glass-card-interactive flex w-full items-center gap-3 p-4 text-left active:scale-[0.99]';

type PlanCommitmentCardProps = {
  title: string;
  dateLabel: string;
  timeLabel?: string | null;
  locationLabel: string;
  activityTypeLabel?: string;
  badge: PlanCommitmentBadge;
  participants?: ActivityDTO['participantPreviews'];
  actionHint?: string | null;
  /** Link to full activity page (Plan upcoming — restores scroll on back). */
  activityDetailTo?: string;
  navFocus?: string;
  onClick?: () => void;
};

export const PlanCommitmentCard = ({
  title,
  dateLabel,
  timeLabel,
  locationLabel,
  activityTypeLabel,
  badge,
  participants,
  actionHint,
  activityDetailTo,
  navFocus,
  onClick,
}: PlanCommitmentCardProps) => {
  const when = [dateLabel, timeLabel, activityTypeLabel].filter(Boolean).join(' · ');

  const body = (
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badgeClass[badge]}`}
          >
            {badge}
          </span>
          {actionHint ? (
            <span className="text-[11px] font-semibold text-amber-800">{actionHint}</span>
          ) : null}
        </div>
        <p className="line-clamp-2 text-[16px] font-semibold leading-snug text-neutral-900">{title}</p>
        <div className="flex items-center gap-1.5 text-xs text-neutral-600">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
          <span className="truncate">{when}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
          <span className="truncate">{locationLabel}</span>
        </div>
        {participants && participants.length > 0 ? (
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
            <ParticipantPreview participants={participants} max={4} size="sm" />
          </div>
        ) : null}
      </div>
  );

  const chevron = <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300" aria-hidden />;

  if (activityDetailTo && navFocus) {
    return (
      <PlanUpcomingDetailLink to={activityDetailTo} navFocus={navFocus} className={cardShellClass}>
        {body}
        {chevron}
      </PlanUpcomingDetailLink>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (isPlanSummaryFocusScrollGuardActive()) return;
        onClick?.();
      }}
      className={cardShellClass}
    >
      {body}
      {chevron}
    </button>
  );
};

export const planCardFromActivity = (
  activity: ActivityDTO,
  options: {
    badge: PlanCommitmentBadge;
    pendingHint?: string | null;
    onClick: () => void;
  }
) => (
  <PlanCommitmentCard
    title={resolveActivityTitle(activity)}
    dateLabel={formatDate(activity.date)}
    timeLabel={activity.time}
    locationLabel={activity.locationName}
    activityTypeLabel={formatActivityType(activity.activityType)}
    badge={options.badge}
    participants={activity.participantPreviews}
    actionHint={options.pendingHint}
    onClick={options.onClick}
  />
);
