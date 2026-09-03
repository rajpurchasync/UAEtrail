import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ActivityDTO } from '@uaetrail/shared-types';
import { api, ActivityRequestView } from '../../api/services';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import { ShareButton, HostMessageButton } from '../../components/ui';
import { organizerProfilePath } from '../../utils/organizerLinks';
import { daysUntil, getRequestEventDate, isUpcomingTrip, pendingUpcomingRequests } from '../../utils/tripDates';
import { showTenantBrand, tripHostName } from '../../utils/hostLabels';

export const MineSection = ({ onExplore }: { onExplore: () => void }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trips, setTrips] = useState<ActivityDTO[]>([]);
  const [requests, setRequests] = useState<ActivityRequestView[]>([]);
  const subTab = searchParams.get('sub') === 'past' ? 'past' : 'upcoming';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSubTab = (key: 'upcoming' | 'past') => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'mine');
    if (key === 'past') next.set('sub', 'past');
    else next.delete('sub');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getMeTrips(), api.getMeRequests()])
      .then(([tripsRes, requestsRes]) => {
        setTrips(tripsRes.data);
        setRequests(requestsRes.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trips'))
      .finally(() => setLoading(false));
  }, []);

  const upcomingConfirmed = useMemo(() => trips.filter(isUpcomingTrip), [trips]);
  const past = useMemo(() => trips.filter((t) => !isUpcomingTrip(t)), [trips]);
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

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-neutral-500 min-w-0">
          {subTab === 'upcoming'
            ? 'Requested and confirmed, not yet attended'
            : 'Trips you have completed'}
        </p>
        <AppSegmented
          segments={[
            { key: 'upcoming', label: `Upcoming (${upcomingRows.length})` },
            { key: 'past', label: `Past (${past.length})` },
          ]}
          value={subTab}
          onChange={setSubTab}
        />
      </div>

      {loading ? (
        <div className="glass-card p-8 text-center">
          <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
          <span className="text-sm text-neutral-500">Loading trips...</span>
        </div>
      ) : subTab === 'past' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {past.map((trip) => (
            <JoinedTripCard key={trip.id} trip={trip} variant="past" />
          ))}
          {past.length === 0 && (
            <div className="col-span-full glass-card p-8 text-center">
              <p className="text-sm text-neutral-500">No past trips yet</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {upcomingRows.map((row) =>
            row.kind === 'confirmed' ? (
              <JoinedTripCard key={row.trip.id} trip={row.trip} variant="confirmed" />
            ) : (
              <JoinedRequestCard key={row.request.id} request={row.request} />
            )
          )}
          {upcomingRows.length === 0 && (
            <div className="col-span-full glass-card p-8 text-center">
              <p className="text-sm text-neutral-500 mb-2">No upcoming trips or requests</p>
              <button
                type="button"
                onClick={onExplore}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold min-h-[44px] px-2"
              >
                Explore organized trips →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const JoinedTripCard = ({ trip, variant }: { trip: ActivityDTO; variant: 'confirmed' | 'past' }) => {
  const upcoming = isUpcomingTrip(trip);
  return (
    <Link to={`/activity/${trip.id}`} className="glass-card-interactive block p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate">{trip.title || trip.locationName}</h3>
          {trip.title && <p className="text-xs text-neutral-500 truncate">{trip.locationName}</p>}
          <p className="text-sm text-neutral-600 mt-1">
            {trip.date}
            {trip.time ? ` · ${trip.time}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <ShareButton
            title={trip.title || trip.locationName}
            text={`${trip.date} · ${trip.activityType} trip on UAE Trails`}
            path={`/activity/${trip.id}`}
            iconOnly
            light
          />
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
              trip.activityType === 'hiking'
                ? 'bg-emerald-500/12 text-emerald-700'
                : 'bg-amber-500/12 text-amber-700'
            }`}
          >
            {trip.activityType}
          </span>
          {upcoming && (
            <span className="text-xs text-emerald-600 font-medium">{daysUntil(trip.date)}</span>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        {tripHostName(trip) && (
          <div className="flex items-center gap-2 min-w-0">
            {organizerProfilePath(trip.tenantSlug) ? (
              <Link
                to={organizerProfilePath(trip.tenantSlug)!}
                className="hover:text-emerald-700 font-medium transition-colors truncate"
                onClick={(e) => e.stopPropagation()}
              >
                Hosted by {tripHostName(trip)}
                {showTenantBrand(trip) && trip.tenantName ? ` · ${trip.tenantName}` : ''}
              </Link>
            ) : (
              <span className="truncate">
                Hosted by {tripHostName(trip)}
                {showTenantBrand(trip) && trip.tenantName ? ` · ${trip.tenantName}` : ''}
              </span>
            )}
            <HostMessageButton
              organizerUserId={trip.hostUserId ?? trip.organizerUserId}
              activityId={trip.id}
            />
          </div>
        )}
        {trip.price > 0 && <span className="font-medium text-neutral-700">AED {trip.price}</span>}
        {trip.price === 0 && <span className="font-medium text-emerald-700">Free</span>}
      </div>
      {trip.meetingPoint && <p className="text-xs text-neutral-500 mt-2 truncate">📍 {trip.meetingPoint}</p>}
      <div className="mt-3 pt-3 border-t border-neutral-100">
        {trip.status === 'cancelled' ? (
          <span className="text-xs font-medium text-red-600">Cancelled</span>
        ) : trip.status === 'suspended' ? (
          <span className="text-xs font-medium text-amber-600">Suspended</span>
        ) : variant === 'past' ? (
          <span className="text-xs text-neutral-400">Completed</span>
        ) : (
          <span className="text-xs font-medium text-emerald-600">Confirmed</span>
        )}
      </div>
    </Link>
  );
};

const JoinedRequestCard = ({ request }: { request: ActivityRequestView }) => {
  const date = getRequestEventDate(request);
  return (
    <Link to={`/my-requests/${request.id}`} className="glass-card-interactive block p-4 ring-1 ring-amber-200/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate">
            {request.activity.title || request.activity.locationName}
          </h3>
          {request.activity.title && (
            <p className="text-xs text-neutral-500 truncate">{request.activity.locationName}</p>
          )}
          <p className="text-sm text-neutral-600 mt-1">
            {date || 'Date TBC'}
            {request.activity.time ? ` · ${request.activity.time}` : ''}
          </p>
        </div>
        {date && (
          <div className="flex flex-col items-end gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <ShareButton
              title={request.activity.title || request.activity.locationName}
              text={`${date} · trip on UAE Trails`}
              path={`/activity/${request.activity.id}`}
              iconOnly
              light
            />
            <span className="text-xs text-amber-600 font-medium">{daysUntil(date)}</span>
          </div>
        )}
      </div>
      {(request.activity.hostName ?? request.activity.organizerName) && (
        <div className="flex items-center gap-2 mt-3">
          {organizerProfilePath(request.activity.tenantSlug) ? (
            <Link
              to={organizerProfilePath(request.activity.tenantSlug)!}
              className="text-xs text-neutral-500 hover:text-emerald-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Hosted by {request.activity.hostName ?? request.activity.organizerName}
            </Link>
          ) : (
            <p className="text-xs text-neutral-500">
              Hosted by {request.activity.hostName ?? request.activity.organizerName}
            </p>
          )}
          <HostMessageButton
            organizerUserId={request.activity.organizerUserId}
            activityId={request.activity.id}
          />
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-neutral-100">
        <span className="text-xs font-semibold text-amber-700">Requested · Pending approval</span>
      </div>
    </Link>
  );
};
