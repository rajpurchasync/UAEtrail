import { resolveMobileFiveTab } from '../../config/mobileFiveTabNav';
import type { BrowseListCreateFabHints } from '../../list/browseListCopy';
import type { ExploreCompose } from '../compose';
import type { ExplorePinKindFilter } from '../explorePinKindFilter';
import type { ExploreBrowseListMode } from '../exploreBrowseUrlSync';
import type { ExplorePanel } from '../routing';
import { explorePanelToBrowseListBucket } from '../ui/exploreMapQuickFiltersState';

/** Live map browse scope — URL can lag while Trips/Venues tabs update. */
export const resolveExploreMapCreateFabHints = (input: {
  panel: ExplorePanel;
  peopleBrowseOpen: boolean;
  listMode: ExploreBrowseListMode;
  pinKind: ExplorePinKindFilter;
  placesMode: boolean;
}): BrowseListCreateFabHints | undefined => {
  if (input.peopleBrowseOpen || input.listMode === 'people') {
    return { isPeopleCategory: true };
  }
  if (
    input.placesMode ||
    explorePanelToBrowseListBucket(input.panel) === 'places' ||
    input.pinKind === 'places' ||
    input.pinKind === 'shops'
  ) {
    return { explorerBucket: 'places' };
  }
  return undefined;
};

/**
 * Tab FAB entry — maps to product pillar menu (`host` · `add` · `availability` wire).
 * Trips → Host · Venues → Add · Crews → Availability (Find a Crew).
 */
export const resolveCreateFabComposeEntry = (
  pathname: string,
  search: string,
  hints?: BrowseListCreateFabHints
): ExploreCompose => {
  if (hints?.isPeopleCategory) return { surface: 'menu', intent: 'availability' };
  if (hints?.explorerBucket === 'places') return { surface: 'menu', intent: 'add' };

  const tab = resolveMobileFiveTab(pathname, search);
  if (tab === 'venues') return { surface: 'menu', intent: 'add' };
  if (tab === 'crews') return { surface: 'menu', intent: 'availability' };
  return { surface: 'menu', intent: 'host' };
};
