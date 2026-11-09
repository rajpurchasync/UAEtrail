import { resolveMobileFiveTab } from '../../config/mobileFiveTabNav';
import type { BrowseListCreateFabHints } from '../../list/browseListCopy';
import type { ExploreCompose } from '../compose';

/** FAB tap — skip level-1 “I would like to…” where the tab context is known. */
export const resolveCreateFabComposeEntry = (
  pathname: string,
  search: string,
  hints?: BrowseListCreateFabHints
): ExploreCompose => {
  if (hints?.isPeopleCategory) return { surface: 'menu', intent: 'seek' };
  if (hints?.explorerBucket === 'places') return { surface: 'menu', intent: 'add' };

  const tab = resolveMobileFiveTab(pathname, search);
  if (tab === 'venues') return { surface: 'menu', intent: 'add' };
  if (tab === 'crews') return { surface: 'menu', intent: 'seek' };
  return { surface: 'menu', intent: 'host' };
};
