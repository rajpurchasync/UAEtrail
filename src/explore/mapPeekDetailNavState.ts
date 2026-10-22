import type { Location } from 'react-router-dom';
import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from '../config/platform';
import { detailBackPath } from '../config/routingCatalog';
import { exploreSavedPinPath } from './routing';

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

/** Router state when opening entity detail from a map pin summary — back returns to the map peek. */
export const mapPeekDetailNavState = (
  location?: Pick<Location, 'pathname' | 'search'>,
  mapItemId?: string | null
): MapPeekDetailNavState => ({
  detailBackTo:
    location && mapItemId?.trim()
      ? buildMapPeekReturnPath(mapItemId, location)
      : detailBackPath('explore'),
});

export const readDetailBackToFromLocation = (state: unknown): string | undefined => {
  if (!state || typeof state !== 'object') return undefined;
  const value = (state as MapPeekDetailNavState).detailBackTo;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};
