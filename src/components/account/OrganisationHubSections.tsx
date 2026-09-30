import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Plus, UserCircle, Users, UsersRound } from 'lucide-react';
import { ActivityDTO } from '@uaetrail/shared-types';
import { AccountLinkList } from './AccountLinkList';
import { AccountSectionHeader } from './AccountSectionHeader';
import { AccountStat, AccountStatGrid } from './AccountStatGrid';

interface OrganisationHubSectionsProps {
  activitiesCount: number;
  pendingJoinRequests: number;
  upcomingActivitiesCount: number;
  pastActivitiesCount: number;
  upcomingActivities: ActivityDTO[];
  /** Host console shortcuts — omitted on `/profile` (use Host console entry instead). */
  showConsoleLinks?: boolean;
}

const buildOrganisationStats = ({
  activitiesCount,
  pendingJoinRequests,
  upcomingActivitiesCount,
  pastActivitiesCount,
}: Omit<OrganisationHubSectionsProps, 'upcomingActivities'>): AccountStat[] => [
  { label: 'Activities', value: activitiesCount, to: '/host/activities' },
  {
    label: 'Pending',
    value: pendingJoinRequests,
    to: '/host/requests',
    highlight: pendingJoinRequests > 0,
    tone: 'amber',
  },
  {
    label: 'Upcoming',
    value: upcomingActivitiesCount,
    to: '/host/activities',
    highlight: upcomingActivitiesCount > 0,
  },
  { label: 'History', value: pastActivitiesCount, to: '/host/history' },
];

export const OrganisationHubSections = ({
  activitiesCount,
  pendingJoinRequests,
  upcomingActivitiesCount,
  pastActivitiesCount,
  upcomingActivities,
  showConsoleLinks = true,
}: OrganisationHubSectionsProps) => {
  const stats = buildOrganisationStats({
    activitiesCount,
    pendingJoinRequests,
    upcomingActivitiesCount,
    pastActivitiesCount,
  });

  const previewActivities = upcomingActivities.slice(0, 2);

  return (
    <>
      <AccountStatGrid stats={stats} />

      {previewActivities.length > 0 ? (
        <section>
          <AccountSectionHeader title="Up next" actionTo="/host/activities" actionLabel="All activities" />
          <div className="space-y-2">
            {previewActivities.map((evt) => (
              <Link
                key={evt.id}
                to="/host/activities"
                className="glass-card-interactive flex items-center gap-3 p-3.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {evt.title || '—'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">
                    {evt.locationName} · {new Date(evt.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {evt.time ? ` · ${evt.time}` : ''}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                    evt.status === 'published'
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
          to="/host/activities/new"
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
        <AccountLinkList
          items={[
            {
              to: '/host/profile',
              icon: <UserCircle className="w-4 h-4" />,
              label: 'Public host profile',
              accent: 'emerald',
            },
            {
              to: '/host/activities/new',
              icon: <Plus className="w-4 h-4" />,
              label: 'Add activity',
            },
            {
              to: '/host/requests',
              icon: <Users className="w-4 h-4" />,
              label: 'Join requests',
              badge: pendingJoinRequests || undefined,
              accent: 'amber',
            },
            {
              to: '/host/places',
              icon: <MapPin className="w-4 h-4" />,
              label: 'Submit a place',
              accent: 'blue',
            },
            {
              to: '/host/team',
              icon: <UsersRound className="w-4 h-4" />,
              label: 'Manage team',
            },
          ]}
        />
      ) : null}
    </>
  );
};

/** @deprecated Use OrganisationHubSections */
export const HostHubSections = OrganisationHubSections;

