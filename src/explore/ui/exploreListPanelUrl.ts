import { parseBrowseDiscoverOpen } from '../../discovery/discoverySessionParams';
import type { ExplorePanel, MapFilterKey } from '../routing';

/**
 * Desktop: `list=1` opens the map-side catalog drawer.
 * Mobile: `list=1` only opens the People sheet (`view=people`); catalog list is `/list`.
 */
export const parseListOpen = (
  listParam: string | null,
  isDesktop: boolean,
  browseParam: string | null = null,
  peopleView = false
): boolean => {
  if (parseBrowseDiscoverOpen(browseParam)) return false;
  if (listParam === '0') return false;
  if (isDesktop) return listParam === '1' && !peopleView;
  if (!peopleView) return false;
  return true;
};

export const readInitialListOpen = (
  listParam: string | null,
  browseParam: string | null = null,
  peopleView = false
): boolean => {
  const isDesktop =
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false;
  return parseListOpen(listParam, isDesktop, browseParam, peopleView);
};

export const mapFilterToPanel = (filter: MapFilterKey): ExplorePanel => {
  if (filter === 'shops') return 'shops';
  return 'activities';
};
