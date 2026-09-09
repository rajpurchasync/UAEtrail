import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { MyActivityDTO } from '@uaetrail/shared-types';
import { api, ActivityRequestView } from '../../api/services';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import { GlassCard } from '../../components/mobile/GlassCard';
import { ActivityHubListRow } from '../../components/mobile/ActivityHubListRow';
import { formatActivityType } from '../../utils/activityIdentity';
import {
  attendedTrips,
  cancelledRequests,
  parseJoinedSubTab,
  rejectedRequests,
  requestRecordMeta,
  upcomingConfirmedTrips,
  upcomingOpenRequests,
  type JoinedSubTab,
} from '../../utils/activityHubSections';
import { requestStatusLabel } from '../../utils/joinRequestUi';
import { getRequestEventDate } from '../../utils/tripDates';

const requestStatusStyle: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700',
  waitlisted: 'bg-sky-500/15 text-sky-700',
  approved: 'bg-emerald-500/15 text-emerald-700',
  rejected: 'bg-red-500/15 text-red-600',
  cancelled: 'bg-neutral-500/10 text-neutral-500',
};

const formatTripMeta = (trip: MyActivityDTO) => {
  const parts = [formatActivityType(trip.activityType), trip.date];
  if (trip.time) parts.push(trip.time);
  return parts.filter(Boolean).join(' · ');
};

export const JoinedSection = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const subTab = parseJoinedSubTab(searchParams.get('sub'));
  const [trips, setTrips] = useState<MyActivityDTO[]>([]);
  const [requests, setRequests] = useState<ActivityRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSubTab = (key: JoinedSubTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'joined');
    if (key === 'upcoming') next.delete('sub');
    else next.set('sub', key);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getMeActivities(), api.getMeRequests()])
      .then(([tripsRes, requestsRes]) => {
        setTrips(tripsRes.data);
        setRequests(requestsRes.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn\'t load your trips — try again.'))
      .finally(() => setLoading(false));
  }, []);

  const upcomingTrips = useMemo(() => upcomingConfirmedTrips(trips), [trips]);
  const attended = useMemo(() => attendedTrips(trips), [trips]);
  const openRequests = useMemo(() => upcomingOpenRequests(trips, requests), [trips, requests]);
  const cancelled = useMemo(() => cancelledRequests(requests), [requests]);
  const rejected = useMemo(() => rejectedRequests(requests), [requests]);

  type UpcomingRow =
    | { kind: 'confirmed'; date: string; trip: MyActivityDTO }
    | { kind: 'requested'; date: string; request: ActivityRequestView };

  const upcomingRows = useMemo<UpcomingRow[]>(() => {
    const rows: UpcomingRow[] = [
      ...upcomingTrips.map((trip) => ({ kind: 'confirmed' as const, date: trip.date, trip })),
      ...openRequests.map((request) => ({
        kind: 'requested' as const,
        date: getRequestEventDate(request),
        request,
      })),
    ];
    return rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [openRequests, upcomingTrips]);

  const segments = [
    { key: 'upcoming' as const, label: `Upcoming (${upcomingRows.length})` },
    { key: 'attended' as const, label: `Attended (${attended.length})` },
    { key: 'cancelled' as const, label: `Cancelled (${cancelled.length})` },
    { key: 'rejected' as const, label: `Not this time (${rejected.length})` },
  ];

  return (
    <div className="space-y-3">
      {error && (
        <GlassCard padding className="border-red-200/50 bg-red-50/50">
          <p className="text-sm text-red-600">{error}</p>
        </GlassCard>
      )}

      <AppSegmented segments={segments} value={subTab} onChange={setSubTab} />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subTab === 'upcoming' ? (
        upcomingRows.length === 0 ? (
          <GlassCard padding>
            <p className="text-sm text-neutral-600">Nothing on your calendar yet — find a trip on the map.</p>
            <Link to="/" className="mt-2 inline-block text-sm font-semibold text-emerald-700">
              Explore the map
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
                  badge={
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">
                      Joined
                    </span>
                  }
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
                      {requestStatusLabel(row.request.status)}
                    </span>
                  }
                  onClick={() => navigate(`/activity/${row.request.activity.id}`)}
                />
              )
            )}
          </div>
        )
      ) : subTab === 'attended' ? (
        attended.length === 0 ? (
          <GlassCard padding>
            <p className="text-sm text-neutral-600">
              Trips you attended appear here after your host checks you in.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {attended.map((trip) => (
              <ActivityHubListRow
                key={trip.id}
                title={trip.title || trip.locationName}
                meta={formatTripMeta(trip)}
                badge={
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700">
                    Attended
                  </span>
                }
                onClick={() => navigate(`/activity/${trip.id}`)}
              />
            ))}
          </div>
        )
      ) : subTab === 'cancelled' ? (
        cancelled.length === 0 ? (
          <GlassCard padding>
            <p className="text-sm text-neutral-600">No cancelled requests here.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {cancelled.map((request) => (
              <ActivityHubListRow
                key={request.id}
                title={request.activity.title || request.activity.locationName}
                meta={requestRecordMeta(request) ?? getRequestEventDate(request)}
                badge={
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-500/10 text-neutral-600">
                    Cancelled
                  </span>
                }
                onClick={() => navigate(`/my-requests/${request.id}`)}
              />
            ))}
          </div>
        )
      ) : rejected.length === 0 ? (
        <GlassCard padding>
          <p className="text-sm text-neutral-600">No declined requests — you&apos;re all clear.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {rejected.map((request) => (
            <ActivityHubListRow
              key={request.id}
              title={request.activity.title || request.activity.locationName}
              meta={requestRecordMeta(request) ?? getRequestEventDate(request)}
              badge={
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600">
                  Not this time
                </span>
              }
              onClick={() => navigate(`/my-requests/${request.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
