/**
 * My Plans surface (`/plan`) — canonical path builders and query normalization.
 * Organizing schedule: {@link OPERATOR_OVERVIEW_PATH}. Share availability: explore compose (`planAvailabilityPath`).
 * Profile history + inbound trip-hub query normalization live here (formerly `member-plan/planHubRouting.ts`).
 * @see docs/NAVIGATION.md § Plan · Operator
 */
import { INBOUND_PLAN_HUB_TRIPS_MAP_PATH } from '../config/inboundBookmarkPaths';
import { HOSTING_HUB_PATH, OPERATOR_OVERVIEW_PATH, PLAN_PATH, JOURNEY_MAP_PATH, PROFILE_HISTORY_PATH, isJourneyMapPath, isProfileHistoryListPath } from '../config/surfacePaths';
import { explorePath } from '../explore/routing';
import { intentOpenCompose } from '../explore/compose';
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

/** Upcoming tab with optional joined / hosting filter on `/plan`. */
export const planUpcomingPath = (
  filter: PlanCommitmentFilter | 'all' = 'all',
  layout?: PlanUpcomingLayout
): string => {
  if (filter === 'hosting') return planHostingFilterPath();
  if (filter === 'joined') return planMainTabPath('upcoming', { filter: 'joined', layout });
  if (filter === 'all') return planMainTabPath('upcoming', { filter: 'all', layout });
  return planMainTabPath('upcoming', { layout });
};

/** Unified member calendar — busy outings + availability blocks (MIG-SG-B3). */
export const MEMBER_SCHEDULE_CALENDAR_PATH = planUpcomingPath('all', 'calendar');

/** Organizing / operator console home (hosted schedule management). */
export const planHostedSchedulePath = (): string => OPERATOR_OVERVIEW_PATH;

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

/** Mark open availability — explore list + `compose=intent:open`. */
export const planAvailabilityPath = (): string =>
  explorePath({ compose: intentOpenCompose(), list: true, crews: true });

export type PlanHubWishlistLayer = 'activities' | 'places' | 'shops';

export type PlanSavedLayer = PlanHubWishlistLayer;

export const parsePlanSavedLayer = (raw: string | null): PlanSavedLayer => {
  if (raw === 'places' || raw === 'shops') return raw;
  if (raw === 'trips' || raw === 'activities') return 'activities';
  return 'activities';
};

export const PLAN_WISHLIST_LAYER_PILLS: { id: PlanHubWishlistLayer; label: string }[] = [
  { id: 'activities', label: 'Activities' },
  { id: 'places', label: 'Places' },
  { id: 'shops', label: 'Shops' },
];

export type PlanHistoryMainView = 'plans' | 'completed' | 'map';

export type PlanHubSegment = 'upcoming' | 'completed' | 'wishlist';

export type PlanUpcomingSub = 'upcoming' | 'wishlist';

export type PlanUpcomingRole = 'all' | 'hosted' | 'joined' | 'wishlist';

export const PLAN_UPCOMING_SUB_TABS: { id: PlanUpcomingSub; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'wishlist', label: 'Wishlist' },
];

export const parsePlanUpcomingRole = (
  segment: PlanHubSegment,
  roleRaw: string | null,
  canHost: boolean
): PlanUpcomingRole => {
  if (segment === 'wishlist' || roleRaw === 'wishlist') return 'all';
  if (roleRaw === 'hosted' && canHost) return 'hosted';
  if (roleRaw === 'joined') return 'joined';
  return 'all';
};

export const planUpcomingRoleChips = (canHost: boolean): { id: PlanUpcomingRole; label: string }[] => {
  const chips: { id: PlanUpcomingRole; label: string }[] = [{ id: 'all', label: 'All' }];
  if (canHost) chips.push({ id: 'hosted', label: 'Hosted' });
  chips.push({ id: 'joined', label: 'Joined' });
  return chips;
};

