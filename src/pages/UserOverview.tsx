import { useEffect, useState } from 'react';
import { EventDTO, NotificationDTO, ChatConversationDTO } from '@uaetrail/shared-types';
import { Link } from 'react-router-dom';
import { api, EventRequestView } from '../api/services';
import { DashboardLayout } from '../components/layout';

const userLinks = [
  { to: '/dashboard/overview', label: 'Overview' },
  { to: '/dashboard/requests', label: 'Join Requests' },
  { to: '/dashboard/trips', label: 'My Trips' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/profile', label: 'Profile' }
];

export const UserOverview = () => {
  const [requests, setRequests] = useState<EventRequestView[]>([]);
  const [trips, setTrips] = useState<EventDTO[]>([]);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getMeRequests(),
      api.getMeTrips(),
      api.getMeNotifications(),
      api.getConversations().catch(() => ({ data: [] as ChatConversationDTO[] }))
    ])
      .then(([reqRes, tripsRes, notifRes, chatRes]) => {
        setRequests(reqRes.data);
        setTrips(tripsRes.data);
        setNotifications(notifRes.data.slice(0, 5));
        setUnreadMessages(chatRes.data.reduce((sum: number, c: ChatConversationDTO) => sum + (c.unreadCount || 0), 0));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'));
  }, []);

  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const upcomingTrips = trips.slice(0, 3);
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  return (
    <DashboardLayout title="User Dashboard" links={userLinks}>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link to="/dashboard/requests" className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <p className="text-xs font-medium text-gray-500">Pending Requests</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingRequests}</p>
          <p className="text-xs text-gray-400 mt-1">{requests.length} total</p>
        </Link>
        <Link to="/dashboard/trips" className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <p className="text-xs font-medium text-gray-500">Approved Trips</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{trips.length}</p>
        </Link>
        <Link to="/dashboard/messages" className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <p className="text-xs font-medium text-gray-500">Unread Messages</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{unreadMessages}</p>
        </Link>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500">Notifications</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{unreadNotifs}</p>
          <p className="text-xs text-gray-400 mt-1">unread</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Trips */}
        <div className="bg-white border rounded-lg">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Upcoming Trips</h3>
            <Link to="/dashboard/trips" className="text-xs text-emerald-600 hover:text-emerald-700">View All</Link>
          </div>
          <div className="divide-y">
            {upcomingTrips.map((trip) => (
              <div key={trip.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{trip.locationName}</p>
                    <p className="text-xs text-gray-500">{trip.date} at {trip.time}</p>
                  </div>
                  <Link to={`/trip/${trip.id}`} className="text-xs text-emerald-600 hover:text-emerald-700">View →</Link>
                </div>
                <p className="text-xs text-gray-500 mt-1">Organized by {trip.organizerName}</p>
              </div>
            ))}
            {upcomingTrips.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-500 mb-2">No upcoming trips</p>
                <Link to="/calendar" className="text-sm text-emerald-600 hover:text-emerald-700">Browse Events →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Latest Notifications */}
        <div className="bg-white border rounded-lg">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Latest Notifications</h3>
          </div>
          <div className="divide-y">
            {notifications.map((notif) => (
              <div key={notif.id} className={`px-4 py-3 ${!notif.isRead ? 'bg-blue-50/50' : ''}`}>
                <div className="flex items-start gap-2">
                  {!notif.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{notif.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications yet</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
