import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ActivityRequestView } from '../api/index';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { ConsumerErrorCard, ConsumerLoadingSpinner } from '../components/mobile/ConsumerFeedback';
import { PageMeta } from '../components/seo/PageMeta';
import { AppSelect } from '../components/ui/AppSelect';

import { requestStatusLabel } from '../utils/joinRequestUi';
import { activityHostName } from '../utils/hostLabels';

const REQUEST_STATUS_OPTIONS = [
  { value: 'pending' as const, label: 'Waiting for host' },
  { value: 'approved' as const, label: 'Confirmed' },
  { value: 'rejected' as const, label: 'Not this time' },
  { value: 'cancelled' as const, label: 'Cancelled' },
];

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
  const [requests, setRequests] = useState<ActivityRequestView[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getMeRequests()
      .then((response) => setRequests(response.data))
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Couldn\'t load your requests — try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter ? requests.filter((r) => r.status === statusFilter) : requests;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <ConsumerShell
      layout="stack"
      title="Join requests"
      maxWidth="4xl"
      showJourney={false}
      back={{ fallbackTo: '/profile', label: 'Profile' }}
    >
      <PageMeta title="Join requests" noIndex />

      <div className="space-y-3 pb-nav-safe animate-fade-up">
      {error ? <ConsumerErrorCard message={error} /> : null}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {pendingCount} waiting
            </span>
          )}
        </div>
        <AppSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={REQUEST_STATUS_OPTIONS}
          placeholder="All Statuses"
          className="w-auto min-w-[9rem]"
          aria-label="Filter by status"
        />
      </div>

      {loading ? (
        <ConsumerLoadingSpinner />
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
                    {request.activity.title || request.activity.locationName}
                  </p>
                  <p className="text-sm text-neutral-500">{request.activity.locationName}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusBadge(request.status)}`}
                >
                  {requestStatusLabel(request.status)}
                </span>
              </div>
              <div className="text-sm text-neutral-600 space-y-1">
                <p>
                  {request.activity.date} · {request.activity.time}
                </p>
                {activityHostName(request.activity) !== 'Host' && (
                  <p>Host: {activityHostName(request.activity)}</p>
                )}
                {request.note && <p className="text-neutral-500 line-clamp-2">{request.note}</p>}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-neutral-500 py-12">No activity requests yet — explore the map to find your next adventure.</p>
          )}
        </div>
      )}
      </div>
    </ConsumerShell>
  );
};
