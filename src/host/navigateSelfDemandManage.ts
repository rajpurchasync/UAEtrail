import type { NavigateFunction } from 'react-router-dom';
import { navigateToParticipantIntentManage } from '../trips/navigateParticipantIntentManage';

/** @deprecated Use {@link navigateToParticipantIntentManage}. */
export const navigateToSelfDemandManage = (
  navigate: NavigateFunction,
  intentId: string
): void => {
  navigateToParticipantIntentManage(navigate, intentId);
};
