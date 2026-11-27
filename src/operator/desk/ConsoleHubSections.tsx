import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Plus, UserCircle, Users, UsersRound } from 'lucide-react';
import {
  formatExploreEventDateLabel,
  isPublishedActivityStatus,
  type ActivityDTO,
} from '@uaetrail/shared-types';
import {
  OPERATOR_ACTIVITIES_NEW_PATH,
  OPERATOR_ACTIVITIES_PATH,
  OPERATOR_HISTORY_PATH,
  OPERATOR_PROFILE_PATH,
  OPERATOR_REQUESTS_PATH,
  OPERATOR_TEAM_PATH,
} from '../../config/routingCatalog';
import { OPERATOR_PLACES_PATH } from '../../config/platform';
import { AccountLinkList } from '../../components/account/AccountLinkList';
import { AccountSectionHeader } from '../../components/account/AccountSectionHeader';
import { AccountStat, AccountStatGrid } from '../../components/account/AccountStatGrid';

export interface ConsoleHubSectionsProps {
  activitiesCount: number;
  pendingJoinRequests: number;
  upcomingActivitiesCount: number;
  pastActivitiesCount: number;
  upcomingActivities: ActivityDTO[];
  /** Workspace shortcuts — omitted when the shell already shows nav (e.g. `/publishing/overview`). */
  showConsoleLinks?: boolean;
  /** Compact “Up next” preview — hide when Activities chip covers the same list. */
  showUpcomingPreview?: boolean;
}

const buildConsoleStats = ({
  activitiesCount,
  pendingJoinRequests,
  upcomingActivitiesCount,
  pastActivitiesCount,
}: Omit<ConsoleHubSectionsProps, 'upcomingActivities'>): AccountStat[] => [
  { label: 'Activities', value: activitiesCount, to: OPERATOR_ACTIVITIES_PATH },
  {
    label: 'Pending',
    value: pendingJoinRequests,
    to: OPERATOR_REQUESTS_PATH,
    highlight: pendingJoinRequests > 0,
    tone: 'amber',
  },
  {
    label: 'Upcoming',
    value: upcomingActivitiesCount,
    to: OPERATOR_ACTIVITIES_PATH,
    highlight: upcomingActivitiesCount > 0,
  },
  { label: 'History', value: pastActivitiesCount, to: OPERATOR_HISTORY_PATH },
];

/** Publishing workspace overview stats + shortcuts (tenant scope; copy varies by brand kind). */
export const ConsoleHubSections = ({
  activitiesCount,
  pendingJoinRequests,
  upcomingActivitiesCount,
  pastActivitiesCount,
  upcomingActivities,
  showConsoleLinks = true,
  showUpcomingPreview = true,
}: ConsoleHubSectionsProps) => {
  const stats = buildConsoleStats({
    activitiesCount,
    pendingJoinRequests,
    upcomingActivitiesCount,
    pastActivitiesCount,
  });

  const previewActivities = showUpcomingPreview ? upcomingActivities.slice(0, 2) : [];

  return (
    <>
      <AccountStatGrid stats={stats} />

      {previewActivities.length > 0 ? (
        <section>
          <AccountSectionHeader title="Up next" actionTo={OPERATOR_ACTIVITIES_PATH} actionLabel="All activities" />
          <div className="space-y-2">
            {previewActivities.map((evt) => (
              <Link
                key={evt.id}
                to={OPERATOR_ACTIVITIES_PATH}
                className="glass-card-interactive flex items-center gap-3 p-3.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {evt.title || '—'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">
                    {evt.locationName} · {formatExploreEventDateLabel(evt.date) ?? evt.date}
                    {evt.time ? ` · ${evt.time}` : ''}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                    isPublishedActivityStatus(evt.status)
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : 'bg-neutral-500/10 text-neutral-600'
                  }`}
                >
                  {evt.status}
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      ) : activitiesCount === 0 ? (
        <Link
          to={OPERATOR_ACTIVITIES_NEW_PATH}
          className="glass-card-interactive flex items-center gap-3 p-4 text-center"
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
            <Plus className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-neutral-900">Host your first activity</p>
            <p className="text-xs text-neutral-500">Publish a hike or camp for others to join</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
        </Link>
      ) : null}

      {showConsoleLinks ? (
        <>
          <AccountSectionHeader title="Host tools" />
          <AccountLinkList
            items={[
              {
                to: OPERATOR_PROFILE_PATH,
                icon: <UserCircle className="w-4 h-4" />,
                label: 'Public profile',
                accent: 'emerald',
              },
              {
                to: OPERATOR_ACTIVITIES_NEW_PATH,
                icon: <Plus className="w-4 h-4" />,
                label: 'Add activity',
              },
              {
                to: OPERATOR_REQUESTS_PATH,
                icon: <Users className="w-4 h-4" />,
                label: 'Join requests',
                badge: pendingJoinRequests || undefined,
                accent: 'amber',
              },
              {
                to: OPERATOR_PLACES_PATH,
                icon: <MapPin className="w-4 h-4" />,
                label: 'Submit a place',
                accent: 'blue',
              },
              {
                to: OPERATOR_TEAM_PATH,
                icon: <UsersRound className="w-4 h-4" />,
                label: 'Manage team',
              },
            ]}
          />
        </>
      ) : null}
    </>
  );
};
