/**
 * @deprecated Import from `./planHubRouting` or `config/routingCatalog`.
 * Legacy `/trips` symbol names — one-release shim for external forks only.
 */
export * from './planHubRouting';

import {
  PLAN_UPCOMING_SUB_TABS,
  PLAN_WISHLIST_LAYER_PILLS,
  PROFILE_HISTORY_MAIN_TABS,
  PROFILE_HISTORY_UNDERLINE_TABS,
  journeyMapPath,
  normalizePlanHubSearchParams,
  parsePlanHistoryMainView,
  parsePlanHistoryRole,
  parsePlanHubSegment,
  parsePlanHubWishlistLayer,
  parsePlanSavedLayer,
  parsePlanUpcomingRole,
  parsePlanUpcomingSub,
  planHubPath,
  planHostedActivityManagePath,
  planJoinedUpcomingPath,
  planPlansRolePath,
  planSelfDemandManagePath,
  planUpcomingDefaultPath,
  planWishlistRedirectPath,
  planUpcomingRoleChips,
  profileHistoryCompletedPath,
  profileHistoryRoleChips,
  type PlanHistoryMainView,
  type PlanHistoryRole,
  type PlanHistorySubviewPillId,
  type PlanHubSegment,
  type PlanHubWishlistLayer,
  type PlanSavedLayer,
  type PlanUpcomingRole,
  type PlanUpcomingSub,
} from './planHubRouting';

export type TripsHubLayer = PlanHubWishlistLayer;
export type TripsSavedLayer = PlanSavedLayer;
export type TripsMainView = PlanHistoryMainView;
export type TripsSegment = PlanHubSegment;
export type TripsPlansSub = PlanUpcomingSub;
export type TripsPlansRole = PlanUpcomingRole;
export type TripsRole = PlanHistoryRole;
export type TripsSubviewPillId = PlanHistorySubviewPillId;

export const parseTripsSavedLayer = parsePlanSavedLayer;
export const TRIPS_HUB_LAYER_PILLS = PLAN_WISHLIST_LAYER_PILLS;
export const TRIPS_PLANS_SUB_TABS = PLAN_UPCOMING_SUB_TABS;
export const parseTripsPlansRole = parsePlanUpcomingRole;
export const tripsPlansRoleChips = planUpcomingRoleChips;
export const parseTripsMainView = parsePlanHistoryMainView;
export const parseTripsPlansSub = parsePlanUpcomingSub;
export const tripsCompletedPath = profileHistoryCompletedPath;
export const parseTripsHubLayer = parsePlanHubWishlistLayer;
export const parseTripsSegment = parsePlanHubSegment;
export const parseTripsRole = parsePlanHistoryRole;
export const normalizeTripsSearchParams = normalizePlanHubSearchParams;
export const tripsSelfDemandPath = planSelfDemandManagePath;
export const tripsHostedActivityPath = planHostedActivityManagePath;
export const tripsPath = planHubPath;
export const tripsMapPath = journeyMapPath;
export const tripsPlansPath = planPlansRolePath;
export const myTripsWishlistPath = planWishlistRedirectPath;
export const tripsLegacyJoinedTabPath = planJoinedUpcomingPath;
export const tripsLegacyUpcomingSegmentPath = planUpcomingDefaultPath;
export const MY_TRIPS_MAIN_TABS = PROFILE_HISTORY_MAIN_TABS;
export const TRIPS_MAIN_TABS = PROFILE_HISTORY_MAIN_TABS;
export const TRIPS_UNDERLINE_TABS = PROFILE_HISTORY_UNDERLINE_TABS;
export const TRIPS_SEGMENT_TABS: { id: PlanHubSegment; label: string }[] = [
  ...PROFILE_HISTORY_UNDERLINE_TABS,
  { id: 'wishlist', label: 'Wishlist' },
];
export const tripsHistoryRoleChips = profileHistoryRoleChips;

export const tripsSubviewPills = (
  timeline: 'upcoming' | 'completed' | 'wishlist',
  canHost: boolean
): { id: PlanHistorySubviewPillId; label: string }[] => {
  if (timeline === 'completed') {
    return profileHistoryRoleChips(canHost);
  }
  return PLAN_UPCOMING_SUB_TABS.map((t) => ({
    id: t.id === 'wishlist' ? 'wishlist' : 'joined',
    label: t.label,
  }));
};

export const tripsRoleChips = (
  segment: PlanHubSegment,
  canHost: boolean
): { id: PlanHistoryRole; label: string }[] =>
  tripsSubviewPills(segment === 'completed' ? 'completed' : 'upcoming', canHost).filter(
    (chip): chip is { id: PlanHistoryRole; label: string } => chip.id !== 'wishlist'
  );
