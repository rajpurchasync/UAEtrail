import { parseBrowseDiscoverOpen } from '../../list/browseListUrlState';
import type { ExplorePanel, MapFilterKey } from '../routing';

/**
 * Map-aligned catalog list panel is retired (`/list` explorer).
 * `list=1` only opens the People sheet on mobile.
 */
export const parseListOpen = (
  listParam: string | null,
  isDesktop: boolean,
  browseParam: string | null = null,
  peopleView = false
): boolean => {
  if (!peopleView) return false;
  if (isDesktop) return false;
  if (parseBrowseDiscoverOpen(browseParam)) return false;
  if (listParam === '0') return false;
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
