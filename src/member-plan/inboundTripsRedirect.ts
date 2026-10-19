import {
  INBOUND_ACTIVITIES_HUB_PATH,
  JOURNEY_MAP_PATH,
  PLAN_PATH,
  PROFILE_HISTORY_PATH,
  INBOUND_TRIPS_MAP_PATH,
  TRIPS_PATH,
} from '../config/surfacePaths';
import { planSavedPath } from '../plan/planLens';
import { normalizePlanHubSearchParams } from './planHubRouting';

const INBOUND_HUB_PATHS = new Set<string>([TRIPS_PATH, INBOUND_ACTIVITIES_HUB_PATH]);

/** Map inbound `/trips`, `/activities`, and `/trips/map` to {@link PLAN_PATH} or {@link PROFILE_HISTORY_PATH}. */
export const resolveInboundTripsHubRedirect = (
  pathname: string,
  search: string,
  options?: { canHost?: boolean }
): string | null => {
  if (pathname === INBOUND_TRIPS_MAP_PATH || pathname.endsWith(INBOUND_TRIPS_MAP_PATH)) {
    const qs = search.replace(/^\?/, '');
    return qs ? `${JOURNEY_MAP_PATH}?${qs}` : JOURNEY_MAP_PATH;
  }

  if (!INBOUND_HUB_PATHS.has(pathname)) return null;

  const params = new URLSearchParams(search.replace(/^\?/, ''));
  const view = params.get('view');
  const segment = params.get('segment');
  const legacyTab = params.get('tab');
  const legacySub = params.get('sub');

  if (view === 'map') {
    const qs = params.toString();
    return qs ? `${JOURNEY_MAP_PATH}?${qs}` : JOURNEY_MAP_PATH;
  }

  const wantsHistory =
    view === 'completed' ||
    view === 'history' ||
    segment === 'completed' ||
    segment === 'past' ||
    legacySub === 'attended' ||
    (legacyTab === 'joined' && segment === 'completed');

  if (wantsHistory) {
    const next = new URLSearchParams(params);
    if (options?.canHost !== undefined) {
      normalizePlanHubSearchParams(next, options.canHost);
    }
    next.set('view', 'completed');
    const qs = next.toString();
    return qs ? `${PROFILE_HISTORY_PATH}?${qs}` : `${PROFILE_HISTORY_PATH}?view=completed`;
  }

  if (segment === 'wishlist' || params.get('saved')) {
    return planSavedPath();
  }

  const next = new URLSearchParams(params);
  if (options?.canHost !== undefined) {
    normalizePlanHubSearchParams(next, options.canHost);
  }
  next.set('view', 'plans');
  if (segment === 'completed' || segment === 'past') {
    next.delete('segment');
  }
  const qs = next.toString();
  return qs ? `${PLAN_PATH}?${qs}` : PLAN_PATH;
};
