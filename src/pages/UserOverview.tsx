import { useEffect, useState } from 'react';
import { Clock, MessageSquare, Bell as BellIcon, CheckCircle2, Calendar, ChevronRight } from 'lucide-react';
import { EventDTO, NotificationDTO, ChatConversationDTO } from '@uaetrail/shared-types';
import { Link } from 'react-router-dom';
import { api, EventRequestView } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { ReviewPromptBanner } from '../components/ui/ReviewPromptBanner';

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
      <ReviewPromptBanner />
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Link to="/dashboard/requests" className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-lg hover:border-gray-200 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{pendingRequests}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">Pending Requests</p>
          <p className="text-xs text-gray-400 mt-0.5">{requests.length} total</p>
        </Link>
        <Link to="/dashboard/trips" className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-lg hover:border-gray-200 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{trips.length}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">Approved Trips</p>
        </Link>
        <Link to="/dashboard/messages" className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-lg hover:border-gray-200 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{unreadMessages}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">Unread Messages</p>
        </Link>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <BellIcon className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600">{unreadNotifs}</p>
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">Notifications</p>
          <p className="text-[11px] text-gray-400 mt-0.5">unread</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Upcoming Trips */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-gray-900">Upcoming Trips</h3>
            </div>
            <Link to="/dashboard/trips" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-0.5 group">
              View All <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingTrips.map((trip) => (
              <div key={trip.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{trip.locationName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">{trip.date}</span>
                      <span className="text-[11px] text-gray-400">{trip.time}</span>
                    </div>
                  </div>
                  <Link to={`/trip/${trip.id}`} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium shrink-0">View →</Link>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">by {trip.organizerName}</p>
              </div>
            ))}
            {upcomingTrips.length === 0 && (
              <div className="px-5 py-8 text-center">
                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-2">No upcoming trips</p>
                <Link to="/trips" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1">
                  Browse Events <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Latest Notifications */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <BellIcon className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-sm text-gray-900">Latest Notifications</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <div key={notif.id} className={`px-5 py-3.5 transition-colors ${!notif.isRead ? 'bg-blue-50/40' : 'hover:bg-gray-50/50'}`}>
                <div className="flex items-start gap-2.5">
                  {!notif.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="px-5 py-8 text-center">
                <BellIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
