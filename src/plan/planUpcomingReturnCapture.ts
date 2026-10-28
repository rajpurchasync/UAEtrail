import { captureLeavingView, viewReturnPathKey } from '../utils/viewReturnMemory';

export const planUpcomingActivityFocusId = (activityId: string): string =>
  `plan-upcoming-activity-${activityId}`;

/** Snapshot Plan upcoming list scroll before opening activity detail. */
export const capturePlanUpcomingViewReturn = (pathname: string, search: string): void => {
  captureLeavingView(viewReturnPathKey(pathname, search));
};
