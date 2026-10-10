import type { NavigateFunction } from 'react-router-dom';
import { tripsHostedActivityPath } from '../member-plan/tripsRouting';

/** Open Trips → Hosted manage sheet (or check-in view) for a hosted activity. */
export const navigateToHostedActivityManage = (
  navigate: NavigateFunction,
  activityId: string,
  view: 'overview' | 'checkin' = 'overview'
): void => {
  navigate(tripsHostedActivityPath(activityId, view));
};
