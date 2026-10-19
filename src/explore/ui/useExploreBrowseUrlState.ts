import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { MAP_FILTER_PILLS } from '../../config/exploreMapFilters';
import {
  type ActivityListFilterKey,
  type ExplorePanel,
  type MapFilterKey,
  type VenueListFilterKey,
  type ExploreActivityDatePreset,
} from '../routing';
import { MAP_FILTERS_BY_BROWSE_TAB, type DesktopBrowseTab } from './exploreBrowsePanelCopy';
import { mapFilterToPanel, readInitialListOpen } from './exploreListPanelUrl';
import { BROWSE_DISCOVER_PARAM } from '../../list/browseListUrlState';
import { type ExploreMapFilterPillKey, type ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import {
  buildExploreBrowseSearchParams,
  type ExploreBrowseListMode,
  type ExploreBrowseUrlSyncPatch,
} from '../exploreBrowseUrlSync';
import {
  parseExploreBrowseStateFromSearchParams,
  type ExploreBrowseUrlHydratedState,
} from '../exploreBrowseUrlHydrate';
import { useExploreBrowseUrlInboundMigrations } from './useExploreBrowseUrlInboundMigrations';
import { useExploreBrowseUrlApplyHandlers } from './useExploreBrowseUrlApplyHandlers';
import type { BuddiesDiscoverySegment } from '../../list/buddiesDiscoverySegment';
import type { ExplorePinKindFilter } from '../explorePinKindFilter';
import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';
import type { ExploreActivityModeFilter } from '../exploreActivityModeFilter';
import type { ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';

export type { ExploreBrowseListMode } from '../exploreBrowseUrlSync';

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
  const initial = useRef({
    ...parseExploreBrowseStateFromSearchParams(searchParams, isDesktop),
    listOpen: readInitialListOpen(
      searchParams.get('list'),
      searchParams.get(BROWSE_DISCOVER_PARAM)
    ),
  }).current;

  const [mapFilter, setMapFilter] = useState<MapFilterKey>(initial.mapFilter);
  const [activityFilter, setActivityFilter] = useState<ActivityListFilterKey>(initial.activityFilter);
  const [panel, setPanel] = useState<ExplorePanel>(initial.panel);
  const [listOpen, setListOpen] = useState(initial.listOpen);
  const [browseOpen, setBrowseOpen] = useState(initial.browseOpen);
  const [query, setQuery] = useState(initial.query);
  const [venueFilter, setVenueFilter] = useState<VenueListFilterKey>(initial.venueFilter);
  const [venueRegions, setVenueRegions] = useState<string[]>(initial.venueRegions);
  const [desktopBrowseTab, setDesktopBrowseTab] = useState<DesktopBrowseTab>(initial.desktopBrowseTab);
  const [searchExpanded, setSearchExpanded] = useState(initial.expandSearch);
  const [activityDatePreset, setActivityDatePreset] = useState<ExploreActivityDatePreset>(
    initial.activityDatePreset
  );
  const [activityModeFilter, setActivityModeFilter] = useState<ExploreActivityModeFilter>(
    initial.activityModeFilter
  );
  const [buddySubtype, setBuddySubtype] = useState<ExploreBuddySubtypeKey>(initial.buddySubtype);
  const [outingTopic, setOutingTopic] = useState<ExploreOutingTopicKey>(initial.outingTopic);
  const [pinKind, setPinKind] = useState<ExplorePinKindFilter>(initial.pinKind);
  const [topicPills, setTopicPills] = useState<ExploreMapFilterPillKey[]>(initial.topicPills);
  const [listMode, setListMode] = useState<ExploreBrowseListMode>(initial.listMode);
  const [peopleBrowseOpen, setPeopleBrowseOpen] = useState(initial.peopleBrowseOpen);
  const [searchScope, setSearchScope] = useState<ExploreSearchScopeKey | null>(initial.searchScope);
  const [peopleBrowseTab, setPeopleBrowseTab] = useState<PeopleBrowseTab>(initial.peopleBrowseTab);
  const [buddiesDiscoverSegment, setBuddiesDiscoverSegment] = useState<BuddiesDiscoverySegment>(
    initial.buddiesDiscoverSegment
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
          peopleBrowseOpen,
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
      peopleBrowseOpen,
      searchScope,
      peopleBrowseTab,
      searchParams,
      setSearchParams,
      isDesktop,
    ]
  );

  const applyHydratedState = useCallback((state: ExploreBrowseUrlHydratedState) => {
    setMapFilter(state.mapFilter);
    setActivityFilter(state.activityFilter);
    setVenueFilter(state.venueFilter);
    setPanel(state.panel);
    setListOpen(state.listOpen);
    setBrowseOpen(state.browseOpen);
    setQuery(state.query);
    setVenueRegions(state.venueRegions);
    setActivityDatePreset(state.activityDatePreset);
    setActivityModeFilter(state.activityModeFilter);
    setBuddySubtype(state.buddySubtype);
    setOutingTopic(state.outingTopic);
    setPinKind(state.pinKind);
    setTopicPills(state.topicPills);
    setListMode(state.listMode);
    setPeopleBrowseOpen(state.peopleBrowseOpen);
    setSearchScope(state.searchScope);
    setPeopleBrowseTab(state.peopleBrowseTab);
    setBuddiesDiscoverSegment(state.buddiesDiscoverSegment);
    if (isDesktop) {
      setDesktopBrowseTab(state.desktopBrowseTab);
      if (state.expandSearch) setSearchExpanded(true);
    }
  }, [isDesktop]);

  useEffect(() => {
    applyHydratedState(parseExploreBrowseStateFromSearchParams(searchParams, isDesktop));
  }, [searchParams, isDesktop, applyHydratedState]);

  useExploreBrowseUrlInboundMigrations({ isDesktop, searchParams, setSearchParams });

  const browseSetters = useMemo(
    () => ({
      setMapFilter,
      setActivityFilter,
      setVenueFilter,
      setPanel,
      setListOpen,
      setBrowseOpen,
      setBuddySubtype,
      setOutingTopic,
      setPinKind,
      setTopicPills,
      setListMode,
      setPeopleBrowseOpen,
      setPeopleBrowseTab,
      setBuddiesDiscoverSegment,
      setDesktopBrowseTab,
      setActivityDatePreset,
      setActivityModeFilter,
      setVenueRegions,
      setSearchScope,
    }),
    []
  );

  const handlers = useExploreBrowseUrlApplyHandlers({
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
    setters: browseSetters,
  });

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
    applyActivityDatePreset: handlers.applyActivityDatePreset,
    activityModeFilter,
    applyActivityModeFilter: handlers.applyActivityModeFilter,
    syncExploreUrl,
    applyMapFilter: handlers.applyMapFilter,
    applyDesktopBrowseTab: handlers.applyDesktopBrowseTab,
    applyActivityFilter: handlers.applyActivityFilter,
    applyPanel: handlers.applyPanel,
    applyVenueFilter: handlers.applyVenueFilter,
    applyBrowsePanel: handlers.applyBrowsePanel,
    openBrowse: handlers.openBrowse,
    openMapListPanel: handlers.openMapListPanel,
    openDiscoverBrowse: handlers.openDiscoverBrowse,
    closeDiscoverBrowse: handlers.closeDiscoverBrowse,
    browseOpen,
    closeListPanel: handlers.closeListPanel,
    showListPanel,
    sidebarPanel,
    desktopFilterKeys,
    browseFilterKeys,
    placesMode,
    applyVenueRegions: handlers.applyVenueRegions,
    buddySubtype,
    applyBuddySubtype: handlers.applyBuddySubtype,
    outingTopic,
    applyOutingTopic: handlers.applyOutingTopic,
    searchScope,
    commitExploreSearch: handlers.commitExploreSearch,
    pinKind,
    applyPinKindFilter: handlers.applyPinKindFilter,
    mapFilterKeys: UNIFIED_MAP_FILTER_KEYS,
    topicPills,
    toggleMapTopicPill: handlers.toggleMapTopicPill,
    clearMapTopicPills: handlers.clearMapTopicPills,
    openPeopleBrowsePanel: handlers.openPeopleBrowsePanel,
    closePeopleBrowsePanel: handlers.closePeopleBrowsePanel,
    peopleBrowseTab,
    applyPeopleBrowseTab: handlers.applyPeopleBrowseTab,
    buddiesDiscoverSegment,
    applyBuddiesDiscoverSegment: handlers.applyBuddiesDiscoverSegment,
    listMode,
    peopleBrowseOpen,
  };
};
