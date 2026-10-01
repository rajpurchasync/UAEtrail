import type { NavigateFunction } from 'react-router-dom';
import { tripsSelfDemandPath } from '../trips/tripsRouting';

/** Open Trips → My plans manage sheet for a demand intent. */
export const navigateToSelfDemandManage = (navigate: NavigateFunction, intentId: string): void => {
  navigate(tripsSelfDemandPath(intentId));
};
