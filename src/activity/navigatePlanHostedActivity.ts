import type { NavigateFunction } from 'react-router-dom';
import { tripsHostedActivityPath } from '../member-plan/tripsRouting';

/** Open Plan hosted-activity manage sheet (or participants view) for a published activity. */
export const navigateToPlanHostedActivity = (
  navigate: NavigateFunction,
  activityId: string,
  view: 'overview' | 'checkin' = 'overview'
): void => {
  navigate(tripsHostedActivityPath(activityId, view));
};

/** @deprecated Use {@link navigateToPlanHostedActivity}. */
export const navigateToHostedActivityManage = navigateToPlanHostedActivity;
