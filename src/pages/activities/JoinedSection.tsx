import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ActivityDTO } from '@uaetrail/shared-types';
import { api, ActivityRequestView } from '../../api/services';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import { GlassCard } from '../../components/mobile/GlassCard';
import { ActivityHubListRow } from '../../components/mobile/ActivityHubListRow';
import { getRequestEventDate, isUpcomingTrip, pendingUpcomingRequests } from '../../utils/tripDates';
import { formatActivityType } from '../../utils/activityIdentity';

const requestStatusStyle: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700',
  approved: 'bg-emerald-500/15 text-emerald-700',
  rejected: 'bg-red-500/15 text-red-600',
  cancelled: 'bg-neutral-500/10 text-neutral-500',
};

export const JoinedSection = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [trips, setTrips] = useState<ActivityDTO[]>([]);
  const [requests, setRequests] = useState<ActivityRequestView[]>([]);
  const subTab = searchParams.get('sub') === 'past' ? 'past' : 'upcoming';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSubTab = (key: 'upcoming' | 'past') => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'joined');
    if (key === 'past') next.set('sub', 'past');
    else next.delete('sub');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getMeActivities(), api.getMeRequests()])
      .then(([tripsRes, requestsRes]) => {
        setTrips(tripsRes.data);
        setRequests(requestsRes.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trips'))
      .finally(() => setLoading(false));
  }, []);

  const upcomingConfirmed = useMemo(() => trips.filter(isUpcomingTrip), [trips]);
  const past = useMemo(() => trips.filter((trip) => !isUpcomingTrip(trip)), [trips]);
  const requestedUpcoming = useMemo(
    () => pendingUpcomingRequests(trips, requests),
    [trips, requests]
  );

  type UpcomingRow =
    | { kind: 'confirmed'; date: string; trip: ActivityDTO }
    | { kind: 'requested'; date: string; request: ActivityRequestView };

  const upcomingRows = useMemo<UpcomingRow[]>(() => {
    const rows: UpcomingRow[] = [
      ...upcomingConfirmed.map((trip) => ({ kind: 'confirmed' as const, date: trip.date, trip })),
      ...requestedUpcoming.map((request) => ({
        kind: 'requested' as const,
        date: getRequestEventDate(request),
        request,
      })),
    ];
    return rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [upcomingConfirmed, requestedUpcoming]);

  const formatTripMeta = (trip: ActivityDTO) => {
    const parts = [formatActivityType(trip.activityType), trip.date];
    if (trip.time) parts.push(trip.time);
    return parts.filter(Boolean).join(' · ');
  };

  return (
    <div className="space-y-3">
      {error && (
        <GlassCard padding className="border-red-200/50 bg-red-50/50">
          <p className="text-sm text-red-600">{error}</p>
        </GlassCard>
      )}

      <AppSegmented
        segments={[
          { key: 'upcoming', label: `Upcoming (${upcomingRows.length})` },
          { key: 'past', label: `Past (${past.length})` },
        ]}
        value={subTab}
        onChange={setSubTab}
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subTab === 'past' ? (
        past.length === 0 ? (
          <GlassCard padding>
            <p className="text-sm text-neutral-600">No past trips yet.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {past.map((trip) => (
              <ActivityHubListRow
                key={trip.id}
                title={trip.title || trip.locationName}
                meta={formatTripMeta(trip)}
                badge={<span className="text-[11px] font-semibold text-neutral-500">Done</span>}
                onClick={() => navigate(`/activity/${trip.id}`)}
              />
            ))}
          </div>
        )
      ) : upcomingRows.length === 0 ? (
        <GlassCard padding>
          <p className="text-sm text-neutral-600">No upcoming joined trips or requests.</p>
          <Link to="/activities?tab=explore" className="mt-2 inline-block text-sm font-semibold text-emerald-700">
            Explore activities
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {upcomingRows.map((row) =>
            row.kind === 'confirmed' ? (
              <ActivityHubListRow
                key={row.trip.id}
                title={row.trip.title || row.trip.locationName}
                meta={formatTripMeta(row.trip)}
                badge={<span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">Joined</span>}
                onClick={() => navigate(`/activity/${row.trip.id}`)}
              />
            ) : (
              <ActivityHubListRow
                key={row.request.id}
                title={row.request.activity.title || row.request.activity.locationName}
                meta={[row.date, row.request.activity.time].filter(Boolean).join(' · ')}
                badge={
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                      requestStatusStyle[row.request.status] ?? requestStatusStyle.pending
                    }`}
                  >
                    {row.request.status}
                  </span>
                }
                onClick={() => navigate(`/my-requests/${row.request.id}`)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};
