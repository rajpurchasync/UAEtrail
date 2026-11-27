import { useCallback } from 'react';
import { listDiscoveryPath } from '../../../discovery/discoverySession';
import { exploreMapMobileBackState } from '../../../utils/mobileBackNav';
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
} from '../../routing';
import type { ExploreOthersSubtypeKey } from '../../exploreOthersSubtype';
import type { ExploreOutingTopicKey } from '../../exploreOutingTopic';
import { MAP_FILTERS_BY_BROWSE_TAB, parseDesktopBrowseTab, type DesktopBrowseTab } from '../exploreBrowsePanelCopy';
import {
  desktopBrowseTabForSearchScope,
  explorePanelForSearchScope,
  pinKindForSearchScope,
  toggleExploreMapFilterPill,
  type ExploreMapFilterPillKey,
  type ExploreSearchScopeKey,
} from '../../exploreBrowseTaxonomy';
import type { BrowseMainCategoryKey } from '../../../discovery/discoverySession';
import type { CrewBrowseLane, CrewPeopleFacet } from '@/crew-discovery/crewBrowseState';
import { DEFAULT_CREW_BROWSE_LANE, DEFAULT_CREW_PEOPLE_FACET } from '@/crew-discovery/crewBrowseState';
import type { ExplorePinKindFilter } from '../../explorePinKindFilter';
import type { ExploreActivityModeFilter } from '../../exploreActivityModeFilter';
import type { PlaceKind } from '@uaetrail/shared-types';
import type { ExplorePriceFilter, ExploreVenueFilterPatch } from '../../exploreOptionalFilters';
import {
  effectivePlaceMapTopics,
  effectiveTripMapTopics,
  togglePlaceMapTopic as togglePlaceMapTopicInList,
  toggleTripMapTopic as toggleTripMapTopicInList,
  type PlaceMapTopicKey,
  type TripMapTopicKey,
} from '../../exploreMapQuickTopicFilters';
import type { UseExploreBrowseUrlApplyHandlersArgs } from './types';
import { placeTopicToVenueFilter, tripTopicToActivityFilter } from './topicMaps';

export type { UseExploreBrowseUrlApplyHandlersArgs } from './types';

