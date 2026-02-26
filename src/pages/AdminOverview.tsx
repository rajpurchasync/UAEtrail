import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, AdminMetrics, OrganizerApplication } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { EventDTO } from '@uaetrail/shared-types';

const adminLinks = [
  { to: '/admin/overview', label: 'Overview' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/organizers', label: 'Organizer Approvals' },
  { to: '/admin/events', label: 'Event Moderation' }
];

export const AdminOverview = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventDTO[]>([]);
  const [recentApps, setRecentApps] = useState<OrganizerApplication[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getAdminMetrics(),
      api.getAdminEvents(),
      api.getAdminApplications(),
      api.getAdminUsers({ pageSize: 1 })
    ])
      .then(([metricsRes, eventsRes, appsRes, usersRes]) => {
        setMetrics(metricsRes.data);
        setRecentEvents(eventsRes.data.slice(0, 5));
        setRecentApps(appsRes.data.filter((a) => a.status === 'pending').slice(0, 5));
        setUserCount(usersRes.pagination?.total ?? 0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load metrics'));
  }, []);

  const metricCards = [
    { label: 'Total Users', value: userCount, color: 'bg-blue-50 text-blue-700', link: '/admin/users' },
    { label: 'Active Tenants', value: metrics?.tenants ?? '-', color: 'bg-purple-50 text-purple-700', link: '/admin/organizers' },
    { label: 'Total Events', value: metrics?.events ?? '-', color: 'bg-emerald-50 text-emerald-700', link: '/admin/events' },
    { label: 'Pending Applications', value: metrics?.pendingApplications ?? '-', color: 'bg-amber-50 text-amber-700', link: '/admin/organizers' },
    { label: 'Pending Requests', value: metrics?.pendingRequests ?? '-', color: 'bg-orange-50 text-orange-700', link: null }
  ];

  return (
    <DashboardLayout title="Admin Dashboard" links={adminLinks}>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {metricCards.map((card) => (
          <div key={card.label} className={`rounded-lg p-4 ${card.color}`}>
            <p className="text-xs font-medium opacity-80">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
            {card.link && (
              <Link to={card.link} className="text-xs underline opacity-70 hover:opacity-100 mt-1 inline-block">View →</Link>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="bg-white border rounded-lg">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Events</h3>
            <Link to="/admin/events" className="text-xs text-emerald-600 hover:text-emerald-700">View All</Link>
          </div>
          <div className="divide-y">
            {recentEvents.map((e) => (
              <div key={e.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.locationName}</p>
                  <p className="text-xs text-gray-500">{e.organizerName} · {e.date}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  e.status === 'published' ? 'bg-green-100 text-green-800' :
                  e.status === 'suspended' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-700'
                }`}>{e.status}</span>
              </div>
            ))}
            {recentEvents.length === 0 && <p className="px-4 py-6 text-sm text-gray-500 text-center">No events yet</p>}
          </div>
        </div>

        {/* Pending Applications */}
        <div className="bg-white border rounded-lg">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Pending Applications</h3>
            <Link to="/admin/organizers" className="text-xs text-emerald-600 hover:text-emerald-700">View All</Link>
          </div>
          <div className="divide-y">
            {recentApps.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.applicantName}</p>
                  <p className="text-xs text-gray-500">{a.requestedName} ({a.requestedType})</p>
                </div>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-medium">Pending</span>
              </div>
            ))}
            {recentApps.length === 0 && <p className="px-4 py-6 text-sm text-gray-500 text-center">No pending applications</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
