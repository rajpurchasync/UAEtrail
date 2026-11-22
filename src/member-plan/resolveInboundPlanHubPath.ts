import {
  INBOUND_PLAN_HUB_TRIPS_MAP_PATH,
  INBOUND_PLAN_HUB_PATHNAMES,
} from '../config/inboundBookmarkPaths';
import {
  JOURNEY_MAP_PATH,
  PLAN_PATH,
  PROFILE_HISTORY_PATH,
} from '../config/surfacePaths';
import { planSavedPath } from '../plan/planLens';
import { normalizePlanHubSearchParams } from '../plan/planRouting';

/** Map stale plan-hub URLs in notification meta to {@link PLAN_PATH} or history. */
export const resolveInboundPlanHubPath = (
  pathname: string,
  search: string,
  options?: { canHost?: boolean }
): string | null => {
  if (pathname === INBOUND_PLAN_HUB_TRIPS_MAP_PATH || pathname.endsWith(INBOUND_PLAN_HUB_TRIPS_MAP_PATH)) {
    const qs = search.replace(/^\?/, '');
    return qs ? `${JOURNEY_MAP_PATH}?${qs}` : JOURNEY_MAP_PATH;
  }

  if (!INBOUND_PLAN_HUB_PATHNAMES.has(pathname)) return null;

  const params = new URLSearchParams(search.replace(/^\?/, ''));
  const view = params.get('view');
  const segment = params.get('segment');
  const inboundTab = params.get('tab');
  const inboundSub = params.get('sub');

  if (view === 'map') {
    const qs = params.toString();
    return qs ? `${JOURNEY_MAP_PATH}?${qs}` : JOURNEY_MAP_PATH;
  }

  const wantsHistory =
    view === 'completed' ||
    view === 'history' ||
    segment === 'completed' ||
    segment === 'past' ||
    inboundSub === 'attended' ||
    (inboundTab === 'joined' && segment === 'completed');

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
