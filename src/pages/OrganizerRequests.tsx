import { useEffect, useState } from 'react';
import { api, EventRequestView } from '../api/services';
import { getActiveTenantId } from '../api/tenant';
import { DashboardLayout } from '../components/layout';
import { TenantSwitcher } from '../components/ui';

const organizerLinks = [
  { to: '/organizer/overview', label: 'Overview' },
  { to: '/organizer/events', label: 'Events' },
  { to: '/organizer/requests', label: 'Join Requests' },
  { to: '/organizer/team', label: 'Team' },
  { to: '/organizer/profile', label: 'Profile' }
];

export const OrganizerRequests = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [requests, setRequests] = useState<EventRequestView[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async (activeTenantId: string) => {
    if (!activeTenantId) return;
    try {
      const response = await api.getOrganizerRequests(activeTenantId);
      setRequests(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load requests');
    }
  };

  useEffect(() => {
    loadRequests(tenantId);
  }, [tenantId]);

  const decide = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!tenantId) return;
    try {
      await api.decideOrganizerRequest(tenantId, requestId, status);
      await loadRequests(tenantId);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Failed to process request');
    }
  };

  return (
    <DashboardLayout title="Organizer Dashboard" links={organizerLinks}>
      <div className="space-y-4">
        <TenantSwitcher onChange={setTenantId} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{request.user?.displayName ?? '-'}</p>
                    <p className="text-xs text-gray-500">{request.user?.email ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">{request.event.locationName}</td>
                  <td className="px-4 py-3 capitalize">{request.status}</td>
                  <td className="px-4 py-3">
                    {request.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          onClick={() => decide(request.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          className="px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
                          onClick={() => decide(request.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500">Finalized</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};
