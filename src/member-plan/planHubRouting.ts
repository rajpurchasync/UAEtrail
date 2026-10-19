import {
  JOURNEY_MAP_PATH,
  INBOUND_TRIPS_MAP_PATH,
  PLAN_PATH,
  PROFILE_HISTORY_PATH,
  isJourneyMapPath,
  isProfileHistoryListPath,
} from '../config/surfacePaths';
import { planSavedPath } from '../plan/planLens';
import { planMainTabPath, planWishlistTabPath } from '../plan/planTab';

/**
 * Plan (`/plan`) + profile history URL helpers and legacy query normalization.
 * Scheduled outings use **activities** APIs — not a separate “trips” domain.
 * Inbound `/trips` paths redirect in `inboundTripsRedirect.ts`.
 */
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
  if (pathname === INBOUND_TRIPS_MAP_PATH || pathname.endsWith(INBOUND_TRIPS_MAP_PATH)) return 'map';
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

export const planUpcomingPath = (
  filter: 'hosting' | 'joined' | 'all' = 'all'
): string => {
  if (filter === 'hosting') return planMainTabPath('upcoming', { filter: 'hosting' });
  if (filter === 'joined') return planMainTabPath('upcoming', { filter: 'joined' });
  return planMainTabPath('upcoming');
};

/** Deep links that still use legacy `view=plans` + role/sub query (prefer `planRouting` helpers in new code). */
export const planPlansRolePath = (
  role: PlanUpcomingRole | PlanUpcomingSub = 'all'
): string => {
  const params = new URLSearchParams();
  params.set('view', 'plans');
  if (role === 'wishlist') {
    return planSavedPath();
  }
  if (role === 'joined') {
    params.set('filter', 'joined');
  } else if (role === 'hosted') {
    params.set('filter', 'hosting');
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
  options: { canHost: boolean; legacyTab: string | null }
): PlanHistoryRole => {
  if (raw === 'self') return 'self';
  if (raw === 'hosted' && options.canHost) return 'hosted';
  if (raw === 'joined') return 'joined';
  if (options.legacyTab === 'hosted' && options.canHost) return 'hosted';
  if (segment === 'completed' && options.legacyTab === 'joined') return 'joined';
  return 'joined';
};

/** Normalize legacy Plan / `/trips` query params (mutates `params`). */
export const normalizePlanHubSearchParams = (
  params: URLSearchParams,
  canHost: boolean
): { changed: boolean } => {
  let changed = false;
  const legacyTab = params.get('tab');
  const legacySub = params.get('sub');

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
    const planLens = params.get('lens');
    const skipUpcomingRoleDefault =
      planLens === 'availability' || planLens === 'saved' || planLens === 'goals';
    const seg = params.get('segment');
    if (seg === 'completed') {
      params.delete('segment');
      changed = true;
    } else if (seg === 'saved' || seg === 'wishlist') {
      params.delete('segment');
      params.set('view', 'plans');
      params.set('lens', 'saved');
      params.delete('role');
      params.delete('saved');
      changed = true;
    }
    const plansRole = params.get('role');
    if (params.get('segment') === 'wishlist' && plansRole) {
      params.delete('role');
      changed = true;
    } else if (params.get('segment') !== 'wishlist') {
      if (plansRole === 'hosted' && !canHost) {
        params.set('role', 'all');
        changed = true;
      } else if (!plansRole && !skipUpcomingRoleDefault) {
        params.set('role', 'all');
        changed = true;
      }
    }
  }

  const legacyLayer = params.get('layer');
  if (legacyLayer === 'places' || legacyLayer === 'shops') {
    params.delete('layer');
    params.set('view', 'plans');
    params.set('role', 'all');
    changed = true;
  } else if (legacyLayer === 'trips' || legacyLayer === 'activities') {
    params.delete('layer');
    changed = true;
  } else if (legacyLayer) {
    params.delete('layer');
    changed = true;
  }

  if (!params.get('segment') && (legacyTab || legacySub)) {
    if (legacySub === 'attended' || legacyTab === 'joined') {
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
      const role = parsePlanHistoryRole(null, 'completed', { canHost, legacyTab });
      params.set('role', role);
      changed = true;
    }
  }

  if (legacyTab || legacySub) {
    params.delete('tab');
    params.delete('sub');
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
