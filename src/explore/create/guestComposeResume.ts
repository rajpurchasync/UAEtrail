import { parseComposeWire } from '@uaetrail/shared-types';
import {
  clearExploreComposeParams,
  formatComposeQuery,
  setExploreComposeParam,
  type ExploreCompose,
} from '../compose';

const GUEST_COMPOSE_RESUME_KEY = 'uaetrail.compose.guestResume';

export type GuestComposeResume = {
  composeWire: string;
  fromMenu: boolean;
};

export const writeGuestComposeResumeSession = (payload: GuestComposeResume): void => {
  try {
    sessionStorage.setItem(GUEST_COMPOSE_RESUME_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota */
  }
};

export const readGuestComposeResumeSession = (): GuestComposeResume | null => {
  try {
    const raw = sessionStorage.getItem(GUEST_COMPOSE_RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestComposeResume;
    if (!parsed?.composeWire) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearGuestComposeResumeSession = (): void => {
  try {
    sessionStorage.removeItem(GUEST_COMPOSE_RESUME_KEY);
  } catch {
    /* ignore */
  }
};

/** Post-auth return URL — same surface (`/explore` or `/list`) with `?compose=` restored. */
export const buildComposeAuthReturnPath = (
  pathname: string,
  search: string,
  route: ExploreCompose
): string => {
  const query = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  clearExploreComposeParams(params);
  setExploreComposeParam(params, route);
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ''}`;
};

export const guestComposeResumeRoute = (resume: GuestComposeResume): ExploreCompose | null => {
  const route = parseComposeWire(resume.composeWire);
  if (!route || ('surface' in route && route.surface === 'menu')) return null;
  return route;
};

export const captureGuestComposeResume = (route: ExploreCompose, fromMenu: boolean): GuestComposeResume => ({
  composeWire: formatComposeQuery(route),
  fromMenu,
});
