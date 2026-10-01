import { TRIPS_PATH } from '../constants';

/**
 * **Trips tab UI only** — `/trips` query params, labels, and path helpers.
 * Domain data (activities, join requests, org hub) lives under activities / organisation APIs — not here.
 */
export type TripsHubLayer = 'trips' | 'places' | 'shops';

export type TripsSavedLayer = 'trips' | 'places' | 'shops';

export const parseTripsSavedLayer = (raw: string | null): TripsSavedLayer => {
  if (raw === 'places' || raw === 'shops') return raw;
  return 'trips';
};

export const TRIPS_HUB_LAYER_PILLS: { id: TripsHubLayer; label: string }[] = [
  { id: 'trips', label: 'Trips' },
  { id: 'places', label: 'Places' },
  { id: 'shops', label: 'Shops' },
];

export type TripsMainView = 'plans' | 'completed' | 'map';

export type TripsSegment = 'upcoming' | 'completed' | 'wishlist';

/** Sub-tab under Plans: upcoming outings vs wishlist. */
export type TripsPlansSub = 'upcoming' | 'wishlist';

/** Pill under Plans → Upcoming: all / hosted / joined outings or wishlist. */
export type TripsPlansRole = 'all' | 'hosted' | 'joined' | 'wishlist';

export const TRIPS_PLANS_SUB_TABS: { id: TripsPlansSub; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'wishlist', label: 'Wishlist' },
];

export const parseTripsPlansRole = (
  segment: TripsSegment,
  roleRaw: string | null,
  canHost: boolean
): TripsPlansRole => {
  if (segment === 'wishlist') return 'wishlist';
  if (roleRaw === 'hosted' && canHost) return 'hosted';
  if (roleRaw === 'joined') return 'joined';
  return 'all';
};

export const tripsPlansRoleChips = (canHost: boolean): { id: TripsPlansRole; label: string }[] => {
  const chips: { id: TripsPlansRole; label: string }[] = [{ id: 'all', label: 'All' }];
  if (canHost) chips.push({ id: 'hosted', label: 'Hosted' });
  chips.push({ id: 'joined', label: 'Joined' });
  chips.push({ id: 'wishlist', label: 'Wishlist' });
  return chips;
};

export const parseTripsMainView = (pathname: string, rawView: string | null): TripsMainView => {
  if (pathname === '/trips/map' || pathname.endsWith('/trips/map')) return 'map';
  if (rawView === 'completed' || rawView === 'history') return 'completed';
  if (rawView === 'map') return 'map';
  return 'plans';
};

export const parseTripsPlansSub = (segment: TripsSegment): TripsPlansSub =>
  segment === 'wishlist' ? 'wishlist' : 'upcoming';

export const tripsPlansPath = (
  role: TripsPlansRole | TripsPlansSub = 'all'
): string => {
  const params = new URLSearchParams();
  params.set('view', 'plans');
  if (role === 'wishlist') {
    params.set('segment', 'wishlist');
  } else if (role === 'upcoming') {
    params.set('role', 'all');
  } else if (role !== 'all') {
    params.set('role', role);
  } else {
    params.set('role', 'all');
  }
  return `${TRIPS_PATH}?${params.toString()}`;
};

export const tripsCompletedPath = (role?: TripsRole): string => {
  const params = new URLSearchParams();
  params.set('view', 'completed');
  if (role && role !== 'joined') params.set('role', role);
  return `${TRIPS_PATH}?${params.toString()}`;
};

export type TripsRole = 'joined' | 'hosted' | 'self';

export const parseTripsHubLayer = (raw: string | null): TripsHubLayer => {
  if (raw === 'places' || raw === 'shops') return raw;
  return 'trips';
};

export const parseTripsSegment = (raw: string | null): TripsSegment => {
  if (raw === 'wishlist' || raw === 'saved') return 'wishlist';
  if (raw === 'past' || raw === 'completed') return 'completed';
  return 'upcoming';
};

export const parseTripsRole = (
  raw: string | null,
  segment: TripsSegment,
  options: { canHost: boolean; legacyTab: string | null }
): TripsRole => {
  if (raw === 'self') return 'self';
  if (raw === 'hosted' && options.canHost) return 'hosted';
  if (raw === 'joined') return 'joined';
  if (options.legacyTab === 'hosted' && options.canHost) return 'hosted';
  if (segment === 'completed' && options.legacyTab === 'joined') return 'joined';
  return 'joined';
};

