import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Plus, UserCircle, Users, UsersRound } from 'lucide-react';
import { EventDTO } from '@uaetrail/shared-types';
import { AccountLinkList } from './AccountLinkList';
import { AccountSectionHeader } from './AccountSectionHeader';
import { AccountStat, AccountStatGrid } from './AccountStatGrid';

interface OrganizerHubSectionsProps {
  eventsCount: number;
  pendingJoinRequests: number;
  upcomingEventsCount: number;
  pastEventsCount: number;
  upcomingEvents: EventDTO[];
}

export const buildOrganizerStats = ({
  eventsCount,
  pendingJoinRequests,
  upcomingEventsCount,
  pastEventsCount,
}: Omit<OrganizerHubSectionsProps, 'upcomingEvents'>): AccountStat[] => [
  { label: 'Events', value: eventsCount, to: '/organizer/events' },
  {
    label: 'Pending',
    value: pendingJoinRequests,
    to: '/organizer/requests',
    highlight: pendingJoinRequests > 0,
    tone: 'amber',
  },
  {
    label: 'Upcoming',
    value: upcomingEventsCount,
    to: '/organizer/events',
    highlight: upcomingEventsCount > 0,
  },
  { label: 'History', value: pastEventsCount, to: '/organizer/history' },
];

export const OrganizerHubSections = ({
  eventsCount,
  pendingJoinRequests,
  upcomingEventsCount,
  pastEventsCount,
  upcomingEvents,
}: OrganizerHubSectionsProps) => {
  const stats = buildOrganizerStats({
    eventsCount,
    pendingJoinRequests,
    upcomingEventsCount,
    pastEventsCount,
  });

  const previewEvents = upcomingEvents.slice(0, 2);

  return (
    <>
      <AccountStatGrid stats={stats} />

      {previewEvents.length > 0 && (
        <section>
          <AccountSectionHeader title="Up next" actionTo="/organizer/events" actionLabel="All events" />
          <div className="space-y-2">
            {previewEvents.map((evt) => (
              <Link
                key={evt.id}
                to="/organizer/events"
                className="glass-card-interactive flex items-center gap-3 p-3.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {evt.title || evt.locationName}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {new Date(evt.date).toLocaleDateString(undefined, {
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
            to: '/organizer/profile',
            icon: <UserCircle className="w-4 h-4" />,
            label: 'Organizer profile',
            accent: 'emerald',
          },
          {
            to: '/organizer/events/new',
            icon: <Plus className="w-4 h-4" />,
            label: 'Create event',
          },
          {
            to: '/organizer/requests',
            icon: <Users className="w-4 h-4" />,
            label: 'Join requests',
            badge: pendingJoinRequests || undefined,
            accent: 'amber',
          },
          {
            to: '/organizer/locations',
            icon: <MapPin className="w-4 h-4" />,
            label: 'Locations',
            accent: 'blue',
          },
          {
            to: '/organizer/team',
            icon: <UsersRound className="w-4 h-4" />,
            label: 'Manage team',
          },
        ]}
      />
    </>
  );
};
