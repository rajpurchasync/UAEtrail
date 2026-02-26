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

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500'
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

export const UserRequests = () => {
  const [requests, setRequests] = useState<EventRequestView[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelTarget, setCancelTarget] = useState<EventRequestView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const response = await api.getMeRequests();
      setRequests(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load requests');
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await api.cancelJoinRequest(cancelTarget.event.id, cancelTarget.id);
      setCancelTarget(null);
      await loadRequests();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Failed to cancel request');
    }
  };

  const filtered = statusFilter ? requests.filter((r) => r.status === statusFilter) : requests;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <DashboardLayout title="User Dashboard" links={userLinks}>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Join Requests</h2>
          {pendingCount > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Event</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Organizer</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Your Note</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((request) => (
              <tr key={request.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{(request.event as any).title || request.event.locationName}</p>
                  <p className="text-xs text-gray-500">{request.event.locationName}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{request.event.organizerName}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {request.event.date}<br />
                  <span className="text-xs text-gray-400">{request.event.time}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                  {request.note || <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(request.status)}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {['pending', 'approved'].includes(request.status) ? (
                    <button
                      className="text-xs px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => setCancelTarget(request)}
                    >
                      Cancel
                    </button>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">No requests found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCancelTarget(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Request?</h3>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to cancel your join request for:
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">
              {(cancelTarget.event as any).title || cancelTarget.event.locationName} — {cancelTarget.event.date}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Keep Request
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