/** Normalize legacy `tab` / `sub` into segment + role (mutates params). */
export const normalizeTripsSearchParams = (
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

  const segmentBeforeView = parseTripsSegment(params.get('segment'));
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
    } else if (seg === 'saved') {
      params.set('segment', 'wishlist');
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
      } else if (!plansRole) {
        params.set('role', 'all');
        changed = true;
      }
    }
  }

  const legacyLayer = params.get('layer');
  if (legacyLayer === 'places' || legacyLayer === 'shops') {
    params.delete('layer');
    params.set('view', 'plans');
    params.set('segment', 'wishlist');
    params.set('saved', legacyLayer);
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

  const resolvedSegment = parseTripsSegment(params.get('segment'));

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
      const role = parseTripsRole(null, 'completed', { canHost, legacyTab });
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

/** Deep link: Trips → Hosted → manage sheet (or check-in subview). */
/** Deep link: Trips → My plans → manage sheet for a demand intent. */
export const tripsSelfDemandPath = (intentId: string): string => {
  const params = new URLSearchParams();
  params.set('view', 'plans');
  params.set('role', 'joined');
  params.set('peek', intentId);
  return `${TRIPS_PATH}?${params.toString()}`;
};

export const tripsHostedActivityPath = (
  activityId: string,
  view: 'overview' | 'checkin' = 'overview'
): string => {
  const params = new URLSearchParams();
  params.set('view', 'plans');
  params.set('role', 'hosted');
  if (view === 'checkin') {
    params.set('checkin', activityId);
  } else {
    params.set('peek', activityId);
  }
  return `${TRIPS_PATH}?${params.toString()}`;
};

export const tripsPath = (input?: {
  layer?: TripsHubLayer;
  segment?: TripsSegment;
  role?: TripsRole;
}): string => {
  if (input?.segment === 'completed') {
    return tripsCompletedPath(input?.role);
  }
  if (input?.segment === 'wishlist') {
    return tripsPlansPath('wishlist');
  }
  if (input?.role === 'hosted') {
    return tripsPlansPath('hosted');
  }
  if (input?.role === 'joined' || input?.role === 'self') {
    return tripsCompletedPath(input.role);
  }
  if (input?.layer === 'places' || input?.layer === 'shops') {
    const params = new URLSearchParams();
    params.set('view', 'plans');
    params.set('segment', 'wishlist');
    params.set('saved', input.layer);
    return `${TRIPS_PATH}?${params.toString()}`;
  }
  return tripsPlansPath('all');
};

export const tripsMapPath = () => '/trips/map';

export const TRIPS_MAIN_TABS: {
  id: TripsMainView;
  label: string;
  href: string;
}[] = [
  { id: 'plans', label: 'Plans', href: tripsPlansPath('all') },
  { id: 'completed', label: 'Completed', href: tripsCompletedPath() },
  { id: 'map', label: 'My Map', href: tripsMapPath() },
];

export const TRIPS_UNDERLINE_TABS: { id: 'upcoming' | 'completed'; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
];

/** @deprecated Use TRIPS_UNDERLINE_TABS + wishlist in filters */
export const TRIPS_SEGMENT_TABS: { id: TripsSegment; label: string }[] = [
  ...TRIPS_UNDERLINE_TABS,
  { id: 'wishlist', label: 'Wishlist' },
];

export type TripsSubviewPillId = TripsRole | 'wishlist';

/** History (Completed) tab — Joined / Hosted / Self trip filters. */
export const tripsHistoryRoleChips = (
  canHost: boolean
): { id: TripsRole; label: string }[] => {
  const chips: { id: TripsRole; label: string }[] = [{ id: 'joined', label: 'Joined' }];
  if (canHost) chips.push({ id: 'hosted', label: 'Hosted' });
  chips.push({ id: 'self', label: 'Self trip' });
  return chips;
};

/** @deprecated Use tripsHistoryRoleChips + TRIPS_PLANS_SUB_TABS */
export const tripsSubviewPills = (
  timeline: 'upcoming' | 'completed' | 'wishlist',
  canHost: boolean
): { id: TripsSubviewPillId; label: string }[] => {
  if (timeline === 'completed') {
    return tripsHistoryRoleChips(canHost);
  }
  return TRIPS_PLANS_SUB_TABS.map((t) => ({
    id: t.id === 'wishlist' ? 'wishlist' : 'joined',
    label: t.label,
  }));
};

/** @deprecated Use tripsSubviewPills */
export const tripsRoleChips = (
  segment: TripsSegment,
  canHost: boolean
): { id: TripsRole; label: string }[] =>
  tripsSubviewPills(segment === 'completed' ? 'completed' : 'upcoming', canHost).filter(
    (chip): chip is { id: TripsRole; label: string } => chip.id !== 'wishlist'
  );
