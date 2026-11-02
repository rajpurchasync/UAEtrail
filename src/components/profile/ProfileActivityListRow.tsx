import { useNavigate } from 'react-router-dom';
import { formatExploreEventDateLabel, type ActivityDTO } from '@uaetrail/shared-types';
import { ActivityHubListRow } from '../mobile/ActivityHubListRow';

const formatActivityRowMeta = (activity: ActivityDTO): string => {
  const datePart = formatExploreEventDateLabel(activity.date) ?? activity.date;
  const parts: string[] = [];
  if (activity.locationName?.trim()) parts.push(activity.locationName.trim());
  parts.push(datePart);
  if (activity.time?.trim()) parts.push(activity.time.trim());
  return parts.join(' · ');
};

/** Public profile / hub — compact hosted activity row (matches personal profile hosting preview). */
export const ProfileActivityListRow = ({ activity }: { activity: ActivityDTO }) => {
  const navigate = useNavigate();

  return (
    <ActivityHubListRow
      title={activity.title?.trim() || 'Outdoor plan'}
      meta={formatActivityRowMeta(activity)}
      badge={
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
            activity.status === 'published'
              ? 'bg-emerald-500/15 text-emerald-700'
              : 'bg-neutral-500/10 text-neutral-600'
          }`}
        >
          {activity.status}
        </span>
      }
      onClick={() => navigate(`/activity/${activity.id}`)}
    />
  );
};
