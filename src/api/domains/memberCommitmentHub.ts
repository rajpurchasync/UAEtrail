import { availabilityApi } from './availability';
import { goalsApi } from './goals';

/**
 * APIs that back the `/plan` member hub (not a Plan entity).
 * Goals + availability — activities use `activitiesApi` / explore feeds.
 */
export const memberCommitmentHubApi = {
  ...goalsApi,
  ...availabilityApi,
} as const;
