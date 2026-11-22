import type { NavigateFunction } from 'react-router-dom';
import { listDiscoveryPathFromExploreSearch } from '../../list/browse/browseListRouting';
import { writeMobileFiveTabProjection } from '../../config/mobileFiveTabNav';
import { parseExplorePanel } from '../routing';
import { exploreMapMobileBackState } from '../../utils/mobileBackNav';
import type { ExploreBrowseUrlSyncPatch } from '../exploreBrowseUrlSync';
import { exploreSearchListPathFromMapSearch } from '../search/exploreSearchRouting';

export const openExploreListFromMap = (input: {
  clearSelection: () => void;
  isDesktop: boolean;
  setCrewsBrowseOpen: (v: boolean) => void;
  setListMode: (v: import('../exploreBrowseUrlSync').ExploreBrowseListMode) => void;
  setListOpen: (v: boolean) => void;
  syncExploreUrl: (patch: ExploreBrowseUrlSyncPatch) => void;
  locationPathname: string;
  locationSearch: string;
  navigate: NavigateFunction;
  searchParamsString: string;
}): void => {
  input.clearSelection();
  if (input.locationPathname === '/explore/search' && input.locationSearch.includes('view=map')) {
    if (input.isDesktop) {
      input.setCrewsBrowseOpen(false);
      input.setListMode('default');
      input.setListOpen(false);
      input.syncExploreUrl({ list: false, listMode: 'default', crewsBrowseOpen: false });
    }
    input.navigate(exploreSearchListPathFromMapSearch(input.locationSearch), { replace: false });
    return;
  }
  if (input.isDesktop) {
    input.setCrewsBrowseOpen(false);
    input.setListMode('default');
    input.setListOpen(true);
    input.syncExploreUrl({ list: true, listMode: 'default', crewsBrowseOpen: false });
    return;
  }
  const params = new URLSearchParams(input.searchParamsString);
  const panel = parseExplorePanel(params.get('panel'));
  const tab = panel === 'venues' || panel === 'shops' ? 'venues' : 'trips';
  writeMobileFiveTabProjection(tab, 'list');

  const current = `${input.locationPathname}${input.locationSearch}`;
  input.navigate(listDiscoveryPathFromExploreSearch(input.searchParamsString), {
    state: exploreMapMobileBackState(current),
  });
};