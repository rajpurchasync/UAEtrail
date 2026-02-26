import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, AdminMetrics, OrganizerApplication } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { EventDTO } from '@uaetrail/shared-types';
import { ADMIN_LINKS } from '../constants';

export const AdminOverview = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventDTO[]>([]);
  const [recentApps, setRecentApps] = useState<OrganizerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getAdminMetrics(),
      api.getAdminEvents(),
      api.getAdminApplications()
    ])
      .then(([metricsRes, eventsRes, appsRes]) => {
        setMetrics(metricsRes.data);
        setRecentEvents(eventsRes.data.slice(0, 5));
        setRecentApps(appsRes.data.filter((a) => a.status === 'pending').slice(0, 5));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load metrics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const metricCards = [
    { label: 'Total Users', value: metrics?.totalUsers ?? '-', color: 'bg-blue-50 text-blue-700', link: '/admin/users' },
    { label: 'Active Users', value: metrics?.activeUsers ?? '-', color: 'bg-cyan-50 text-cyan-700', link: '/admin/users' },
    { label: 'Active Tenants', value: metrics?.tenants ?? '-', color: 'bg-purple-50 text-purple-700', link: '/admin/organizers' },
    { label: 'Locations', value: metrics?.totalLocations ?? '-', color: 'bg-teal-50 text-teal-700', link: '/admin/locations' },
    { label: 'Total Events', value: metrics?.events ?? '-', color: 'bg-emerald-50 text-emerald-700', link: '/admin/events' },
    { label: 'Participants', value: metrics?.totalParticipants ?? '-', color: 'bg-indigo-50 text-indigo-700', link: null },
    { label: 'Pending Apps', value: metrics?.pendingApplications ?? '-', color: 'bg-amber-50 text-amber-700', link: '/admin/organizers' },
    { label: 'Pending Requests', value: metrics?.pendingRequests ?? '-', color: 'bg-orange-50 text-orange-700', link: null }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg p-4 bg-gray-100 animate-pulse h-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-100 animate-pulse rounded-lg h-64" />
          <div className="bg-gray-100 animate-pulse rounded-lg h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Header with refresh */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Platform Overview</h2>
        <button onClick={loadData} className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-gray-600 flex items-center gap-1.5">
          ↻ Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
