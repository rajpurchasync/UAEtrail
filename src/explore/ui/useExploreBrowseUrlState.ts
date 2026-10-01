import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { MAP_FILTER_PILLS } from '../../config/exploreMapFilters';
import {
  activityFilterToMapFilter,
  clearFulfillIntentMapItemParams,
  mapFilterToActivityListFilter,
  mapFilterToVenueListFilter,
  parseActivityListFilter,
  parseExplorePanel,
  parseExploreActivityDatePreset,
  serializeExploreActivityDatePreset,
  parseMapFilter,
  parseVenueListFilter,
  parseVenueRegionsParam,
  serializeVenueListFilter,
  venueFilterToMapFilter,
  type ActivityListFilterKey,
  type ExplorePanel,
  type MapFilterKey,
  type VenueListFilterKey,
  type ExploreActivityDatePreset,
} from '../routing';
import {
  parseExploreBuddySubtype,
  serializeExploreBuddySubtype,
  type ExploreBuddySubtypeKey,
} from '../exploreBuddySubtype';
import {
  parseExploreOutingTopic,
  serializeExploreOutingTopic,
  type ExploreOutingTopicKey,
} from '../exploreOutingTopic';
import { MAP_FILTERS_BY_BROWSE_TAB, parseDesktopBrowseTab, type DesktopBrowseTab } from './exploreBrowsePanelCopy';
import { mapFilterToPanel, parseListOpen, readInitialListOpen } from './exploreListPanelUrl';
import {
  desktopBrowseTabForSearchScope,
  explorePanelForSearchScope,
  parseExploreMapFilterPillsParam,
  parseExploreSearchScope,
  pinKindForSearchScope,
  serializeExploreMapFilterPillsParam,
  serializeExploreSearchScope,
  toggleExploreMapFilterPill,
  type ExploreMapFilterPillKey,
  type ExploreSearchScopeKey,
} from '../exploreBrowseTaxonomy';
import {
  parseExplorePinKindFilter,
  serializeExplorePinKindFilter,
  type ExplorePinKindFilter,
} from '../explorePinKindFilter';

export type ExploreBrowseListMode = 'default' | 'whosGoing';

export type WhosGoingSegment = 'people' | 'trips';

const parseWhosGoingSegment = (value: string | null): WhosGoingSegment =>
  value === 'trips' ? 'trips' : 'people';

export const UNIFIED_MAP_FILTER_KEYS: MapFilterKey[] = MAP_FILTER_PILLS.map((pill) => pill.key);

