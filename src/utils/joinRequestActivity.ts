import type { ActivityRequestView } from '../api/types';

type JoinRequestActivity = ActivityRequestView['activity'];

/** Host `/host/requests` historically returned `event`; member `/me/requests` uses `activity`. */
export const resolveJoinRequestActivity = (
  request: ActivityRequestView & { event?: JoinRequestActivity }
): JoinRequestActivity | undefined => request.activity ?? request.event;
