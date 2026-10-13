import { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../api/types';

export const todayStart = () => new Date(new Date().toDateString());

export const isUpcomingActivityDate = (dateStr?: string) =>
  Boolean(dateStr && new Date(dateStr) >= todayStart());

export const isUpcomingActivity = (activity: ActivityDTO) => isUpcomingActivityDate(activity.date);

export const getRequestEventDate = (request: ActivityRequestView) =>
  request.activity.date ?? request.activity.startAt?.slice(0, 10) ?? '';

const isUpcomingRequest = (request: ActivityRequestView) =>
  isUpcomingActivityDate(getRequestEventDate(request));

/** Pending join requests for future events not already confirmed. */
export const pendingUpcomingRequests = (
  activities: ActivityDTO[],
  requests: ActivityRequestView[]
): ActivityRequestView[] => {
  const confirmedIds = new Set(activities.map((a) => a.id));
  return requests.filter(
    (r) =>
      (r.status === 'pending' || r.status === 'waitlisted') &&
      isUpcomingRequest(r) &&
      !confirmedIds.has(r.activity.id)
  );
};

export const upcomingActivitiesTotal = (activities: ActivityDTO[], requests: ActivityRequestView[]) => {
  const upcomingConfirmed = activities.filter(isUpcomingActivity).length;
  return upcomingConfirmed + pendingUpcomingRequests(activities, requests).length;
};
