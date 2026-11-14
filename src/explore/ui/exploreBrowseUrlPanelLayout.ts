import { MAP_FILTER_PILLS } from '../../config/exploreMapFilters';
import type { ExplorePanel, MapFilterKey } from '../routing';
import { MAP_FILTERS_BY_BROWSE_TAB, type DesktopBrowseTab } from './exploreBrowsePanelCopy';
import { mapFilterToPanel } from './exploreListPanelUrl';
import type { ExploreBrowseListMode } from '../exploreBrowseUrlSync';

export const resolveExploreBrowsePanelLayout = (input: {
  isDesktop: boolean;
  panel: ExplorePanel;
  desktopBrowseTab: DesktopBrowseTab;
  listOpen: boolean;
  listMode: ExploreBrowseListMode;
  peopleBrowseOpen: boolean;
  mapFilter: MapFilterKey;
}) => {
  const showListPanel = input.listOpen && input.listMode === 'people';
  const showDesktopCatalogDrawer = input.isDesktop && !input.peopleBrowseOpen;
  const sidebarPanel: ExplorePanel = input.isDesktop
    ? input.panel === 'venues'
      ? 'venues'
      : mapFilterToPanel(input.mapFilter)
    : input.panel;
  const tab = input.isDesktop
    ? input.desktopBrowseTab
    : input.panel === 'venues'
      ? 'venues'
      : 'activities';
  const allowed = MAP_FILTERS_BY_BROWSE_TAB[tab];
  const contextualMapFilters = MAP_FILTER_PILLS.filter((pill) => allowed.includes(pill.key));
  const desktopFilterKeys = contextualMapFilters.map((pill) => pill.key);
  const browseFilterKeys: MapFilterKey[] = input.isDesktop
    ? desktopFilterKeys
    : [...MAP_FILTERS_BY_BROWSE_TAB[input.panel === 'venues' ? 'venues' : 'activities']];
  const placesMode = input.isDesktop ? input.desktopBrowseTab === 'venues' : input.panel === 'venues';
  return {
    showListPanel,
    showDesktopCatalogDrawer,
    sidebarPanel,
    contextualMapFilters,
    desktopFilterKeys,
    browseFilterKeys,
    placesMode,
  };
};