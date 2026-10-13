import { useState } from 'react';
import { useSafeAsyncEffect } from '../hooks/useSafeAsyncEffect';
import { Link } from 'react-router-dom';
import type { AdminMetrics, AuditLogEntry, HostApplication } from '../api/types';
import {
  fetchAdminAuditLogs,
  fetchAdminMetrics,
  fetchAdminModerationActivities,
  fetchAdminOrganisationApplications,
} from '../hooks/adminConsoleApi';
import { DashboardLayout } from '../components/layout';
import { ActivityDTO } from '@uaetrail/shared-types';
import {
  ADMIN_ACTIVITIES_PATH,
  ADMIN_AUDIT_LOG_PATH,
  ADMIN_HOSTS_PATH,
  ADMIN_LINKS,
  ADMIN_USERS_PATH,
} from '../config/routingCatalog';
import { resolveActivityOwnerLabel, formatActivityType } from '../utils/activityIdentity';

export const AdminOverview = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<ActivityDTO[]>([]);
  const [recentApps, setRecentApps] = useState<HostApplication[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setError(null);
    try {
      const [metrics, events, apps, auditRes] = await Promise.all([
        fetchAdminMetrics(),
        fetchAdminModerationActivities(),
        fetchAdminOrganisationApplications(),
        fetchAdminAuditLogs({ pageSize: 10 }).catch(() => ({ data: [] as AuditLogEntry[] })),
      ]);
      if (!isActive()) return;
      setMetrics(metrics);
      setRecentEvents(
        [...events].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)).slice(0, 5)
      );
      setRecentApps(apps.filter((a) => a.status === 'pending').slice(0, 5));
      setAuditLogs(auditRes.data.slice(0, 10));
    } catch (err) {
      if (!isActive()) return;
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      if (isActive()) setLoading(false);
    }
  };

  useSafeAsyncEffect((isActive) => loadData(isActive), []);

  const metricCards = [
    { label: 'Pending host applications', value: metrics?.pendingApplications ?? '-', color: 'bg-amber-50 text-amber-800', icon: '📝', link: ADMIN_HOSTS_PATH },
    { label: 'Total places', value: metrics?.totalLocations ?? '-', color: 'bg-teal-50 text-teal-700', icon: '📍' },
    { label: 'Manage users', value: metrics?.totalUsers ?? '-', color: 'bg-blue-50 text-blue-700', icon: '👥', link: ADMIN_USERS_PATH },
    { label: 'Active activities', value: metrics?.activeActivities ?? '-', color: 'bg-emerald-50 text-emerald-700', icon: '🥾' }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg p-4 bg-gray-100 animate-pulse h-24" />
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
        <button onClick={() => void loadData()} className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-gray-600 flex items-center gap-1.5">
          ↻ Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {metricCards.map((card) => {
          const content = (
            <div className={`rounded-xl p-5 ${card.color} ${card.link ? 'hover:opacity-95 transition-opacity' : ''}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium opacity-80">{card.label}</p>
                <span className="text-xl">{card.icon}</span>
              </div>
              <p className="text-3xl font-bold mt-2">{card.value}</p>
            </div>
          );
          return card.link ? (
            <Link key={card.label} to={card.link}>
              {content}
            </Link>
          ) : (
            <div key={card.label}>{content}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="bg-white border rounded-lg">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Activities</h3>
            <Link to={ADMIN_ACTIVITIES_PATH} className="text-xs text-emerald-600 hover:text-emerald-700">View All</Link>
          </div>
          <div className="divide-y">
            {recentEvents.map((e) => (
              <div key={e.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.title || '—'}</p>
                  <p className="text-xs text-gray-500">
                    {formatActivityType(e.activityType)} · {e.locationName} · {resolveActivityOwnerLabel(e)}
                  </p>
                  <p className="text-xs text-gray-400">{e.date}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  e.status === 'published' ? 'bg-green-100 text-green-800' :
                  e.status === 'suspended' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-700'
                }`}>{e.status}</span>
              </div>
            ))}
            {recentEvents.length === 0 && <p className="px-4 py-6 text-sm text-gray-500 text-center">No activities yet</p>}
          </div>
        </div>

        {/* Pending Applications */}
        <div className="bg-white border rounded-lg">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Pending Applications</h3>
            <Link to={ADMIN_HOSTS_PATH} className="text-xs text-emerald-600 hover:text-emerald-700">View All</Link>
          </div>
          <div className="divide-y">
            {recentApps.map((a) => (
              <Link key={a.id} to={ADMIN_HOSTS_PATH} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.metadata?.hostDisplayName || a.applicantName}</p>
                  <p className="text-xs text-gray-500">{a.requestedName} ({a.requestedType})</p>
                </div>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-medium">Pending</span>
              </Link>
            ))}
            {recentApps.length === 0 && <p className="px-4 py-6 text-sm text-gray-500 text-center">No pending applications</p>}
          </div>
        </div>
      </div>

      {/* Recent Activity (Audit Log) */}
      <div className="bg-white border rounded-lg mt-6">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          <Link to={ADMIN_AUDIT_LOG_PATH} className="text-xs text-emerald-600 hover:text-emerald-700">View All</Link>
        </div>
        <div className="divide-y max-h-64 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                log.action.includes('create') || log.action.includes('approve') ? 'bg-green-500' :
                log.action.includes('delete') || log.action.includes('suspend') || log.action.includes('reject') ? 'bg-red-500' :
                'bg-blue-500'
              }`} />
              <div className="min-w-0 flex-1">
                <p className="text-gray-900 truncate">
                  <span className="font-medium">{log.actorName || log.actorEmail}</span>{' '}
                  <span className="text-gray-500">{log.action.replace(/_/g, ' ')}</span>{' '}
                  <span className="text-gray-700">{log.entityType}</span>
                </p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{new Date(log.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {auditLogs.length === 0 && <p className="px-4 py-6 text-sm text-gray-500 text-center">No recent activity</p>}
        </div>
      </div>
    </DashboardLayout>
  );
};