export const parsePlanHistoryMainView = (
  pathname: string,
  rawView: string | null
): PlanHistoryMainView => {
  if (
    pathname === INBOUND_PLAN_HUB_TRIPS_MAP_PATH ||
    pathname.endsWith(INBOUND_PLAN_HUB_TRIPS_MAP_PATH)
  ) {
    return 'map';
  }
  if (isJourneyMapPath(pathname)) return 'map';
  if (isProfileHistoryListPath(pathname)) {
    if (rawView === 'map') return 'map';
    if (rawView === 'plans') return 'plans';
    if (rawView === 'completed' || rawView === 'history') return 'completed';
    return 'completed';
  }
  if (pathname === PLAN_PATH) return 'plans';
  if (rawView === 'completed' || rawView === 'history') return 'completed';
  if (rawView === 'map') return 'map';
  return 'plans';
};

export const parsePlanUpcomingSub = (segment: PlanHubSegment): PlanUpcomingSub =>
  segment === 'wishlist' ? 'wishlist' : 'upcoming';


/** Deep links that still use inbound `view=plans` + role/sub query (prefer `planRouting` helpers in new code). */
export const planPlansRolePath = (
  role: PlanUpcomingRole | PlanUpcomingSub = 'all'
): string => {
  if (role === 'wishlist') {
    return planSavedPath();
  }
  if (role === 'hosted') {
    return OPERATOR_OVERVIEW_PATH;
  }
  const params = new URLSearchParams();
  params.set('view', 'plans');
  if (role === 'joined') {
    params.set('filter', 'joined');
  } else if (role === 'upcoming' || role === 'all') {
    params.delete('filter');
  }
  return `${PLAN_PATH}?${params.toString()}`;
};

export const profileHistoryCompletedPath = (role?: PlanHistoryRole): string => {
  const params = new URLSearchParams();
  params.set('view', 'completed');
  if (role && role !== 'joined') params.set('role', role);
  return `${PROFILE_HISTORY_PATH}?${params.toString()}`;
};

export type PlanHistoryRole = 'joined' | 'hosted' | 'self';

/** Plan mobile main tab — must not be stripped by inbound `tab=` cleanup. */
const PLAN_CANONICAL_MAIN_TAB = 'wishlist';

export const parsePlanHubWishlistLayer = (raw: string | null): PlanHubWishlistLayer =>
  parsePlanSavedLayer(raw);

export const parsePlanHubSegment = (raw: string | null): PlanHubSegment => {
  if (raw === 'wishlist' || raw === 'saved') return 'upcoming';
  if (raw === 'past' || raw === 'completed') return 'completed';
  return 'upcoming';
};

export const parsePlanHistoryRole = (
  raw: string | null,
  segment: PlanHubSegment,
  options: { canHost: boolean; inboundTab: string | null }
): PlanHistoryRole => {
  if (raw === 'self') return 'self';
  if (raw === 'hosted' && options.canHost) return 'hosted';
  if (raw === 'joined') return 'joined';
  if (options.inboundTab === 'hosted' && options.canHost) return 'hosted';
  if (segment === 'completed' && options.inboundTab === 'joined') return 'joined';
  return 'joined';
};

/** Normalize inbound Plan / `/trips` query params (mutates `params`). */
export const normalizePlanHubSearchParams = (
  params: URLSearchParams,
  canHost: boolean
): { changed: boolean } => {
  let changed = false;
  const inboundTab = params.get('tab');
  const inboundSub = params.get('sub');

  if (params.get('segment') === 'past') {
    params.set('segment', 'completed');
    changed = true;
  }

  const segmentBeforeView = parsePlanHubSegment(params.get('segment'));
  if (!params.get('view')) {
    if (segmentBeforeView === 'completed') {
      params.set('view', 'completed');
    } else {
      params.set('view', 'plans');
    }
    changed = true;
  }

  if (params.get('view') === 'completed') {
    if (params.get('segment') !== 'completed') {
      params.delete('segment');
    }
  }

  if (params.get('view') === 'plans') {
    const seg = params.get('segment');
    if (seg === 'completed') {
      params.delete('segment');
      changed = true;
    } else if (seg === 'saved' || seg === 'wishlist') {
      params.delete('segment');
      params.set('tab', 'wishlist');
      changed = true;
    }
  }

  const inboundLayer = params.get('layer');
  if (inboundLayer === 'places' || inboundLayer === 'shops') {
    params.delete('layer');
    params.set('view', 'plans');
    params.set('tab', 'wishlist');
    params.set('saved', inboundLayer);
    changed = true;
  } else if (inboundLayer === 'trips' || inboundLayer === 'activities') {
    params.delete('layer');
    changed = true;
  } else if (inboundLayer) {
    params.delete('layer');
    changed = true;
  }

  if (!params.get('segment') && (inboundTab || inboundSub)) {
    if (inboundSub === 'attended' || inboundTab === 'joined') {
      params.set('segment', 'completed');
      changed = true;
    }
  }

  const resolvedSegment = parsePlanHubSegment(params.get('segment'));

  if (resolvedSegment === 'wishlist' && params.get('role')) {
    params.delete('role');
    changed = true;
  }

  if (params.get('view') === 'completed') {
    if (!canHost && params.get('role') === 'hosted') {
      params.set('role', 'joined');
      changed = true;
    }
    if (!params.get('role')) {
      const role = parsePlanHistoryRole(null, 'completed', { canHost, inboundTab });
      params.set('role', role);
      changed = true;
    }
  }

  if (inboundSub) {
    params.delete('sub');
    changed = true;
  }
  if (inboundTab && inboundTab !== PLAN_CANONICAL_MAIN_TAB) {
    params.delete('tab');
    changed = true;
  }

  return { changed };
};