/** Filter/panel/list URL apply handlers (C18; contract-stable with useExploreBrowseUrlState). */
export const useExploreBrowseUrlApplyHandlers = (args: UseExploreBrowseUrlApplyHandlersArgs) => {
  const {
    isDesktop,
    isSignedIn: _isSignedIn,
    navigate,
    clearSelection,
    syncExploreUrl,
    listOpen,
    browseOpen,
    panel,
    mapFilter,
    othersSubtype,
    outingTopic,
    topicPills,
    tripMapTopics,
    placeMapTopics,
    activityFilter: _activityFilter,
    venueFilter,
    query,
    searchScope,
    listMode,
    exploreReturnPath,
    setters,
  } = args;

  const toggleTripMapTopic = useCallback(
    (key: TripMapTopicKey) => {
      const current = effectiveTripMapTopics(mapFilter, tripMapTopics);
      const next = toggleTripMapTopicInList(current, key);
      const nextActivityFilter = tripTopicToActivityFilter(next);
      setters.setTripMapTopics(next);
      setters.setMapFilter('all');
      setters.setActivityFilter(nextActivityFilter);
      setters.setOthersSubtype('all');
      setters.setOutingTopic('all');
      clearSelection();
      syncExploreUrl({
        filter: 'all',
        tripMapTopics: next,
        activityFilter: nextActivityFilter,
        othersSubtype: 'all',
        outingTopic: 'all',
        list: listOpen,
      });
    },
    [clearSelection, listOpen, mapFilter, setters, syncExploreUrl, tripMapTopics]
  );

  const togglePlaceMapTopic = useCallback(
    (key: PlaceMapTopicKey) => {
      const current = effectivePlaceMapTopics(mapFilter, venueFilter, placeMapTopics);
      const next = togglePlaceMapTopicInList(current, key);
      const nextVenueFilter = placeTopicToVenueFilter(next);
      setters.setPlaceMapTopics(next);
      setters.setMapFilter('all');
      setters.setVenueFilter(nextVenueFilter);
      clearSelection();
      syncExploreUrl({
        filter: 'all',
        placeMapTopics: next,
        placesFilter: nextVenueFilter,
        list: listOpen,
      });
    },
    [clearSelection, listOpen, mapFilter, placeMapTopics, setters, syncExploreUrl, venueFilter]
  );

  const applyMapFilter = useCallback(
    (next: MapFilterKey) => {
      setters.setMapFilter(next);
      setters.setTripMapTopics([]);
      setters.setPlaceMapTopics([]);
      const nextSubtype = next === 'others' ? othersSubtype : 'all';
      const nextTopic = next === 'others' && nextSubtype === 'activities' ? outingTopic : 'all';
      if (next !== 'others') {
        setters.setOthersSubtype('all');
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
        othersSubtype: nextSubtype,
        outingTopic: nextTopic,
        tripMapTopics: [],
        placeMapTopics: [],
        list: listOpen,
      });
    },
    [othersSubtype, outingTopic, clearSelection, listOpen, setters, syncExploreUrl]
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

  const openCrewsBrowsePanel = useCallback(
    (initialLane: CrewBrowseLane = DEFAULT_CREW_BROWSE_LANE) => {
      clearSelection();
      setters.setCrewBrowseLane(initialLane);
      setters.setCrewPeopleFacet(DEFAULT_CREW_PEOPLE_FACET);
      setters.setPanel('activities');
      setters.setDesktopBrowseTab('activities');
      if (isDesktop) {
        setters.setCrewsBrowseOpen(false);
        setters.setListMode('default');
        setters.setListOpen(true);
        syncExploreUrl({
          crewsBrowseOpen: false,
          listMode: 'default',
          crewBrowseLane: initialLane,
          crewPeopleFacet: DEFAULT_CREW_PEOPLE_FACET,
          panel: 'activities',
          list: true,
          listCat: 'people',
        });
        return;
      }
      const peoplePath = listDiscoveryPath({
        listCat: 'people',
        categories: ['people'],
        crewBrowseLane: initialLane,
        crewPeopleFacet: DEFAULT_CREW_PEOPLE_FACET,
        query,
        activityDatePreset: 'anyday',
      });
      navigate(peoplePath, {
        state: exploreMapMobileBackState(exploreReturnPath),
      });
    },
    [isDesktop, clearSelection, exploreReturnPath, navigate, query, setters, syncExploreUrl]
  );

  const closeCrewsBrowsePanel = useCallback(() => {
    clearSelection();
    if (isDesktop) {
      setters.setCrewsBrowseOpen(false);
      setters.setListMode('default');
      syncExploreUrl({ crewsBrowseOpen: false, listMode: 'default' });
      return;
    }
    setters.setListMode('default');
    syncExploreUrl({ listMode: 'default' });
  }, [isDesktop, clearSelection, setters, syncExploreUrl]);

  const applyCrewBrowseLane = useCallback(
    (lane: CrewBrowseLane) => {
      setters.setCrewBrowseLane(lane);
      if (isDesktop) {
        syncExploreUrl({
          crewsBrowseOpen: true,
          listMode: 'default',
          crewBrowseLane: lane,
          list: listOpen,
        });
        return;
      }
      syncExploreUrl({
        listMode: 'crews',
        crewBrowseLane: lane,
        list: listOpen,
      });
    },
    [isDesktop, listOpen, setters, syncExploreUrl]
  );

  const applyCrewPeopleFacet = useCallback(
    (facet: CrewPeopleFacet) => {
      setters.setCrewPeopleFacet(facet);
      if (isDesktop) {
        syncExploreUrl({
          crewsBrowseOpen: true,
          listMode: 'default',
          crewPeopleFacet: facet,
          list: listOpen,
        });
        return;
      }
      syncExploreUrl({
        listMode: 'crews',
        crewPeopleFacet: facet,
        list: listOpen,
      });
    },
    [isDesktop, listOpen, setters, syncExploreUrl]
  );

  const closeListPanel = useCallback(() => {
    setters.setListOpen(false);
    if (!isDesktop) {
      if (listMode === 'crews') {
        setters.setListMode('default');
      }
      syncExploreUrl({ list: false, listMode: 'default' });
      return;
    }
    syncExploreUrl({ list: false, browse: false });
  }, [isDesktop, listMode, setters, syncExploreUrl]);

  const applyOthersSubtype = useCallback(
    (next: ExploreOthersSubtypeKey) => {
      setters.setOthersSubtype(next);
      const nextTopic = next === 'activities' ? outingTopic : 'all';
      if (next !== 'activities') setters.setOutingTopic('all');
      clearSelection();
      syncExploreUrl({ othersSubtype: next, outingTopic: nextTopic, list: listOpen });
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
      setters.setOthersSubtype('all');
      setters.setOutingTopic('all');
      syncExploreUrl({
        filter: 'all',
        activityFilter: 'all',
        othersSubtype: 'all',
        outingTopic: 'all',
        panel: syncedPanel,
        list: listOpen,
      });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyPanel = useCallback(
    (next: ExplorePanel) => applyBrowsePanel(next),
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
      syncExploreUrl({
        venueRegions: next,
        ...(next.length > 0 ? { geoPath: [] as string[] } : {}),
        list: listOpen,
      });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyGeoPath = useCallback(
    (next: string[]) => {
      setters.setGeoPath(next);
      clearSelection();
      syncExploreUrl({ geoPath: next, list: listOpen });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyTripMapTopics = useCallback(
    (next: TripMapTopicKey[]) => {
      const nextActivityFilter = tripTopicToActivityFilter(next);
      setters.setTripMapTopics(next);
      setters.setMapFilter('all');
      setters.setActivityFilter(nextActivityFilter);
      setters.setOthersSubtype('all');
      setters.setOutingTopic('all');
      clearSelection();
      syncExploreUrl({
        filter: 'all',
        tripMapTopics: next,
        activityFilter: nextActivityFilter,
        othersSubtype: 'all',
        outingTopic: 'all',
        list: listOpen,
      });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyPlaceMapTopics = useCallback(
    (next: PlaceMapTopicKey[]) => {
      const nextVenueFilter = placeTopicToVenueFilter(next);
      setters.setPlaceMapTopics(next);
      setters.setMapFilter('all');
      setters.setVenueFilter(nextVenueFilter);
      clearSelection();
      syncExploreUrl({
        filter: 'all',
        placeMapTopics: next,
        placesFilter: nextVenueFilter,
        list: listOpen,
      });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyVenueFilters = useCallback(
    (next: ExploreVenueFilterPatch) => {
      const nextVenueFilter = placeTopicToVenueFilter(next.placeTopics);
      setters.setPlaceMapTopics(next.placeTopics);
      setters.setFacilityKinds(next.facilityKinds);
      setters.setMapFilter('all');
      setters.setVenueFilter(nextVenueFilter);
      clearSelection();
      syncExploreUrl({
        filter: 'all',
        placeMapTopics: next.placeTopics,
        placesFilter: nextVenueFilter,
        facilityKinds: next.facilityKinds,
        list: listOpen,
      });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyPriceFilter = useCallback(
    (next: ExplorePriceFilter) => {
      setters.setPriceFilter(next);
      clearSelection();
      syncExploreUrl({ priceFilter: next, list: listOpen });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyHasTrip = useCallback(
    (next: boolean) => {
      setters.setHasTrip(next);
      clearSelection();
      syncExploreUrl({ hasTrip: next, list: listOpen });
    },
    [clearSelection, listOpen, setters, syncExploreUrl]
  );

  const applyFacilityKinds = useCallback(
    (next: PlaceKind[]) => {
      setters.setFacilityKinds(next);
      if (next.length > 0) {
        const current = effectivePlaceMapTopics(mapFilter, venueFilter, placeMapTopics);
        if (!current.includes('facilities')) {
          applyPlaceMapTopics([...current, 'facilities']);
        }
      }
      clearSelection();
      syncExploreUrl({ facilityKinds: next, list: listOpen });
    },
    [
      applyPlaceMapTopics,
      clearSelection,
      listOpen,
      mapFilter,
      placeMapTopics,
      setters,
      syncExploreUrl,
      venueFilter,
    ]
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
    openCrewsBrowsePanel,
    closeCrewsBrowsePanel,
    applyCrewBrowseLane,
    applyCrewPeopleFacet,
    closeListPanel,
    applyOthersSubtype,
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
    applyGeoPath,
    commitExploreSearch,
    toggleTripMapTopic,
    togglePlaceMapTopic,
    applyTripMapTopics,
    applyPlaceMapTopics,
    applyVenueFilters,
    applyPriceFilter,
    applyHasTrip,
    applyFacilityKinds,
  };
};
