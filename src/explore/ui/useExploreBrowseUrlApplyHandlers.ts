import { useCallback } from 'react';
import {
  activityFilterToMapFilter,
  mapFilterToActivityListFilter,
  mapFilterToVenueListFilter,
  venueFilterToMapFilter,
  type ActivityListFilterKey,
  type ExploreActivityDatePreset,
  type ExplorePanel,
  type MapFilterKey,
  type VenueListFilterKey,
} from '../routing';
import type { ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import { MAP_FILTERS_BY_BROWSE_TAB, parseDesktopBrowseTab, type DesktopBrowseTab } from './exploreBrowsePanelCopy';
import {
  desktopBrowseTabForSearchScope,
  explorePanelForSearchScope,
  pinKindForSearchScope,
  toggleExploreMapFilterPill,
  type ExploreMapFilterPillKey,
  type ExploreSearchScopeKey,
} from '../exploreBrowseTaxonomy';
import type { BrowseMainCategoryKey } from '../../list/browseListTaxonomy';
import type { ExploreBrowseUrlSyncPatch } from '../exploreBrowseUrlSync';
import type { BuddiesDiscoverySegment } from '../../list/buddiesDiscoverySegment';
import type { ExplorePinKindFilter } from '../explorePinKindFilter';
import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';
import type { ExploreActivityModeFilter } from '../exploreActivityModeFilter';
import type { ExploreBrowseListMode } from '../exploreBrowseUrlSync';

type SyncExploreUrl = (patch: ExploreBrowseUrlSyncPatch) => void;

type Setters = {
  setMapFilter: (v: MapFilterKey) => void;
  setActivityFilter: (v: ActivityListFilterKey) => void;
  setVenueFilter: (v: VenueListFilterKey) => void;
  setPanel: (v: ExplorePanel) => void;
  setListOpen: (v: boolean) => void;
  setBrowseOpen: (v: boolean) => void;
  setBuddySubtype: (v: ExploreBuddySubtypeKey) => void;
  setOutingTopic: (v: ExploreOutingTopicKey) => void;
  setPinKind: (v: ExplorePinKindFilter) => void;
  setTopicPills: (v: ExploreMapFilterPillKey[]) => void;
  setListMode: (v: ExploreBrowseListMode) => void;
  setPeopleBrowseOpen: (v: boolean) => void;
  setPeopleBrowseTab: (v: PeopleBrowseTab) => void;
  setBuddiesDiscoverSegment: (v: BuddiesDiscoverySegment) => void;
  setDesktopBrowseTab: (v: DesktopBrowseTab) => void;
  setActivityDatePreset: (v: ExploreActivityDatePreset) => void;
  setActivityModeFilter: (v: ExploreActivityModeFilter) => void;
  setVenueRegions: (v: string[]) => void;
  setSearchScope: (v: ExploreSearchScopeKey | null) => void;
};

export type UseExploreBrowseUrlApplyHandlersArgs = {
  isDesktop: boolean;
  clearSelection: () => void;
  syncExploreUrl: SyncExploreUrl;
  listOpen: boolean;
  browseOpen: boolean;
  panel: ExplorePanel;
  mapFilter: MapFilterKey;
  buddySubtype: ExploreBuddySubtypeKey;
  outingTopic: ExploreOutingTopicKey;
  topicPills: ExploreMapFilterPillKey[];
  query: string;
  searchScope: ExploreSearchScopeKey | null;
  listMode: ExploreBrowseListMode;
  setters: Setters;
};

/** Filter/panel/list URL apply handlers (C18; contract-stable with useExploreBrowseUrlState). */
export const useExploreBrowseUrlApplyHandlers = (args: UseExploreBrowseUrlApplyHandlersArgs) => {
  const {
    isDesktop,
    clearSelection,
    syncExploreUrl,
    listOpen,
    browseOpen,
    panel,
    mapFilter,
    buddySubtype,
    outingTopic,
    topicPills,
    query,
    searchScope,
    listMode,
    setters,
  } = args;

  const applyMapFilter = useCallback(
    (next: MapFilterKey) => {
      setters.setMapFilter(next);
      const nextSubtype = next === 'others' ? buddySubtype : 'all';
      const nextTopic = next === 'others' && nextSubtype === 'activities' ? outingTopic : 'all';
      if (next !== 'others') {
        setters.setBuddySubtype('all');
        setters.setOutingTopic('all');
      }
      clearSelection();
      const syncedActivity = mapFilterToActivityListFilter(next);
      const syncedVenue = mapFilterToVenueListFilter(next);
      setters.setActivityFilter(syncedActivity);
      setters.setVenueFilter(syncedVenue);
      syncExploreUrl({
        filter: next,
        activityFilter: syncedActivity,
        placesFilter: syncedVenue,
        buddySubtype: nextSubtype,
        outingTopic: nextTopic,
        list: listOpen,
      });
    },
    [buddySubtype, outingTopic, clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyBrowsePanel = useCallback(
    (next: ExplorePanel, options?: { openList?: boolean }) => {
      const openList = options?.openList ?? false;
      setters.setPanel(next);
      clearSelection();
      const tab = parseDesktopBrowseTab(next);
      const allowed = MAP_FILTERS_BY_BROWSE_TAB[tab];
      const nextFilter = allowed.includes(mapFilter) ? mapFilter : 'all';
      if (nextFilter !== mapFilter) {
        setters.setMapFilter(nextFilter);
        setters.setActivityFilter(mapFilterToActivityListFilter(nextFilter));
        setters.setVenueFilter(mapFilterToVenueListFilter(nextFilter));
      }
      if (isDesktop) {
        setters.setDesktopBrowseTab(tab);
      }
      syncExploreUrl({
        panel: next,
        list: openList ? true : listOpen,
        filter: nextFilter,
        activityFilter: mapFilterToActivityListFilter(nextFilter),
        placesFilter: mapFilterToVenueListFilter(nextFilter),
      });
      if (openList) {
        setters.setListOpen(true);
      }
    },
    [mapFilter, isDesktop, clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyActivityFilter = useCallback(
    (next: ActivityListFilterKey) => {
      if (!isDesktop) {
        applyBrowsePanel('activities');
        applyMapFilter(activityFilterToMapFilter(next) ?? 'all');
        return;
      }
      setters.setActivityFilter(next);
      clearSelection();
      const syncedMap = activityFilterToMapFilter(next);
      if (syncedMap && syncedMap !== mapFilter) {
        setters.setMapFilter(syncedMap);
        setters.setVenueFilter(mapFilterToVenueListFilter(syncedMap));
        setters.setPanel('activities');
        syncExploreUrl({
          activityFilter: next,
          filter: syncedMap,
          panel: 'activities',
          list: listOpen,
        });
        return;
      }
      syncExploreUrl({ activityFilter: next, list: listOpen });
    },
    [isDesktop, mapFilter, clearSelection, listOpen, applyBrowsePanel, applyMapFilter, setters, syncExploreUrl]
  );

  const applyPinKindFilter = useCallback(
    (next: ExplorePinKindFilter) => {
      setters.setPinKind(next);
      clearSelection();
      syncExploreUrl({ pinKind: next, list: listOpen });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const toggleMapTopicPill = useCallback(
    (key: ExploreMapFilterPillKey) => {
      const next = toggleExploreMapFilterPill(topicPills, key);
      setters.setTopicPills(next);
      clearSelection();
      syncExploreUrl({ topicPills: next, list: listOpen });
    },
    [topicPills, clearSelection, listOpen, setters, syncExploreUrl]
  );

  const clearMapTopicPills = useCallback(() => {
    setters.setTopicPills([]);
    clearSelection();
    syncExploreUrl({ topicPills: [], list: listOpen });
  }, [clearSelection, listOpen, setters, syncExploreUrl]);

  const openPeopleBrowsePanel = useCallback(
    (initialTab: PeopleBrowseTab = 'looking') => {
      clearSelection();
      setters.setPeopleBrowseTab(initialTab);
      setters.setPanel('activities');
      setters.setDesktopBrowseTab('activities');
      if (isDesktop) {
        setters.setPeopleBrowseOpen(true);
        setters.setListMode('default');
        syncExploreUrl({
          peopleBrowseOpen: true,
          listMode: 'default',
          peopleBrowseTab: initialTab,
          panel: 'activities',
          list: true,
        });
        return;
      }
      setters.setListMode('people');
      setters.setListOpen(true);
      setters.setBrowseOpen(false);
      syncExploreUrl({
        listMode: 'people',
        peopleBrowseTab: initialTab,
        panel: 'activities',
        list: true,
        browse: false,
      });
    },
    [isDesktop, clearSelection, setters, syncExploreUrl]
  );

  const closePeopleBrowsePanel = useCallback(() => {
    clearSelection();
    if (isDesktop) {
      setters.setPeopleBrowseOpen(false);
      setters.setListMode('default');
      syncExploreUrl({ peopleBrowseOpen: false, listMode: 'default' });
      return;
    }
    setters.setListMode('default');
    syncExploreUrl({ listMode: 'default' });
  }, [isDesktop, clearSelection, setters, syncExploreUrl]);

  const applyPeopleBrowseTab = useCallback(
    (tab: PeopleBrowseTab) => {
      setters.setPeopleBrowseTab(tab);
      setters.setBuddiesDiscoverSegment(tab);
      if (isDesktop) {
        syncExploreUrl({
          peopleBrowseOpen: true,
          listMode: 'default',
          peopleBrowseTab: tab,
          buddiesDiscoverSegment: tab,
          list: listOpen,
        });
        return;
      }
      syncExploreUrl({
        listMode: 'people',
        peopleBrowseTab: tab,
        buddiesDiscoverSegment: tab,
        list: listOpen,
      });
    },
    [isDesktop, listOpen, setters, syncExploreUrl]
  );

  const applyBuddiesDiscoverSegment = useCallback(
    (segment: BuddiesDiscoverySegment) => {
      setters.setBuddiesDiscoverSegment(segment);
      setters.setPeopleBrowseTab(segment);
      if (isDesktop) {
        syncExploreUrl({
          buddiesDiscoverSegment: segment,
          peopleBrowseTab: segment,
          peopleBrowseOpen: true,
          listMode: 'default',
          list: listOpen,
        });
        return;
      }
      syncExploreUrl({
        buddiesDiscoverSegment: segment,
        peopleBrowseTab: segment,
        listMode: 'people',
        list: listOpen,
      });
    },
    [isDesktop, listOpen, setters, syncExploreUrl]
  );

  const closeListPanel = useCallback(() => {
    setters.setListOpen(false);
    if (!isDesktop) {
      if (listMode === 'people') {
        setters.setListMode('default');
      }
      syncExploreUrl({ list: false, listMode: 'default' });
      return;
    }
    syncExploreUrl({ list: false });
  }, [isDesktop, listMode, setters, syncExploreUrl]);

  const applyBuddySubtype = useCallback(
    (next: ExploreBuddySubtypeKey) => {
      setters.setBuddySubtype(next);
      const nextTopic = next === 'activities' ? outingTopic : 'all';
      if (next !== 'activities') setters.setOutingTopic('all');
      clearSelection();
      syncExploreUrl({ buddySubtype: next, outingTopic: nextTopic, list: listOpen });
    },
    [outingTopic, clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyOutingTopic = useCallback(
    (next: ExploreOutingTopicKey) => {
      setters.setOutingTopic(next);
      clearSelection();
      syncExploreUrl({ outingTopic: next, list: listOpen });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyDesktopBrowseTab = useCallback(
    (next: DesktopBrowseTab) => {
      setters.setDesktopBrowseTab(next);
      clearSelection();
      setters.setMapFilter('all');
      setters.setActivityFilter('all');
      setters.setVenueFilter('all');
      const syncedPanel = next === 'venues' ? 'venues' : 'activities';
      setters.setPanel(syncedPanel);
      setters.setBuddySubtype('all');
      setters.setOutingTopic('all');
      syncExploreUrl({
        filter: 'all',
        activityFilter: 'all',
        buddySubtype: 'all',
        outingTopic: 'all',
        panel: syncedPanel,
        list: listOpen,
      });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyPanel = useCallback(
    (next: ExplorePanel) => applyBrowsePanel(next, { openList: true }),
    [applyBrowsePanel]
  );

  const openMapListPanel = useCallback(() => {
    clearSelection();
    setters.setListMode('default');
    if (!isDesktop) {
      setters.setBrowseOpen(false);
    }
    setters.setListOpen(true);
    syncExploreUrl({
      list: true,
      browse: isDesktop ? browseOpen : false,
      panel,
      listCat: null,
      listMode: 'default',
    });
  }, [isDesktop, browseOpen, panel, clearSelection, setters, syncExploreUrl]);

  const openDiscoverBrowse = useCallback(() => {
    clearSelection();
    setters.setListMode('default');
    setters.setBrowseOpen(true);
    if (!isDesktop) {
      setters.setListOpen(false);
      syncExploreUrl({ browse: true, list: false, listCat: null, listMode: 'default' });
      return;
    }
    syncExploreUrl({ browse: true, list: listOpen, listCat: null, listMode: 'default' });
  }, [isDesktop, listOpen, clearSelection, setters, syncExploreUrl]);

  const closeDiscoverBrowse = useCallback(() => {
    setters.setBrowseOpen(false);
    syncExploreUrl({ browse: false });
  }, [setters, syncExploreUrl]);

  const applyVenueFilter = useCallback(
    (next: VenueListFilterKey) => {
      setters.setVenueFilter(next);
      clearSelection();
      if (!isDesktop) {
        const syncedMap = venueFilterToMapFilter(next);
        applyBrowsePanel(next === 'shop' ? 'shops' : 'venues');
        if (syncedMap) {
          applyMapFilter(syncedMap);
        } else {
          applyMapFilter('all');
        }
        return;
      }
      const syncedMap = venueFilterToMapFilter(next);
      if (syncedMap && syncedMap !== mapFilter) {
        setters.setMapFilter(syncedMap);
        setters.setActivityFilter(mapFilterToActivityListFilter(syncedMap));
        setters.setPanel(syncedMap === 'shops' ? 'shops' : 'venues');
        syncExploreUrl({
          filter: syncedMap,
          activityFilter: mapFilterToActivityListFilter(syncedMap),
          placesFilter: next,
          panel: syncedMap === 'shops' ? 'shops' : 'venues',
          list: listOpen,
        });
        return;
      }
      syncExploreUrl({ placesFilter: next, list: listOpen });
    },
    [
      isDesktop,
      mapFilter,
      clearSelection,
      listOpen,
      applyBrowsePanel,
      applyMapFilter,
      setters,
      syncExploreUrl,
    ]
  );

  const applyActivityDatePreset = useCallback(
    (next: ExploreActivityDatePreset) => {
      setters.setActivityDatePreset(next);
      clearSelection();
      syncExploreUrl({ activityDatePreset: next, list: listOpen });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyActivityModeFilter = useCallback(
    (next: ExploreActivityModeFilter) => {
      setters.setActivityModeFilter(next);
      clearSelection();
      syncExploreUrl({ activityModeFilter: next, list: listOpen });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyVenueRegions = useCallback(
    (next: string[]) => {
      setters.setVenueRegions(next);
      clearSelection();
      syncExploreUrl({ venueRegions: next, list: listOpen });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const commitExploreSearch = useCallback(
    (scope?: ExploreSearchScopeKey | null) => {
      if (scope === 'facilities') return;
      clearSelection();
      setters.setListMode('default');
      const resolved = scope !== undefined ? scope : searchScope;
      setters.setSearchScope(resolved);
      if (resolved) {
        const syncedPanel = explorePanelForSearchScope(resolved);
        const syncedTab = desktopBrowseTabForSearchScope(resolved);
        const syncedPinKind = pinKindForSearchScope(resolved);
        setters.setPanel(syncedPanel);
        setters.setDesktopBrowseTab(syncedTab);
        setters.setPinKind(syncedPinKind);
        const discoverCategory: BrowseMainCategoryKey | null =
          resolved === 'people' ? 'people' : resolved === 'agencies' ? 'agencies' : null;
        if (discoverCategory) {
          setters.setBrowseOpen(true);
          setters.setListOpen(false);
          syncExploreUrl({
            q: query,
            browse: true,
            list: false,
            listMode: 'default',
            panel: syncedPanel,
            pinKind: syncedPinKind,
            searchScope: resolved,
            listCat: discoverCategory,
          });
          return;
        }
        setters.setBrowseOpen(false);
        setters.setListOpen(true);
        syncExploreUrl({
          q: query,
          list: true,
          browse: false,
          listMode: 'default',
          panel: syncedPanel,
          pinKind: syncedPinKind,
          searchScope: resolved,
          listCat: null,
        });
        return;
      }
      syncExploreUrl({ q: query, list: listOpen, listMode: 'default', searchScope: null });
    },
    [clearSelection, searchScope, query, listOpen, setters, syncExploreUrl]
  );

  return {
    applyMapFilter,
    applyPinKindFilter,
    toggleMapTopicPill,
    clearMapTopicPills,
    openPeopleBrowsePanel,
    closePeopleBrowsePanel,
    applyPeopleBrowseTab,
    applyBuddiesDiscoverSegment,
    closeListPanel,
    applyBuddySubtype,
    applyOutingTopic,
    applyDesktopBrowseTab,
    applyActivityFilter,
    applyBrowsePanel,
    applyPanel,
    openMapListPanel,
    openDiscoverBrowse,
    closeDiscoverBrowse,
    openBrowse: openMapListPanel,
    applyVenueFilter,
    applyActivityDatePreset,
    applyActivityModeFilter,
    applyVenueRegions,
    commitExploreSearch,
  };
};
