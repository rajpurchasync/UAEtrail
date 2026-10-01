import type { ActivityDTO } from '@uaetrail/shared-types';
import { formatActivityType } from '../../utils/activityIdentity';
import { UpcomingPlanCard } from '../../pages/activities/UpcomingPlanCard';
import type { UpcomingPlanRow } from '../../utils/activityHubSections';
import type { UpcomingHubHighlight } from '../../pages/activities/upcomingHubHighlights';

const formatCardDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

const cardShell =
  'glass-card-interactive w-[min(72vw,280px)] shrink-0 snap-start p-4 text-left';

const HostedHighlightCard = ({ activity, onClick }: { activity: ActivityDTO; onClick: () => void }) => (
  <button type="button" onClick={onClick} className={cardShell}>
    <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">Hosting</span>
    <p className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-900">
      {activity.title || activity.locationName}
    </p>
    <p className="mt-1 text-xs text-neutral-500">
      {[formatCardDate(activity.date), formatActivityType(activity.activityType), activity.time]
        .filter(Boolean)
        .join(' · ')}
    </p>
  </button>
);

type UpcomingHubHighlightCardProps = {
  item: UpcomingHubHighlight;
  onJoinedClick: (row: UpcomingPlanRow) => void;
  onHostedClick: (activity: ActivityDTO) => void;
};

/** Trips tab — horizontal Upcoming rail card (joined plan or hosted activity). */
export const UpcomingHubHighlightCard = ({
  item,
  onJoinedClick,
  onHostedClick,
}: UpcomingHubHighlightCardProps) => {
  if (item.kind === 'joined') {
    return <UpcomingPlanCard row={item.row} onClick={() => onJoinedClick(item.row)} />;
  }
  return <HostedHighlightCard activity={item.activity} onClick={() => onHostedClick(item.activity)} />;
};
