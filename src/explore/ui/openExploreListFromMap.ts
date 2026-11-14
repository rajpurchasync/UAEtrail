import type { NavigateFunction } from 'react-router-dom';
import { listDiscoveryPathFromExploreSearch } from '../../list/routing';
import { exploreMapMobileBackState } from '../../utils/mobileBackNav';
import type { ExploreBrowseUrlSyncPatch } from '../exploreBrowseUrlSync';

export const openExploreListFromMap = (input: {
  clearSelection: () => void;
  isDesktop: boolean;
  setPeopleBrowseOpen: (v: boolean) => void;
  setListMode: (v: import('../exploreBrowseUrlSync').ExploreBrowseListMode) => void;
  setListOpen: (v: boolean) => void;
  syncExploreUrl: (patch: ExploreBrowseUrlSyncPatch) => void;
  locationPathname: string;
  locationSearch: string;
  navigate: NavigateFunction;
  searchParamsString: string;
}): void => {
  input.clearSelection();
  if (input.isDesktop) {
    input.setPeopleBrowseOpen(false);
    input.setListMode('default');
    input.setListOpen(true);
    input.syncExploreUrl({ list: true, listMode: 'default', peopleBrowseOpen: false });
    return;
  }
  const current = `${input.locationPathname}${input.locationSearch}`;
  input.navigate(listDiscoveryPathFromExploreSearch(input.searchParamsString), {
    state: exploreMapMobileBackState(current),
  });
};