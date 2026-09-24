import type { UpcomingPlanRow } from '../../utils/activityHubSections';
import { formatActivityType } from '../../utils/activityIdentity';
import { requestStatusClassName, requestStatusLabel } from '../../utils/joinRequestUi';

interface UpcomingPlanCardProps {
  row: UpcomingPlanRow;
  onClick: () => void;
}

const formatCardDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

/** Compact horizontal card for the Activities hub upcoming rail. */
export const UpcomingPlanCard = ({ row, onClick }: UpcomingPlanCardProps) => {
  if (row.kind === 'confirmed') {
    const activity = row.activity;
    return (
      <button
        type="button"
        onClick={onClick}
        className="glass-card-interactive w-[72vw] max-w-[280px] shrink-0 snap-start p-3.5 text-left"
      >
        <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">You&apos;re going</span>
        <p className="mt-1 truncate text-sm font-semibold text-neutral-900">
          {activity.title || activity.locationName}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {[formatCardDate(activity.date), formatActivityType(activity.activityType), activity.time]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </button>
    );
  }

  const request = row.request;
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card-interactive w-[72vw] max-w-[280px] shrink-0 snap-start p-3.5 text-left"
    >
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${requestStatusClassName(request.status)}`}
      >
        {requestStatusLabel(request.status)}
      </span>
      <p className="mt-1.5 truncate text-sm font-semibold text-neutral-900">
        {request.activity.title || request.activity.locationName}
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        {[formatCardDate(row.date), request.activity.time].filter(Boolean).join(' · ')}
      </p>
    </button>
  );
};
