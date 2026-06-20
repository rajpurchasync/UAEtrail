import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, Users, Plus, MapPin, ArrowRight } from 'lucide-react';
import { EventDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { getActiveTenantId } from '../api/tenant';
import { DashboardLayout } from '../components/layout';
import { TenantSwitcher } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const organizerLinks = [
  { to: '/organizer/overview', label: 'Overview' },
  { to: '/organizer/events', label: 'Events' },
  { to: '/organizer/requests', label: 'Join Requests' },
  { to: '/organizer/team', label: 'Team' },
  { to: '/organizer/locations', label: 'Locations' },
  { to: '/organizer/messages', label: 'Messages' },
  { to: '/organizer/history', label: 'History' },
  { to: '/organizer/profile', label: 'Profile' }
];

export const OrganizerOverview = () => {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    Promise.all([api.getOrganizerEvents(tenantId), api.getOrganizerRequests(tenantId)])
      .then(([eventsResponse, requestsResponse]) => {
        setEvents(eventsResponse.data);
        setPendingRequests(requestsResponse.data.filter((request) => request.status === 'pending').length);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load organizer data'));
  }, [tenantId]);

  const publishedCount = useMemo(() => events.filter((item) => item.status === 'published').length, [events]);
  const upcomingEvents = useMemo(() =>
    events
      .filter((e) => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3),
    [events]
  );

  return (
    <DashboardLayout title="Organizer Dashboard" links={organizerLinks}>
      <div className="space-y-6">
        {/* Welcome + Tenant Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Welcome{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! 👋
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Here's your organizer overview</p>
          </div>
          <TenantSwitcher onChange={(value) => setTenantId(value)} />
        </div>

        {!tenantId && <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-3">Set your tenant ID to load organizer data.</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 flex items-start gap-3 hover:shadow-lg hover:border-gray-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Events</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{events.length}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 flex items-start gap-3 hover:shadow-lg hover:border-gray-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Published</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{publishedCount}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 flex items-start gap-3 hover:shadow-lg hover:border-gray-200 transition-all col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{pendingRequests}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/organizer/events" className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all text-center group">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Create Event</span>
          </Link>
          <Link to="/organizer/requests" className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all text-center group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Manage Requests</span>
          </Link>
          <Link to="/organizer/locations" className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all text-center group">
            <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Locations</span>
          </Link>
          <Link to="/organizer/profile" className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all text-center group">
            <div className="w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Edit Profile</span>
          </Link>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Events</h3>
              <Link to="/organizer/events" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">View all →</Link>
            </div>
            <div className="space-y-2">
              {upcomingEvents.map((evt) => (
                <div key={evt.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-all">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{evt.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(evt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {evt.time ? ` at ${evt.time}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-3 ${
                    evt.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {evt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
