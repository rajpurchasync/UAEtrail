/**
 * My Plans surface (`/plan`) — canonical path builders and query normalization.
 * @see docs/NAVIGATION.md § Plan
 */
import { PLAN_PATH } from '../config/surfacePaths';
import {
  normalizePlanHubSearchParams,
  planHostedActivityManagePath,
  planSelfDemandManagePath,
  planPlansRolePath,
} from '../member-plan/planHubRouting';
import {
  normalizePlanMobileParams,
  planHostingFilterPath,
  planJoinedFilterPath,
  planMainTabPath,
  planWishlistTabPath,
  type PlanCommitmentFilter,
  type PlanMainTab,
  type PlanUpcomingLayout,
} from './planTab';
import {
  planGoalsWishlistPath,
  planLensPath,
  planSavedPath,
  type PlanLens,
} from './planLens';

export type {
  PlanCommitmentFilter,
  PlanMainTab,
  PlanUpcomingLayout,
  PlanLens,
};

export {
  planMainTabPath,
  planHostingFilterPath,
  planJoinedFilterPath,
  planWishlistTabPath,
  planLensPath,
  planSavedPath,
  planGoalsWishlistPath,
  PLAN_PATH,
};

/** Upcoming tab with optional hosting / joined filter (canonical `filter=` query). */
export const planUpcomingPath = (
  filter: PlanCommitmentFilter | 'all' = 'all',
  layout?: PlanUpcomingLayout
): string => {
  if (filter === 'hosting') return planMainTabPath('upcoming', { filter: 'hosting', layout });
  if (filter === 'joined') return planMainTabPath('upcoming', { filter: 'joined', layout });
  return planMainTabPath('upcoming', { layout });
};

/** Notification / API deep links — hosting filter on upcoming. */
export const planHostedSchedulePath = (): string => planHostingFilterPath();

/** Notification / API deep links — joined filter on upcoming. */
export const planJoinedSchedulePath = (): string => planJoinedFilterPath();

export const planAvailabilityPath = (): string => planLensPath('availability');

export { planHostedActivityManagePath, planSelfDemandManagePath, planPlansRolePath };

/** Inbound + mobile param normalization — run once on `/plan` load. */
export const normalizePlanSearchParams = (
  params: URLSearchParams,
  canHost: boolean
): { changed: boolean } => {
  const hub = normalizePlanHubSearchParams(params, canHost);
  const plan = normalizePlanMobileParams(params, canHost);
  return { changed: hub.changed || plan.changed };
};
