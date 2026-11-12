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
  | 'Joined'
  | 'Joined with family'
  | 'Joined · family pending'
  | 'Family joining pending'
  | 'Pending'
  | 'Pending with family'
  | 'Waitlist';

const badgeClass: Record<PlanCommitmentBadge, string> = {
  Hosting: 'bg-emerald-500/15 text-emerald-800',
  'Looking for company': 'bg-violet-500/15 text-violet-800',
  Joined: 'bg-sky-500/15 text-sky-800',
  'Joined with family': 'bg-sky-500/15 text-sky-800',
  'Joined · family pending': 'bg-amber-500/15 text-amber-900',
  'Family joining pending': 'bg-amber-500/15 text-amber-900',
  Pending: 'bg-amber-500/15 text-amber-900',
  'Pending with family': 'bg-amber-500/15 text-amber-900',
  Waitlist: 'bg-neutral-500/15 text-neutral-700',
};

const cardShellClass =
  'glass-card-interactive flex w-full items-center gap-2.5 p-3 text-left active:scale-[0.99] md:gap-2 md:p-2.5 lg:p-2';

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
      <div className="min-w-0 flex-1 space-y-1.5 md:space-y-1">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1 md:items-center">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold md:px-1.5 md:text-[9px] ${badgeClass[badge]}`}
          >
            {badge}
          </span>
          {actionHint ? (
            <span className="text-[10px] font-semibold text-amber-800 md:text-[9px]">{actionHint}</span>
          ) : null}
          <p className="min-w-0 flex-1 basis-full line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-900 md:basis-auto md:line-clamp-1 md:text-sm">
            {title}
          </p>
        </div>
        <div className="flex flex-col gap-0.5 text-xs text-neutral-600 md:flex-row md:flex-wrap md:items-center md:gap-x-2 md:gap-y-0">
          <span className="flex min-w-0 items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0 text-neutral-400 md:h-2.5 md:w-2.5" aria-hidden />
            <span className="truncate">{when}</span>
          </span>
          <span className="hidden text-neutral-300 md:inline" aria-hidden>
            ·
          </span>
          <span className="flex min-w-0 items-center gap-1 text-neutral-500">
            <MapPin className="h-3 w-3 shrink-0 text-neutral-400 md:h-2.5 md:w-2.5" aria-hidden />
            <span className="truncate">{locationLabel}</span>
          </span>
        </div>
        {participants && participants.length > 0 ? (
          <div className="flex items-center gap-1.5 md:mt-0">
            <Users className="h-3 w-3 shrink-0 text-neutral-400 md:h-2.5 md:w-2.5" aria-hidden />
            <ParticipantPreview participants={participants} max={4} size="sm" />
          </div>
        ) : null}
      </div>
  );

  const chevron = (
    <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300 md:h-4 md:w-4" aria-hidden />
  );

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
