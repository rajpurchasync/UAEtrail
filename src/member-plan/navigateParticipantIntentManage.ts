import type { NavigateFunction } from 'react-router-dom';
import { tripsHostedActivityPath, tripsSelfDemandPath } from './tripsRouting';

/** Open Trips manage — hosted activity sheet when M0 activity exists, else intent sheet. */
export const navigateToParticipantIntentManage = (
  navigate: NavigateFunction,
  intentId: string,
  activityId?: string | null
): void => {
  if (activityId?.trim()) {
    navigate(tripsHostedActivityPath(activityId.trim()));
    return;
  }
  navigate(tripsSelfDemandPath(intentId));
};