type SyncPatch = {
  filter?: MapFilterKey;
  activityFilter?: ActivityListFilterKey;
  placesFilter?: VenueListFilterKey;
  panel?: ExplorePanel;
  list?: boolean;
  q?: string;
  venueRegions?: string[];
  activityDatePreset?: ExploreActivityDatePreset;
  buddySubtype?: ExploreBuddySubtypeKey;
  outingTopic?: ExploreOutingTopicKey;
  pinKind?: ExplorePinKindFilter;
  topicPills?: ExploreMapFilterPillKey[];
  listMode?: ExploreBrowseListMode;
  searchScope?: ExploreSearchScopeKey | null;
  whosGoingSegment?: WhosGoingSegment;
};

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
  const [listOpen, setListOpen] = useState(() => readInitialListOpen(searchParams.get('list')));
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
    searchParams.get('view') === 'going' ? 'whosGoing' : 'default'
  );
  const [searchScope, setSearchScope] = useState<ExploreSearchScopeKey | null>(() =>
    parseExploreSearchScope(searchParams.get('searchScope') ?? searchParams.get('searchFocus'))
  );
  const [whosGoingSegment, setWhosGoingSegment] = useState<WhosGoingSegment>(() =>
    parseWhosGoingSegment(searchParams.get('goingTab'))
  );

  const syncExploreUrl = useCallback(
    (next: SyncPatch) => {
      const params = new URLSearchParams(searchParams);
      const filterValue = next.filter ?? mapFilter;
      const activityFilterValue = next.activityFilter ?? activityFilter;
      const placesFilterValue = next.placesFilter ?? venueFilter;
      const panelValue = next.panel ?? panel;
      const listValue = next.list ?? listOpen;
      const queryValue = next.q ?? query;
      const regionValue = next.venueRegions ?? venueRegions;
      const dateValue = next.activityDatePreset !== undefined ? next.activityDatePreset : activityDatePreset;
      const subtypeValue = next.buddySubtype ?? buddySubtype;
      const topicValue = next.outingTopic ?? outingTopic;
      const pinKindValue = next.pinKind ?? pinKind;
      const topicPillsValue = next.topicPills ?? topicPills;
      const listModeValue = next.listMode ?? listMode;
      const searchScopeValue = next.searchScope !== undefined ? next.searchScope : searchScope;

      if (filterValue === 'all') params.delete('filter');
      else params.set('filter', filterValue);

      if (activityFilterValue === 'all') params.delete('activity');
      else params.set('activity', activityFilterValue);

      const serializedPlaces = serializeVenueListFilter(placesFilterValue);
      if (serializedPlaces) params.set('places', serializedPlaces);
      else params.delete('places');

      if (panelValue === 'activities') params.delete('panel');
      else params.set('panel', panelValue);

      if (listValue) params.set('list', '1');
      else params.set('list', '0');

      if (queryValue.trim()) params.set('q', queryValue.trim());
      else params.delete('q');

      const serializedDate = serializeExploreActivityDatePreset(dateValue);
      if (serializedDate) params.set('date', serializedDate);
      else params.delete('date');

      const serializedSubtype = serializeExploreBuddySubtype(subtypeValue, filterValue);
      if (serializedSubtype) params.set('subtype', serializedSubtype);
      else params.delete('subtype');

      const serializedTopic = serializeExploreOutingTopic(topicValue, filterValue, subtypeValue);
      if (serializedTopic) params.set('outingTopic', serializedTopic);
      else params.delete('outingTopic');

      const serializedPinKind = serializeExplorePinKindFilter(pinKindValue);
      if (serializedPinKind) params.set('pinKind', serializedPinKind);
      else params.delete('pinKind');

      const serializedTopics = serializeExploreMapFilterPillsParam(topicPillsValue);
      if (serializedTopics) params.set('topics', serializedTopics);
      else params.delete('topics');

      const whosGoingSegmentValue = next.whosGoingSegment ?? whosGoingSegment;
      if (listModeValue === 'whosGoing') {
        params.set('view', 'going');
        if (whosGoingSegmentValue === 'trips') params.set('goingTab', 'trips');
        else params.delete('goingTab');
      } else {
        params.delete('view');
        params.delete('goingTab');
      }

      const serializedSearchScope = serializeExploreSearchScope(searchScopeValue);
      if (serializedSearchScope) params.set('searchScope', serializedSearchScope);
      else params.delete('searchScope');
      params.delete('searchFocus');

      if (regionValue.length > 0) {
        params.set('regions', regionValue.join(','));
        params.delete('region');
      } else {
        params.delete('regions');
        params.delete('region');
      }

      params.delete('addLocation');
      params.delete('compose');
      params.delete('contribute');
      params.delete('request');
      clearFulfillIntentMapItemParams(params);

      setSearchParams(params, { replace: true });
    },
    [
      mapFilter,
      activityFilter,
      venueFilter,
      panel,
      listOpen,
      query,
      venueRegions,
      activityDatePreset,
      buddySubtype,
      outingTopic,
      pinKind,
      topicPills,
      listMode,
      searchScope,
      whosGoingSegment,
      searchParams,
      setSearchParams,
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
    setListOpen(parseListOpen(searchParams.get('list'), isDesktop));
    setQuery(searchParams.get('q') ?? '');
    setVenueRegions(parseVenueRegionsParam(searchParams));
    setActivityDatePreset(parseExploreActivityDatePreset(searchParams.get('date')));
    const nextSubtype = parseExploreBuddySubtype(searchParams.get('subtype'), nextMapFilter);
    setBuddySubtype(nextSubtype);
    setOutingTopic(
      parseExploreOutingTopic(searchParams.get('outingTopic'), nextMapFilter, nextSubtype)
    );
    setPinKind(parseExplorePinKindFilter(searchParams.get('pinKind')));
    setTopicPills(parseExploreMapFilterPillsParam(searchParams.get('topics')));
    setListMode(searchParams.get('view') === 'going' ? 'whosGoing' : 'default');
    setSearchScope(
      parseExploreSearchScope(searchParams.get('searchScope') ?? searchParams.get('searchFocus'))
    );
    setWhosGoingSegment(parseWhosGoingSegment(searchParams.get('goingTab')));
    if (isDesktop) {
      setDesktopBrowseTab(parseDesktopBrowseTab(nextPanel));
      if (searchParams.get('q')?.trim()) setSearchExpanded(true);
    }
  }, [searchParams, isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;
    const listParam = searchParams.get('list');
    if (listParam === '0' || listParam === '1') return;
    syncExploreUrl({ list: true });
  }, [isDesktop, searchParams, syncExploreUrl]);

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

  const openWhosGoingList = () => {
    clearSelection();
    setListMode('whosGoing');
    setWhosGoingSegment('people');
    setPanel('activities');
    setDesktopBrowseTab('activities');
    if (isDesktop) {
      syncExploreUrl({ listMode: 'whosGoing', whosGoingSegment: 'people', panel: 'activities' });
      return;
    }
    setListOpen(true);
    syncExploreUrl({ listMode: 'whosGoing', whosGoingSegment: 'people', panel: 'activities', list: true });
  };

  const closeWhosGoingPanel = () => {
    setListMode('default');
    clearSelection();
    syncExploreUrl({ listMode: 'default' });
  };

  const applyWhosGoingSegment = (segment: WhosGoingSegment) => {
    setWhosGoingSegment(segment);
    syncExploreUrl({ whosGoingSegment: segment, list: listOpen });
  };

  const closeListPanel = () => {
    setListOpen(false);
    if (!isDesktop && listMode === 'whosGoing') {
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

  const openBrowse = () => {
    clearSelection();
    setListOpen(true);
    syncExploreUrl({ list: true, panel });
  };

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

  const commitMapSearch = (scope?: ExploreSearchScopeKey | null) => {
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
      syncExploreUrl({
        q: query,
        list: true,
        listMode: 'default',
        panel: syncedPanel,
        pinKind: syncedPinKind,
        searchScope: resolved,
      });
      setListOpen(true);
      return;
    }
    syncExploreUrl({ q: query, list: true, listMode: 'default', searchScope: null });
    setListOpen(true);
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
    syncExploreUrl,
    applyMapFilter,
    applyDesktopBrowseTab,
    applyActivityFilter,
    applyPanel,
    applyVenueFilter,
    applyBrowsePanel,
    openBrowse,
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
    commitMapSearch,
    pinKind,
    applyPinKindFilter,
    mapFilterKeys: UNIFIED_MAP_FILTER_KEYS,
    topicPills,
    toggleMapTopicPill,
    clearMapTopicPills,
    openWhosGoingList,
    closeWhosGoingPanel,
    whosGoingSegment,
    applyWhosGoingSegment,
    listMode,
  };
};
