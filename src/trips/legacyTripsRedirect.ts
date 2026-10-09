import {
  ACTIVITIES_LEGACY_PATH,
  MY_TRIPS_MAP_PATH,
  MY_TRIPS_PATH,
  PLAN_PATH,
  TRIPS_PATH,
} from '../config/surfacePaths';
import { planSavedPath } from '../plan/planLens';
import { normalizeTripsSearchParams } from './tripsRouting';

const LEGACY_HUB_PATHS = new Set<string>([TRIPS_PATH, ACTIVITIES_LEGACY_PATH]);

/**
 * Map legacy `/trips`, `/activities`, and `/trips/map` to {@link PLAN_PATH} or {@link MY_TRIPS_PATH}.
 */
export const resolveLegacyTripsHubRedirect = (
  pathname: string,
  search: string,
  options?: { canHost?: boolean }
): string | null => {
  if (pathname === '/trips/map' || pathname.endsWith('/trips/map')) {
    const qs = search.replace(/^\?/, '');
    return qs ? `${MY_TRIPS_MAP_PATH}?${qs}` : MY_TRIPS_MAP_PATH;
  }

  if (!LEGACY_HUB_PATHS.has(pathname)) return null;

  const params = new URLSearchParams(search.replace(/^\?/, ''));
  const view = params.get('view');
  const segment = params.get('segment');
  const legacyTab = params.get('tab');
  const legacySub = params.get('sub');

  if (view === 'map') {
    const qs = params.toString();
    return qs ? `${MY_TRIPS_MAP_PATH}?${qs}` : MY_TRIPS_MAP_PATH;
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
      normalizeTripsSearchParams(next, options.canHost);
    }
    next.set('view', 'completed');
    const qs = next.toString();
    return qs ? `${MY_TRIPS_PATH}?${qs}` : `${MY_TRIPS_PATH}?view=completed`;
  }

  if (segment === 'wishlist' || params.get('saved')) {
    return planSavedPath();
  }

  const next = new URLSearchParams(params);
  if (options?.canHost !== undefined) {
    normalizeTripsSearchParams(next, options.canHost);
  }
  next.set('view', 'plans');
  if (segment === 'completed' || segment === 'past') {
    next.delete('segment');
  }
  const qs = next.toString();
  return qs ? `${PLAN_PATH}?${qs}` : PLAN_PATH;
};
