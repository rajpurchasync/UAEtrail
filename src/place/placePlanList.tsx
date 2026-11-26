import { Link, useLocation } from 'react-router-dom';
import {
  activityIsConsumerDiscoverable,
  exploreActivityPublisherTypeLabel,
  formatExploreEventDateLabel,
  publishesActivityAsIndividual,
  resolveActivityHostDisplayName,
  type ActivityDTO,
} from '@uaetrail/shared-types';
import { activityDetailPath } from '../config/routingCatalog';
import { mapPeekDetailNavState } from '@/discovery/discoverySessionExploreMapPeekNav';
import { DETAIL_SCROLL_SECTION_TITLE } from '../components/mobile/detailScrollSectionStyles';

const isRide = (activity: ActivityDTO): boolean => activity.activityType === 'rideshare';

export const splitPlacePlans = (activities: ActivityDTO[]) => {
  const published = activities.filter((activity) =>
    activityIsConsumerDiscoverable(activity.status)
  );
  return {
    outings: published.filter((activity) => !isRide(activity)),
    rides: published.filter((activity) => isRide(activity)),
  };
};

const planMeta = (activity: ActivityDTO): string => {
  const kind = activity.publishingProfileKind ?? 'community';
  const host = publishesActivityAsIndividual(kind)
    ? resolveActivityHostDisplayName(activity)
    : activity.tenantName?.trim() || resolveActivityHostDisplayName(activity);
  const role = exploreActivityPublisherTypeLabel(kind);
  const when = formatExploreEventDateLabel(activity.date) ?? activity.date;
  const time = activity.time?.trim();
  const seats =
    activity.slotsAvailable != null ? `${activity.slotsAvailable} open` : null;
  const carpool = !isRide(activity) && (activity.linkedRideshare || activity.linkedRideshareActivityId)
    ? 'Carpool'
    : null;
  return [when, time, host, role, seats, carpool].filter(Boolean).join(' · ');
};

const PlanGroup = ({
  title,
  activities,
  linkState,
  onNavigate,
}: {
  title: string;
  activities: ActivityDTO[];
  linkState?: ReturnType<typeof mapPeekDetailNavState>;
  onNavigate?: () => void;
}) => {
  if (activities.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className={`mb-3 ${DETAIL_SCROLL_SECTION_TITLE}`}>{title}</h2>
      <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-white">
        {activities.map((activity) => (
          <li key={activity.id}>
            <Link
              to={activityDetailPath(activity.id)}
              state={linkState}
              onClick={onNavigate}
              className="flex flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-neutral-50"
            >
              <span className="text-sm font-semibold text-neutral-950 line-clamp-2">
                {activity.title?.trim() || 'Outdoor plan'}
              </span>
              <span className="text-xs text-neutral-600">{planMeta(activity)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

/** Outings and carpools already scheduled at a place. One list for the page and the map peek. */
export const PlacePlanList = ({
  activities,
  onNavigate,
  limit,
}: {
  activities: ActivityDTO[];
  onNavigate?: () => void;
  limit?: number;
}) => {
  const location = useLocation();
  const { outings, rides } = splitPlacePlans(activities);
  const take = (rows: ActivityDTO[]) => (limit != null ? rows.slice(0, limit) : rows);
  if (outings.length === 0 && rides.length === 0) return null;
  const linkState = mapPeekDetailNavState(location);
  return (
    <div className="space-y-4">
      <PlanGroup title="Outings here" activities={take(outings)} linkState={linkState} onNavigate={onNavigate} />
      <PlanGroup title="Rides here" activities={take(rides)} linkState={linkState} onNavigate={onNavigate} />
    </div>
  );
};
