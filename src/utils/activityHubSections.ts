import type { MyActivityDTO } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../api/services';
import { getRequestEventDate, isUpcomingActivity } from './activityDates';

export type JoinedSubTab = 'upcoming' | 'attended' | 'cancelled' | 'rejected';

export const parseJoinedSubTab = (value: string | null): JoinedSubTab => {
  if (value === 'attended' || value === 'cancelled' || value === 'rejected') return value;
  return 'upcoming';
};

export const isAttendedActivity = (activity: MyActivityDTO): boolean =>
  Boolean(activity.participation?.checkedInAt);

export const upcomingConfirmedActivities = (activities: MyActivityDTO[]) =>
  activities.filter(isUpcomingActivity);

export const attendedActivities = (activities: MyActivityDTO[]) =>
  activities
    .filter(isAttendedActivity)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

/** Pending or waitlisted requests for future events not already confirmed. */
export const upcomingOpenRequests = (activities: MyActivityDTO[], requests: ActivityRequestView[]) => {
  const confirmedIds = new Set(activities.map((a) => a.id));
  return requests.filter((request) => {
    if (confirmedIds.has(request.activity.id)) return false;
    if (request.status !== 'pending' && request.status !== 'waitlisted') return false;
    const date = getRequestEventDate(request);
    return Boolean(date && new Date(date) >= new Date(new Date().toDateString()));
  });
};

export const cancelledRequests = (requests: ActivityRequestView[]) =>
  requests
    .filter((r) => r.status === 'cancelled')
    .sort((a, b) => new Date(b.cancelledAt ?? b.createdAt).getTime() - new Date(a.cancelledAt ?? a.createdAt).getTime());

export const rejectedRequests = (requests: ActivityRequestView[]) =>
  requests
    .filter((r) => r.status === 'rejected')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const requestRecordMeta = (request: ActivityRequestView): string | null => {
  if (request.organizerNote?.trim()) return `Host note: ${request.organizerNote.trim()}`;
  if (request.cancelReason === 'other' && request.cancelMessage?.trim()) {
    return request.cancelMessage.trim();
  }
  if (request.cancelReason) return `Reason: ${request.cancelReason.replace(/_/g, ' ')}`;
  return null;
};
