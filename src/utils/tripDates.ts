import { ActivityDTO } from '@uaetrail/shared-types';
import { ActivityRequestView } from '../api/services';

export const todayStart = () => new Date(new Date().toDateString());

const isUpcomingDate = (dateStr?: string) =>
  Boolean(dateStr && new Date(dateStr) >= todayStart());

export const isUpcomingTrip = (trip: ActivityDTO) => isUpcomingDate(trip.date);

export const getRequestEventDate = (request: ActivityRequestView) =>
  request.activity.date ?? request.activity.startAt?.slice(0, 10) ?? '';

const isUpcomingRequest = (request: ActivityRequestView) =>
  isUpcomingDate(getRequestEventDate(request));

/** Pending join requests for future events not already confirmed as trips. */
export const pendingUpcomingRequests = (
  trips: ActivityDTO[],
  requests: ActivityRequestView[]
): ActivityRequestView[] => {
  const confirmedIds = new Set(trips.map((t) => t.id));
  return requests.filter(
    (r) => r.status === 'pending' && isUpcomingRequest(r) && !confirmedIds.has(r.activity.id)
  );
};

export const upcomingTripsTotal = (trips: ActivityDTO[], requests: ActivityRequestView[]) => {
  const upcomingConfirmed = trips.filter(isUpcomingTrip).length;
  return upcomingConfirmed + pendingUpcomingRequests(trips, requests).length;
};
