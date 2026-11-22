import { resolveMobileFiveTab } from '../../config/mobileFiveTabNav';
import type { BrowseListCreateFabHints } from '../../list/browse/browseListCopy';
import { intentOpenCompose, type ExploreCompose } from '../compose';
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
 * Tab FAB entry — `activity` · `place` · `intent:open` compose kinds.
 * Trips → activity · Venues → place · Crews → intent:open.
 */
export const resolveCreateEntryPreset = (
  pathname: string,
  search: string,
  hints?: BrowseListCreateFabHints
): ExploreCompose => {
  if (hints?.isPeopleCategory) return intentOpenCompose();
  if (hints?.explorerBucket === 'places') return { surface: 'menu', composeKind: 'place' };

  const tab = resolveMobileFiveTab(pathname, search);
  if (tab === 'venues') return { surface: 'menu', composeKind: 'place' };
  if (tab === 'crews') return intentOpenCompose();
  return { surface: 'menu', composeKind: 'activity' };
};
