import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { MAP_FILTER_PILLS } from '../../config/exploreMapFilters';
import {
  activityFilterToMapFilter,
  mapFilterToActivityListFilter,
  mapFilterToVenueListFilter,
  parseActivityListFilter,
  parseExplorePanel,
  parseExploreActivityDatePreset,
  parseMapFilter,
  parseVenueListFilter,
  parseVenueRegionsParam,
  venueFilterToMapFilter,
  type ActivityListFilterKey,
  type ExplorePanel,
  type MapFilterKey,
  type VenueListFilterKey,
  type ExploreActivityDatePreset,
} from '../routing';
import { parseExploreBuddySubtype, type ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import { parseExploreOutingTopic, type ExploreOutingTopicKey } from '../exploreOutingTopic';
import { MAP_FILTERS_BY_BROWSE_TAB, parseDesktopBrowseTab, type DesktopBrowseTab } from './exploreBrowsePanelCopy';
import { mapFilterToPanel, parseListOpen, readInitialListOpen } from './exploreListPanelUrl';
import {
  desktopBrowseTabForSearchScope,
  explorePanelForSearchScope,
  parseExploreMapFilterPillsParam,
  parseExploreSearchScope,
  pinKindForSearchScope,
  toggleExploreMapFilterPill,
  type ExploreMapFilterPillKey,
  type ExploreSearchScopeKey,
} from '../exploreBrowseTaxonomy';
import type { BrowseMainCategoryKey } from '../../list/browseListTaxonomy';
import { BROWSE_DISCOVER_PARAM, parseBrowseDiscoverOpen } from '../../list/browseListUrlState';
import {
  buildExploreBrowseSearchParams,
  type ExploreBrowseListMode,
  type ExploreBrowseUrlSyncPatch,
} from '../exploreBrowseUrlSync';
import { useExploreBrowseUrlLegacyMigrations } from './useExploreBrowseUrlLegacyMigrations';
import {
  BUDDIES_SEGMENT_URL_PARAM,
  parseBuddiesDiscoverySegment,
  type BuddiesDiscoverySegment,
} from '../../list/buddiesDiscoverySegment';
import { parseExplorePinKindFilter, type ExplorePinKindFilter } from '../explorePinKindFilter';
import { parsePeopleBrowseTabFromUrl, type PeopleBrowseTab } from '../peopleBrowseTab.js';
import {
  EXPLORE_ACTIVITY_MODE_FILTER_PARAM,
  parseExploreActivityModeFilter,
  type ExploreActivityModeFilter,
} from '../exploreActivityModeFilter';

export type { ExploreBrowseListMode } from '../exploreBrowseUrlSync';

/** Sub-segment on People → Followed (people vs entity-follow places vs hosts/shops). */
export type ExploreFollowedSegment = 'people' | 'places' | 'events';

export const parseExploreFollowedSegment = (raw: string | null): ExploreFollowedSegment => {
  if (raw === 'places' || raw === 'events') return raw;
  return 'people';
};

const readPeopleBrowseTabParam = (params: URLSearchParams): string | null =>
  params.get('peopleTab') ?? params.get('socialTab');

const isPeopleBrowseListView = (view: string | null): boolean =>
  view === 'people' || view === 'social' || view === 'going';

export const UNIFIED_MAP_FILTER_KEYS: MapFilterKey[] = MAP_FILTER_PILLS.map((pill) => pill.key);

type UseExploreBrowseUrlStateArgs = {
  isDesktop: boolean;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  clearSelection: () => void;
};

export const useExploreBrowseUrlState = ({
  isDesktop,
  searchParams,
  setSearchParams,
  clearSelection,
}: UseExploreBrowseUrlStateArgs) => {
  const [mapFilter, setMapFilter] = useState<MapFilterKey>(() => parseMapFilter(searchParams.get('filter')));
  const [activityFilter, setActivityFilter] = useState<ActivityListFilterKey>(() =>
    parseActivityListFilter(searchParams.get('activity'))
  );
  const [panel, setPanel] = useState<ExplorePanel>(() => parseExplorePanel(searchParams.get('panel')));
  const [listOpen, setListOpen] = useState(() =>
    readInitialListOpen(searchParams.get('list'), searchParams.get(BROWSE_DISCOVER_PARAM))
  );
  const [browseOpen, setBrowseOpen] = useState(() =>
    parseBrowseDiscoverOpen(searchParams.get(BROWSE_DISCOVER_PARAM))
  );
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [venueFilter, setVenueFilter] = useState<VenueListFilterKey>(() =>
    parseVenueListFilter(
      searchParams.get('places'),
      searchParams.get('filter'),
      searchParams.get('activity')
    )
  );
  const [venueRegions, setVenueRegions] = useState<string[]>(() => parseVenueRegionsParam(searchParams));
  const [desktopBrowseTab, setDesktopBrowseTab] = useState<DesktopBrowseTab>(() =>
    parseDesktopBrowseTab(parseExplorePanel(searchParams.get('panel')))
  );
  const [searchExpanded, setSearchExpanded] = useState(() => Boolean(searchParams.get('q')?.trim()));
  const [activityDatePreset, setActivityDatePreset] = useState<ExploreActivityDatePreset>(() =>
    parseExploreActivityDatePreset(searchParams.get('date'))
  );
  const [activityModeFilter, setActivityModeFilter] = useState<ExploreActivityModeFilter>(() =>
    parseExploreActivityModeFilter(searchParams.get(EXPLORE_ACTIVITY_MODE_FILTER_PARAM))
  );
  const [buddySubtype, setBuddySubtype] = useState<ExploreBuddySubtypeKey>(() =>
    parseExploreBuddySubtype(searchParams.get('subtype'), parseMapFilter(searchParams.get('filter')))
  );
  const [outingTopic, setOutingTopic] = useState<ExploreOutingTopicKey>(() =>
    parseExploreOutingTopic(
      searchParams.get('outingTopic'),
      parseMapFilter(searchParams.get('filter')),
      parseExploreBuddySubtype(searchParams.get('subtype'), parseMapFilter(searchParams.get('filter')))
    )
  );
  const [pinKind, setPinKind] = useState<ExplorePinKindFilter>(() =>
    parseExplorePinKindFilter(searchParams.get('pinKind'))
  );
  const [topicPills, setTopicPills] = useState<ExploreMapFilterPillKey[]>(() =>
    parseExploreMapFilterPillsParam(searchParams.get('topics'))
  );
  const [listMode, setListMode] = useState<ExploreBrowseListMode>(() =>
    isPeopleBrowseListView(searchParams.get('view')) ? 'people' : 'default'
  );
  const [searchScope, setSearchScope] = useState<ExploreSearchScopeKey | null>(() =>
    parseExploreSearchScope(searchParams.get('searchScope') ?? searchParams.get('searchFocus'))
  );
  const [peopleBrowseTab, setPeopleBrowseTab] = useState<PeopleBrowseTab>(() =>
    parsePeopleBrowseTabFromUrl(readPeopleBrowseTabParam(searchParams), searchParams.get('goingTab'))
  );
  const [followedSegment, setFollowedSegment] = useState<ExploreFollowedSegment>(() =>
    parseExploreFollowedSegment(searchParams.get('followedKind'))
  );
  const [buddiesDiscoverSegment, setBuddiesDiscoverSegment] = useState<BuddiesDiscoverySegment>(() =>
    parseBuddiesDiscoverySegment(searchParams.get(BUDDIES_SEGMENT_URL_PARAM))
  );

  const syncExploreUrl = useCallback(
    (next: ExploreBrowseUrlSyncPatch) => {
      const params = buildExploreBrowseSearchParams({
        base: searchParams,
        isDesktop,
        state: {
          mapFilter,
          activityFilter,
          venueFilter,
          panel,
          listOpen,
          browseOpen,
          query,
          venueRegions,
          activityDatePreset,
          activityModeFilter,
          buddySubtype,
          outingTopic,
          pinKind,
          topicPills,
          listMode,
          searchScope,
          peopleBrowseTab,
        },
        patch: next,
      });
      setSearchParams(params, { replace: true });
    },
    [
      mapFilter,
      activityFilter,
      venueFilter,
      panel,
      listOpen,
      browseOpen,
      query,
      venueRegions,
      activityDatePreset,
      activityModeFilter,
      buddySubtype,
      outingTopic,
      pinKind,
      topicPills,
      listMode,
      searchScope,
      peopleBrowseTab,
      searchParams,
      setSearchParams,
      isDesktop,
    ]
  );

  useEffect(() => {
    const nextMapFilterRaw = parseMapFilter(searchParams.get('filter'));
    const nextPanel = parseExplorePanel(searchParams.get('panel'));
    const nextBrowseTab = parseDesktopBrowseTab(nextPanel);
    const allowedForPlaces = MAP_FILTERS_BY_BROWSE_TAB.venues;
    const allowedForActivities = MAP_FILTERS_BY_BROWSE_TAB.activities;
    const inPlacesContext = isDesktop ? nextBrowseTab === 'venues' : nextPanel === 'venues';
    const inActivitiesContext = !inPlacesContext;
    let nextMapFilter = nextMapFilterRaw;
    if (inPlacesContext && !allowedForPlaces.includes(nextMapFilterRaw)) {
      nextMapFilter = 'all';
    } else if (inActivitiesContext && !allowedForActivities.includes(nextMapFilterRaw)) {
      nextMapFilter = 'all';
    }
    setMapFilter(nextMapFilter);
    setActivityFilter(parseActivityListFilter(searchParams.get('activity'), searchParams.get('filter')));
    setVenueFilter(
      parseVenueListFilter(
        searchParams.get('places'),
        searchParams.get('filter'),
        searchParams.get('activity')
      )
    );
    setPanel(nextPanel);
    setListOpen(
      parseListOpen(searchParams.get('list'), isDesktop, searchParams.get(BROWSE_DISCOVER_PARAM))
    );
    setBrowseOpen(parseBrowseDiscoverOpen(searchParams.get(BROWSE_DISCOVER_PARAM)));
    setQuery(searchParams.get('q') ?? '');
    setVenueRegions(parseVenueRegionsParam(searchParams));
    setActivityDatePreset(parseExploreActivityDatePreset(searchParams.get('date')));
    setActivityModeFilter(
      parseExploreActivityModeFilter(searchParams.get(EXPLORE_ACTIVITY_MODE_FILTER_PARAM))
    );
    const nextSubtype = parseExploreBuddySubtype(searchParams.get('subtype'), nextMapFilter);
    setBuddySubtype(nextSubtype);
    setOutingTopic(
      parseExploreOutingTopic(searchParams.get('outingTopic'), nextMapFilter, nextSubtype)
    );
    setPinKind(parseExplorePinKindFilter(searchParams.get('pinKind')));
    setTopicPills(parseExploreMapFilterPillsParam(searchParams.get('topics')));
    setListMode(isPeopleBrowseListView(searchParams.get('view')) ? 'people' : 'default');
    setSearchScope(
      parseExploreSearchScope(searchParams.get('searchScope') ?? searchParams.get('searchFocus'))
    );
    setPeopleBrowseTab(
      parsePeopleBrowseTabFromUrl(readPeopleBrowseTabParam(searchParams), searchParams.get('goingTab'))
    );
    setFollowedSegment(parseExploreFollowedSegment(searchParams.get('followedKind')));
    setBuddiesDiscoverSegment(parseBuddiesDiscoverySegment(searchParams.get(BUDDIES_SEGMENT_URL_PARAM)));
    if (isDesktop) {
      setDesktopBrowseTab(parseDesktopBrowseTab(nextPanel));
      if (searchParams.get('q')?.trim()) setSearchExpanded(true);
    }
  }, [searchParams, isDesktop]);

  useExploreBrowseUrlLegacyMigrations({ isDesktop, searchParams, setSearchParams });

  const applyMapFilter = (next: MapFilterKey) => {
    setMapFilter(next);
    const nextSubtype = next === 'others' ? buddySubtype : 'all';
    const nextTopic = next === 'others' && nextSubtype === 'activities' ? outingTopic : 'all';
    if (next !== 'others') {
      setBuddySubtype('all');
      setOutingTopic('all');
    }
    clearSelection();
    const syncedActivity = mapFilterToActivityListFilter(next);
    const syncedVenue = mapFilterToVenueListFilter(next);
    setActivityFilter(syncedActivity);
    setVenueFilter(syncedVenue);
    syncExploreUrl({
      filter: next,
      activityFilter: syncedActivity,
      placesFilter: syncedVenue,
      buddySubtype: nextSubtype,
      outingTopic: nextTopic,
      list: listOpen,
    });
  };

  const applyPinKindFilter = (next: ExplorePinKindFilter) => {
    setPinKind(next);
    clearSelection();
    syncExploreUrl({ pinKind: next, list: listOpen });
  };

  const toggleMapTopicPill = (key: ExploreMapFilterPillKey) => {
    const next = toggleExploreMapFilterPill(topicPills, key);
    setTopicPills(next);
    clearSelection();
    syncExploreUrl({ topicPills: next, list: listOpen });
  };

  const clearMapTopicPills = () => {
    setTopicPills([]);
    clearSelection();
    syncExploreUrl({ topicPills: [], list: listOpen });
  };

  const openPeopleBrowsePanel = (initialTab: PeopleBrowseTab = 'available') => {
    clearSelection();
    setListMode('people');
    setPeopleBrowseTab(initialTab);
    setPanel('activities');
    setDesktopBrowseTab('activities');
    if (isDesktop) {
      syncExploreUrl({ listMode: 'people', peopleBrowseTab: initialTab, panel: 'activities' });
      return;
    }
    setListOpen(true);
    syncExploreUrl({
      listMode: 'people',
      peopleBrowseTab: initialTab,
      panel: 'activities',
      list: true,
    });
  };

  const closePeopleBrowsePanel = () => {
    setListMode('default');
    clearSelection();
    syncExploreUrl({ listMode: 'default' });
  };

  const applyPeopleBrowseTab = (tab: PeopleBrowseTab) => {
    setPeopleBrowseTab(tab);
    setBuddiesDiscoverSegment(tab);
    setFollowedSegment('people');
    syncExploreUrl({
      listMode: 'people',
      peopleBrowseTab: tab,
      buddiesDiscoverSegment: tab,
      list: listOpen,
    });
  };

  const applyFollowedSegment = (segment: ExploreFollowedSegment) => {
    setFollowedSegment(segment);
  };

  const applyBuddiesDiscoverSegment = (segment: BuddiesDiscoverySegment) => {
    setBuddiesDiscoverSegment(segment);
    setPeopleBrowseTab(segment);
    syncExploreUrl({
      buddiesDiscoverSegment: segment,
      peopleBrowseTab: segment,
      listMode: 'people',
      list: listOpen,
    });
  };

  const closeListPanel = () => {
    setListOpen(false);
    if (!isDesktop && listMode === 'people') {
      setListMode('default');
      syncExploreUrl({ list: false, listMode: 'default' });
      return;
    }
    syncExploreUrl({ list: false });
  };

  const applyBuddySubtype = (next: ExploreBuddySubtypeKey) => {
    setBuddySubtype(next);
    const nextTopic = next === 'activities' ? outingTopic : 'all';
    if (next !== 'activities') setOutingTopic('all');
    clearSelection();
    syncExploreUrl({ buddySubtype: next, outingTopic: nextTopic, list: listOpen });
  };

  const applyOutingTopic = (next: ExploreOutingTopicKey) => {
    setOutingTopic(next);
    clearSelection();
    syncExploreUrl({ outingTopic: next, list: listOpen });
  };

  const applyDesktopBrowseTab = (next: DesktopBrowseTab) => {
    setDesktopBrowseTab(next);
    clearSelection();
    setMapFilter('all');
    setActivityFilter('all');
    setVenueFilter('all');
    const syncedPanel = next === 'venues' ? 'venues' : 'activities';
    setPanel(syncedPanel);
    setBuddySubtype('all');
    setOutingTopic('all');
    syncExploreUrl({
      filter: 'all',
      activityFilter: 'all',
      buddySubtype: 'all',
      outingTopic: 'all',
      panel: syncedPanel,
      list: listOpen,
    });
  };

  const applyActivityFilter = (next: ActivityListFilterKey) => {
    if (!isDesktop) {
      applyBrowsePanel('activities');
      applyMapFilter(activityFilterToMapFilter(next) ?? 'all');
      return;
    }
    setActivityFilter(next);
    clearSelection();
    const syncedMap = activityFilterToMapFilter(next);
    if (syncedMap && syncedMap !== mapFilter) {
      setMapFilter(syncedMap);
      setVenueFilter(mapFilterToVenueListFilter(syncedMap));
      setPanel('activities');
      syncExploreUrl({
        activityFilter: next,
        filter: syncedMap,
        panel: 'activities',
        list: listOpen,
      });
      return;
    }
    syncExploreUrl({ activityFilter: next, list: listOpen });
  };

  const applyBrowsePanel = (next: ExplorePanel, options?: { openList?: boolean }) => {
    const openList = options?.openList ?? false;
    setPanel(next);
    clearSelection();
    const tab = parseDesktopBrowseTab(next);
    const allowed = MAP_FILTERS_BY_BROWSE_TAB[tab];
    const nextFilter = allowed.includes(mapFilter) ? mapFilter : 'all';
    if (nextFilter !== mapFilter) {
      setMapFilter(nextFilter);
      setActivityFilter(mapFilterToActivityListFilter(nextFilter));
      setVenueFilter(mapFilterToVenueListFilter(nextFilter));
    }
    if (isDesktop) {
      setDesktopBrowseTab(tab);
    }
    syncExploreUrl({
      panel: next,
      list: openList ? true : listOpen,
      filter: nextFilter,
      activityFilter: mapFilterToActivityListFilter(nextFilter),
      placesFilter: mapFilterToVenueListFilter(nextFilter),
    });
    if (openList) {
      setListOpen(true);
    }
  };

  const applyPanel = (next: ExplorePanel) => applyBrowsePanel(next, { openList: true });

  const openMapListPanel = () => {
    clearSelection();
    setListMode('default');
    if (!isDesktop) {
      setBrowseOpen(false);
    }
    setListOpen(true);
    syncExploreUrl({
      list: true,
      browse: isDesktop ? browseOpen : false,
      panel,
      listCat: null,
      listMode: 'default',
    });
  };

  const openDiscoverBrowse = () => {
    clearSelection();
    setListMode('default');
    setBrowseOpen(true);
    if (!isDesktop) {
      setListOpen(false);
      syncExploreUrl({ browse: true, list: false, listCat: null, listMode: 'default' });
      return;
    }
    syncExploreUrl({ browse: true, list: listOpen, listCat: null, listMode: 'default' });
  };

  const closeDiscoverBrowse = () => {
    setBrowseOpen(false);
    syncExploreUrl({ browse: false });
  };

  /** @deprecated Use {@link openMapListPanel} */
  const openBrowse = openMapListPanel;

  const applyVenueFilter = (next: VenueListFilterKey) => {
    setVenueFilter(next);
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
      setMapFilter(syncedMap);
      setActivityFilter(mapFilterToActivityListFilter(syncedMap));
      setPanel(syncedMap === 'shops' ? 'shops' : 'venues');
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
  };

  const applyActivityDatePreset = (next: ExploreActivityDatePreset) => {
    setActivityDatePreset(next);
    clearSelection();
    syncExploreUrl({ activityDatePreset: next, list: listOpen });
  };

  const applyActivityModeFilter = (next: ExploreActivityModeFilter) => {
    setActivityModeFilter(next);
    clearSelection();
    syncExploreUrl({ activityModeFilter: next, list: listOpen });
  };

  const showListPanel = listOpen;
  const sidebarPanel: ExplorePanel = isDesktop
    ? panel === 'venues'
      ? 'venues'
      : mapFilterToPanel(mapFilter)
    : panel;

  const contextualMapFilters = useMemo(() => {
    const tab = isDesktop
      ? desktopBrowseTab
      : panel === 'venues'
        ? 'venues'
        : 'activities';
    const allowed = MAP_FILTERS_BY_BROWSE_TAB[tab];
    return MAP_FILTER_PILLS.filter((pill) => allowed.includes(pill.key));
  }, [isDesktop, desktopBrowseTab, panel]);

  const desktopFilterKeys = useMemo(
    () => contextualMapFilters.map((pill) => pill.key),
    [contextualMapFilters]
  );

  const browseFilterKeys = useMemo((): MapFilterKey[] => {
    if (isDesktop) return desktopFilterKeys;
    const tab = panel === 'venues' ? 'venues' : 'activities';
    return [...MAP_FILTERS_BY_BROWSE_TAB[tab]];
  }, [isDesktop, desktopFilterKeys, panel]);

  const applyVenueRegions = (next: string[]) => {
    setVenueRegions(next);
    clearSelection();
    syncExploreUrl({ venueRegions: next, list: listOpen });
  };

  /** Apply map search (`q` + scope): map list for pins; discover browse for people/agencies. */
  const commitExploreSearch = (scope?: ExploreSearchScopeKey | null) => {
    if (scope === 'facilities') return;
    clearSelection();
    setListMode('default');
    const resolved = scope !== undefined ? scope : searchScope;
    setSearchScope(resolved);
    if (resolved) {
      const syncedPanel = explorePanelForSearchScope(resolved);
      const syncedTab = desktopBrowseTabForSearchScope(resolved);
      const syncedPinKind = pinKindForSearchScope(resolved);
      setPanel(syncedPanel);
      setDesktopBrowseTab(syncedTab);
      setPinKind(syncedPinKind);
      const discoverCategory =
        resolved === 'people' ? 'people' : resolved === 'agencies' ? 'agencies' : null;
      if (discoverCategory) {
        setBrowseOpen(true);
        setListOpen(false);
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
      setBrowseOpen(false);
      setListOpen(true);
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
  };

  const placesMode = isDesktop ? desktopBrowseTab === 'venues' : panel === 'venues';

  return {
    mapFilter,
    setMapFilter,
    activityFilter,
    setActivityFilter,
    panel,
    listOpen,
    setListOpen,
    query,
    setQuery,
    venueFilter,
    venueRegions,
    desktopBrowseTab,
    searchExpanded,
    setSearchExpanded,
    activityDatePreset,
    applyActivityDatePreset,
    activityModeFilter,
    applyActivityModeFilter,
    syncExploreUrl,
    applyMapFilter,
    applyDesktopBrowseTab,
    applyActivityFilter,
    applyPanel,
    applyVenueFilter,
    applyBrowsePanel,
    openBrowse,
    openMapListPanel,
    openDiscoverBrowse,
    closeDiscoverBrowse,
    browseOpen,
    closeListPanel,
    showListPanel,
    sidebarPanel,
    desktopFilterKeys,
    browseFilterKeys,
    placesMode,
    applyVenueRegions,
    buddySubtype,
    applyBuddySubtype,
    outingTopic,
    applyOutingTopic,
    searchScope,
    commitExploreSearch,
    pinKind,
    applyPinKindFilter,
    mapFilterKeys: UNIFIED_MAP_FILTER_KEYS,
    topicPills,
    toggleMapTopicPill,
    clearMapTopicPills,
    openPeopleBrowsePanel,
    closePeopleBrowsePanel,
    peopleBrowseTab,
    applyPeopleBrowseTab,
    buddiesDiscoverSegment,
    applyBuddiesDiscoverSegment,
    followedSegment,
    applyFollowedSegment,
    listMode,
  };
};
