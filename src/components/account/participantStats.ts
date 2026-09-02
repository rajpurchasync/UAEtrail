import { AccountStat } from './AccountStatGrid';

interface ParticipantStatsInput {
  upcomingTripsCount: number;
  pendingRequestsCount: number;
  unreadMessages: number;
  unreadNotifications: number;
  messagesPath: string;
}

/** Four primary hub metrics — detail lives in activity previews & destination pages. */
export const buildParticipantStats = ({
  upcomingTripsCount,
  pendingRequestsCount,
  unreadMessages,
  unreadNotifications,
  messagesPath,
}: ParticipantStatsInput): AccountStat[] => [
  {
    label: 'Activities',
    value: upcomingTripsCount,
    to: '/activities?tab=mine',
    highlight: upcomingTripsCount > 0,
  },
  {
    label: 'Requests',
    value: pendingRequestsCount,
    to: '/my-requests',
    highlight: pendingRequestsCount > 0,
    tone: 'amber',
  },
  {
    label: 'Messages',
    value: unreadMessages,
    to: messagesPath,
    highlight: unreadMessages > 0,
  },
  {
    label: 'Alerts',
    value: unreadNotifications,
    to: '/notifications',
    highlight: unreadNotifications > 0,
  },
];
