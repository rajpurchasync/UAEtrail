import type { Location } from 'react-router-dom';
import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from '../config/platform';
import { detailBackPath } from '../config/routingCatalog';
import { planWishlistTabPath } from '../plan/planTab';
import { EXPLORE_JOIN_INVITE_QUERY_KEY, exploreSavedPinPath } from './routing';
import type { MobileBackNavState } from '../utils/mobileBackNav';
import { mobileBackNavState, planWishlistMobileBackState } from '../utils/mobileBackNav';
import { PRODUCT_PLAN_SURFACE_TITLE } from '../content/productNorthStar';

export type MapPeekDetailNavState = {
  detailBackTo: string;
};

/** Preserve explore/list URL filters and reopen the same map pin on back. */
export const buildMapPeekReturnPath = (
  mapItemId: string,
  location: Pick<Location, 'pathname' | 'search'>
): string => {
  const id = mapItemId.trim();
  if (!id) return detailBackPath('explore');

  const params = new URLSearchParams(location.search.replace(/^\?/, ''));
  params.set('pin', id);
  const qs = params.toString();

  if (location.pathname === EXPLORE_MAP_PATH || location.pathname.endsWith('/explore')) {
    return qs ? `${EXPLORE_MAP_PATH}?${qs}` : exploreSavedPinPath(id);
  }
  if (location.pathname === LIST_DISCOVERY_PATH || location.pathname.startsWith('/list')) {
    return qs ? `${location.pathname}?${qs}` : `${LIST_DISCOVERY_PATH}?pin=${encodeURIComponent(id)}`;
  }

  return exploreSavedPinPath(id);
};

/** Back from entity detail → explore/list map without reopening the pin peek. */
export const buildExploreReturnFromEntityDetail = (
  location: Pick<Location, 'pathname' | 'search'>
): string => {
  const params = new URLSearchParams(location.search.replace(/^\?/, ''));
  params.delete('pin');
  params.delete(EXPLORE_JOIN_INVITE_QUERY_KEY);
  const qs = params.toString();

  if (location.pathname === EXPLORE_MAP_PATH || location.pathname.endsWith('/explore')) {
    return qs ? `${EXPLORE_MAP_PATH}?${qs}` : EXPLORE_MAP_PATH;
  }
  if (location.pathname === LIST_DISCOVERY_PATH || location.pathname.startsWith('/list')) {
    return qs ? `${location.pathname}?${qs}` : LIST_DISCOVERY_PATH;
  }

  return detailBackPath('explore');
};

/** Router state when opening entity detail from a map pin summary — back returns to explore (no peek). */
export const mapPeekDetailNavState = (
  location?: Pick<Location, 'pathname' | 'search'>
): MapPeekDetailNavState => ({
  detailBackTo: location ? buildExploreReturnFromEntityDetail(location) : detailBackPath('explore'),
});

export const readDetailBackToFromLocation = (state: unknown): string | undefined => {
  if (!state || typeof state !== 'object') return undefined;
  const value = (state as MapPeekDetailNavState).detailBackTo;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

export type ActivityPlaceReturnState = MapPeekDetailNavState &
  MobileBackNavState & {
    /** Place back opens this outing again instead of a history entry that dropped the screen. */
    detailBackPrefersDeclared: true;
  };

/** Activity or hosting manage → tagged place. Back returns to `returnTo`. */
export const activityPlaceReturnState = (returnTo: string): ActivityPlaceReturnState => ({
  ...mobileBackNavState(returnTo, 'Outing'),
  detailBackTo: returnTo,
  detailBackPrefersDeclared: true,
});

export const readDetailBackPrefersDeclared = (state: unknown): boolean => {
  if (!state || typeof state !== 'object') return false;
  return (
    (state as { detailBackPrefersDeclared?: unknown }).detailBackPrefersDeclared === true &&
    Boolean(readDetailBackToFromLocation(state))
  );
};

/** Plan wishlist rows — activity / place detail back returns to saved tab. */
export const planWishlistEntityLinkState = (): MapPeekDetailNavState & MobileBackNavState => {
  const path = planWishlistTabPath();
  return {
    ...planWishlistMobileBackState(),
    detailBackTo: path,
  };
};

/** Plan upcoming row → activity detail; back returns to the same Plan URL (filter, layout). */
export const planUpcomingEntityLinkState = (
  returnTo: string
): MapPeekDetailNavState & MobileBackNavState => ({
  ...mobileBackNavState(returnTo, PRODUCT_PLAN_SURFACE_TITLE),
  detailBackTo: returnTo,
});

/** Profile history row → activity detail; back returns to the same history list. */
export const profileHistoryEntityLinkState = (
  returnTo: string
): MapPeekDetailNavState & MobileBackNavState => ({
  ...mobileBackNavState(returnTo, 'History'),
  detailBackTo: returnTo,
});
