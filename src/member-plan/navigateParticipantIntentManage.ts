import type { NavigateFunction } from 'react-router-dom';
import { planHostedActivityManagePath, planSelfDemandManagePath } from '../plan/planRouting';

/** Open Trips manage — hosted activity sheet when M0 activity exists, else intent sheet. */
export const navigateToParticipantIntentManage = (
  navigate: NavigateFunction,
  intentId: string,
  activityId?: string | null
): void => {
  if (activityId?.trim()) {
    navigate(planHostedActivityManagePath(activityId.trim()));
    return;
  }
  navigate(planSelfDemandManagePath(intentId));
};
