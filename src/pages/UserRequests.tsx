import { useEffect, useState } from 'react';
import { api, EventRequestView } from '../api/services';
import { DashboardLayout } from '../components/layout';

const userLinks = [
  { to: '/dashboard/overview', label: 'Overview' },
  { to: '/dashboard/requests', label: 'Join Requests' },
  { to: '/dashboard/trips', label: 'My Trips' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/profile', label: 'Profile' }
];

export const UserRequests = () => {
  const [requests, setRequests] = useState<EventRequestView[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const response = await api.getMeRequests();
      setRequests(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load requests');
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const cancel = async (request: EventRequestView) => {
    try {
      await api.cancelJoinRequest(request.event.id, request.id);
      await loadRequests();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Failed to cancel request');
    }
  };

  return (
    <DashboardLayout title="User Dashboard" links={userLinks}>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Event</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-t">
                <td className="px-4 py-3">{request.event.locationName}</td>
                <td className="px-4 py-3">
                  {request.event.date} {request.event.time}
                </td>
                <td className="px-4 py-3 capitalize">{request.status}</td>
                <td className="px-4 py-3">
                  {['pending', 'approved'].includes(request.status) ? (
                    <button
                      className="px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                      onClick={() => cancel(request)}
                    >
                      Cancel
                    </button>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};
