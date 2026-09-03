import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Plus, UserCircle, Users, UsersRound } from 'lucide-react';
import { ActivityDTO } from '@uaetrail/shared-types';
import { AccountLinkList } from './AccountLinkList';
import { AccountSectionHeader } from './AccountSectionHeader';
import { AccountStat, AccountStatGrid } from './AccountStatGrid';

interface HostHubSectionsProps {
  activitiesCount: number;
  pendingJoinRequests: number;
  upcomingActivitiesCount: number;
  pastActivitiesCount: number;
  upcomingActivities: ActivityDTO[];
}

export const buildHostStats = ({
  activitiesCount,
  pendingJoinRequests,
  upcomingActivitiesCount,
  pastActivitiesCount,
}: Omit<HostHubSectionsProps, 'upcomingActivities'>): AccountStat[] => [
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

export const HostHubSections = ({
  activitiesCount,
  pendingJoinRequests,
  upcomingActivitiesCount,
  pastActivitiesCount,
  upcomingActivities,
}: HostHubSectionsProps) => {
  const stats = buildHostStats({
    activitiesCount,
    pendingJoinRequests,
    upcomingActivitiesCount,
    pastActivitiesCount,
  });

  const previewActivities = upcomingActivities.slice(0, 2);

  return (
    <>
      <AccountStatGrid stats={stats} />

      {previewActivities.length > 0 && (
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
      )}

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
            to: '/host/locations',
            icon: <MapPin className="w-4 h-4" />,
            label: 'Submit a venue',
            accent: 'blue',
          },
          {
            to: '/host/team',
            icon: <UsersRound className="w-4 h-4" />,
            label: 'Manage team',
          },
        ]}
      />
    </>
  );
};

/** @deprecated Use buildHostStats */
export const buildOrganizerStats = buildHostStats;

/** @deprecated Use HostHubSections */
export const OrganizerHubSections = HostHubSections;
