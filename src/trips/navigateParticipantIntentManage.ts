import type { NavigateFunction } from 'react-router-dom';
import { tripsSelfDemandPath } from './tripsRouting';

/** Open Trips → My plans manage sheet for a participant intent. */
export const navigateToParticipantIntentManage = (
  navigate: NavigateFunction,
  intentId: string
): void => {
  navigate(tripsSelfDemandPath(intentId));
};
