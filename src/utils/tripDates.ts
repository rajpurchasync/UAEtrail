import { EventDTO } from '@uaetrail/shared-types';
import { EventRequestView } from '../api/services';

export const todayStart = () => new Date(new Date().toDateString());

export const isUpcomingDate = (dateStr?: string) =>
  Boolean(dateStr && new Date(dateStr) >= todayStart());

export const isUpcomingTrip = (trip: EventDTO) => isUpcomingDate(trip.date);

export const getRequestEventDate = (request: EventRequestView) =>
  request.event.date ?? request.event.startAt?.slice(0, 10) ?? '';

export const isUpcomingRequest = (request: EventRequestView) =>
  isUpcomingDate(getRequestEventDate(request));

/** Pending join requests for future events not already confirmed as trips. */
export const pendingUpcomingRequests = (
  trips: EventDTO[],
  requests: EventRequestView[]
): EventRequestView[] => {
  const confirmedIds = new Set(trips.map((t) => t.id));
  return requests.filter(
    (r) => r.status === 'pending' && isUpcomingRequest(r) && !confirmedIds.has(r.event.id)
  );
};

export const upcomingTripsTotal = (trips: EventDTO[], requests: EventRequestView[]) => {
  const upcomingConfirmed = trips.filter(isUpcomingTrip).length;
  return upcomingConfirmed + pendingUpcomingRequests(trips, requests).length;
};

export const daysUntil = (dateStr: string) => {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return '';
  return `In ${diff} days`;
};
