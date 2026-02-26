import { useEffect, useState } from 'react';
import { api, AdminMetrics } from '../api/services';
import { DashboardLayout } from '../components/layout';

const adminLinks = [
  { to: '/admin/overview', label: 'Overview' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/organizers', label: 'Organizer Approvals' },
  { to: '/admin/events', label: 'Event Moderation' }
];

export const AdminOverview = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAdminMetrics()
      .then((response) => setMetrics(response.data))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load metrics'));
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard" links={adminLinks}>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Active Tenants</p>
          <p className="text-2xl font-semibold text-gray-900">{metrics?.tenants ?? '-'}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Events</p>
          <p className="text-2xl font-semibold text-gray-900">{metrics?.events ?? '-'}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Pending Applications</p>
          <p className="text-2xl font-semibold text-gray-900">{metrics?.pendingApplications ?? '-'}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Pending Requests</p>
          <p className="text-2xl font-semibold text-gray-900">{metrics?.pendingRequests ?? '-'}</p>
        </div>
      </div>
    </DashboardLayout>
  );
};
