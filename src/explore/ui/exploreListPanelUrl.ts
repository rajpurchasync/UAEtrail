import type { ExplorePanel, MapFilterKey } from '../routing';

/** `list=1` open, `list=0` closed; desktop defaults to list open. */
export const parseListOpen = (listParam: string | null, isDesktop: boolean): boolean => {
  if (listParam === '1') return true;
  if (listParam === '0') return false;
  return isDesktop;
};

export const readInitialListOpen = (listParam: string | null): boolean => {
  const isDesktop =
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false;
  return parseListOpen(listParam, isDesktop);
};

export const mapFilterToPanel = (filter: MapFilterKey): ExplorePanel => {
  if (filter === 'shops') return 'shops';
  return 'activities';
};
