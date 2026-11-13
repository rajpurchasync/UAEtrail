/**
 * My Plans surface (`/plan`) — canonical path builders and query normalization.
 * Hosting hub lives at {@link HOSTING_HUB_PATH} (`/hosting`).
 * @see docs/NAVIGATION.md § Plan · Hosting
 */
import { HOSTING_HUB_PATH, PLAN_PATH } from '../config/surfacePaths';
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

/** Upcoming tab with optional joined filter — hosting goes to dedicated `/hosting`. */
export const planUpcomingPath = (
  filter: PlanCommitmentFilter | 'all' = 'all',
  layout?: PlanUpcomingLayout
): string => {
  if (filter === 'hosting') return planHostingFilterPath();
  if (filter === 'joined') return planMainTabPath('upcoming', { filter: 'joined', layout });
  return planMainTabPath('upcoming', { layout });
};

/** Community hosting hub — dedicated `/hosting` (legacy `/plan?filter=hosting` redirects). */
export const planHostedSchedulePath = (): string => planHostingFilterPath();

/** Notification / API deep links — joined filter on upcoming. */
export const planJoinedSchedulePath = (): string => planJoinedFilterPath();

const isPlanPath = (pathname: string): boolean =>
  pathname === PLAN_PATH || pathname.startsWith(`${PLAN_PATH}/`);

/** My Plans hub only — not `/plan/today` or other plan sub-surfaces. */
export const isPlanHubPath = (pathname: string): boolean => pathname === PLAN_PATH;

/** Dedicated hosting hub path. */
export const isHostingHubPath = (pathname: string): boolean => pathname === HOSTING_HUB_PATH;

/**
 * Hosting nav active — dedicated `/hosting`, or legacy `/plan?filter=hosting` before redirect.
 */
export const isPlanHostingFilterRoute = (pathname: string, search: string): boolean =>
  isHostingHubPath(pathname) ||
  (isPlanPath(pathname) && new URLSearchParams(search).get('filter') === 'hosting');

/**
 * Desktop sidebar “My Plans” target when Hosting → Hosting schedule is shown:
 * participant view (joined) so the two links are not the same landing.
 */
export const planMemberNavPath = (showOrganiserShortcut: boolean): string =>
  showOrganiserShortcut ? planJoinedFilterPath() : PLAN_PATH;

/** Highlight My Plans nav (not the Hosting hub). */
export const isPlanMemberNavActive = (
  pathname: string,
  search: string,
  showOrganiserShortcut: boolean
): boolean => {
  if (isHostingHubPath(pathname)) return false;
  if (!isPlanHubPath(pathname)) return false;
  if (!showOrganiserShortcut) return true;
  return !isPlanHostingFilterRoute(pathname, search);
};

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