export const planHubPath = (input?: {
  layer?: PlanHubWishlistLayer;
  segment?: PlanHubSegment;
  role?: PlanHistoryRole;
}): string => {
  if (input?.segment === 'completed') {
    return profileHistoryCompletedPath(input?.role);
  }
  if (input?.segment === 'wishlist') {
    return planSavedPath();
  }
  if (input?.role === 'hosted') {
    return planUpcomingPath('hosting');
  }
  if (input?.role === 'joined' || input?.role === 'self') {
    return profileHistoryCompletedPath(input.role);
  }
  if (input?.layer === 'places' || input?.layer === 'shops') {
    const params = new URLSearchParams();
    params.set('view', 'plans');
    params.set('tab', 'wishlist');
    params.set('saved', input.layer);
    return `${PLAN_PATH}?${params.toString()}`;
  }
  if (input?.layer === 'activities') {
    return planWishlistTabPath();
  }
  return planUpcomingPath('all');
};

export const journeyMapPath = (): string => JOURNEY_MAP_PATH;

export const planWishlistRedirectPath = (): string => planSavedPath();

export const planJoinedUpcomingPath = (): string => planUpcomingPath('joined');

export const planUpcomingDefaultPath = (): string => planUpcomingPath('all');

export const planSelfDemandManagePath = (intentId: string): string => {
  const params = new URLSearchParams();
  params.set('view', 'plans');
  params.set('filter', 'hosting');
  params.set('peek', intentId);
  return `${PLAN_PATH}?${params.toString()}`;
};

export const planHostedActivityManagePath = (
  activityId: string,
  view: 'overview' | 'checkin' = 'overview'
): string => {
  const params = new URLSearchParams();
  params.set('view', 'plans');
  params.set('filter', 'hosting');
  if (view === 'checkin') {
    params.set('roster', activityId);
  } else {
    params.set('peek', activityId);
  }
  return `${PLAN_PATH}?${params.toString()}`;
};

export const PROFILE_HISTORY_MAIN_TABS: {
  id: PlanHistoryMainView;
  label: string;
  href: string;
}[] = [
  { id: 'completed', label: 'History', href: profileHistoryCompletedPath() },
  { id: 'map', label: 'My Map', href: journeyMapPath() },
];

export const PROFILE_HISTORY_UNDERLINE_TABS: { id: 'upcoming' | 'completed'; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
];

export type PlanHistorySubviewPillId = PlanHistoryRole | 'wishlist';

export const profileHistoryRoleChips = (
  canHost: boolean
): { id: PlanHistoryRole; label: string }[] => {
  const chips: { id: PlanHistoryRole; label: string }[] = [{ id: 'joined', label: 'Joined' }];
  if (canHost) chips.push({ id: 'hosted', label: 'Hosted' });
  chips.push({ id: 'self', label: 'Self-logged' });
  return chips;
};

/** Inbound + mobile param normalization — run once on `/plan` load. */
export const normalizePlanSearchParams = (
  params: URLSearchParams,
  canHost: boolean
): { changed: boolean } => {
  const hub = normalizePlanHubSearchParams(params, canHost);
  const plan = normalizePlanMobileParams(params, canHost);
  return { changed: hub.changed || plan.changed };
};
