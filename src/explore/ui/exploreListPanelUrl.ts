import { parseBrowseDiscoverOpen } from '../../list/browseListUrlState';
import type { ExplorePanel, MapFilterKey } from '../routing';

/** `list=1` open, `list=0` closed; desktop defaults to list open (independent of discover browse). */
export const parseListOpen = (
  listParam: string | null,
  isDesktop: boolean,
  browseParam: string | null = null
): boolean => {
  if (!isDesktop && parseBrowseDiscoverOpen(browseParam)) return false;
  if (listParam === '1') return true;
  if (listParam === '0') return false;
  return isDesktop;
};

export const readInitialListOpen = (
  listParam: string | null,
  browseParam: string | null = null
): boolean => {
  const isDesktop =
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false;
  return parseListOpen(listParam, isDesktop, browseParam);
};

export const mapFilterToPanel = (filter: MapFilterKey): ExplorePanel => {
  if (filter === 'shops') return 'shops';
  return 'activities';
};
