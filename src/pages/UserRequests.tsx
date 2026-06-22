import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, EventRequestView } from '../api/services';
import { MobileScreen } from '../components/layout/MobileScreen';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

export const UserRequests = () => {
  const [requests, setRequests] = useState<EventRequestView[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getMeRequests()
      .then((response) => setRequests(response.data))
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load requests');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter ? requests.filter((r) => r.status === statusFilter) : requests;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <MobileScreen title="Join Requests" backTo="/profile">
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ios-input w-auto py-2 text-[15px]"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <Link
              key={request.id}
              to={`/my-requests/${request.id}`}
              className="glass-card-interactive block p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">
                    {request.event.title || request.event.locationName}
                  </p>
                  <p className="text-sm text-neutral-500">{request.event.locationName}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusBadge(request.status)}`}
                >
                  {request.status}
                </span>
              </div>
              <div className="text-sm text-neutral-600 space-y-1">
                <p>
                  {request.event.date} · {request.event.time}
                </p>
                {request.event.organizerName && <p>Organizer: {request.event.organizerName}</p>}
                {request.note && <p className="text-neutral-500 line-clamp-2">{request.note}</p>}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-neutral-500 py-12">No requests found</p>
          )}
        </div>
      )}
    </MobileScreen>
  );
};
