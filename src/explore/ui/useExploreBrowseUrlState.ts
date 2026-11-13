import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, type SetURLSearchParams } from 'react-router-dom';
import { listDiscoveryPathFromExploreSearch } from '../../list/routing';
import { exploreMapMobileBackState } from '../../utils/mobileBackNav';
import { MAP_FILTER_PILLS } from '../../config/exploreMapFilters';
import {
  type ActivityListFilterKey,
  type ExplorePanel,
  type MapFilterKey,
  type VenueListFilterKey,
  type ExploreActivityDatePreset,
} from '../routing';
import { MAP_FILTERS_BY_BROWSE_TAB, type DesktopBrowseTab } from './exploreBrowsePanelCopy';
import { mapFilterToPanel } from './exploreListPanelUrl';
import { type ExploreMapFilterPillKey, type ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import {
  buildExploreBrowseSearchParams,
  type ExploreBrowseListMode,
  type ExploreBrowseUrlSyncPatch,
} from '../exploreBrowseUrlSync';
import {
  clampGuestPeopleBrowse,
  parseExploreBrowseStateFromSearchParams,
  type ExploreBrowseUrlHydratedState,
} from '../exploreBrowseUrlHydrate';
import { useExploreBrowseUrlInboundMigrations } from './useExploreBrowseUrlInboundMigrations';
import { useExploreBrowsePeekDismissOnFilterChange } from './useExploreBrowsePeekDismissOnFilterChange';
import { useExploreBrowseUrlApplyHandlers } from './useExploreBrowseUrlApplyHandlers';
import type { BuddiesDiscoverySegment } from '../../list/buddiesDiscoverySegment';
import type { ExplorePinKindFilter } from '../explorePinKindFilter';
import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';
import type { ExploreActivityModeFilter } from '../exploreActivityModeFilter';
import type { ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import type { PlaceKind } from '@uaetrail/shared-types';
import type { ExplorePriceFilter } from '../exploreOptionalFilters';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../exploreMapQuickTopicFilters';

export type { ExploreBrowseListMode } from '../exploreBrowseUrlSync';

export const UNIFIED_MAP_FILTER_KEYS: MapFilterKey[] = MAP_FILTER_PILLS.map((pill) => pill.key).filter(
  (key) => key !== 'facilities'
);
type UseExploreBrowseUrlStateArgs = {
  isDesktop: boolean; isSignedIn: boolean;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  clearSelection: () => void;
};

export const useExploreBrowseUrlState = ({
  isDesktop, isSignedIn,
  searchParams,
  setSearchParams,
  clearSelection,
}: UseExploreBrowseUrlStateArgs) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initial = useRef(clampGuestPeopleBrowse(parseExploreBrowseStateFromSearchParams(searchParams, isDesktop), isSignedIn)).current;

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
  const [tripMapTopics, setTripMapTopics] = useState<TripMapTopicKey[]>(initial.tripMapTopics);
  const [placeMapTopics, setPlaceMapTopics] = useState<PlaceMapTopicKey[]>(initial.placeMapTopics);
  const [priceFilter, setPriceFilter] = useState<ExplorePriceFilter>(initial.priceFilter);
  const [hasTrip, setHasTrip] = useState(initial.hasTrip);
  const [facilityKinds, setFacilityKinds] = useState<PlaceKind[]>([...initial.facilityKinds]);

  const syncExploreUrl = useCallback(
    (next: ExploreBrowseUrlSyncPatch) => {
      setSearchParams(
        (prev) =>
          buildExploreBrowseSearchParams({
            base: prev,
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
              tripMapTopics,
              placeMapTopics,
              priceFilter,
              hasTrip,
              facilityKinds,
            },
            patch: next,
          }),
        { replace: true }
      );
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
      tripMapTopics,
      placeMapTopics,
      priceFilter,
      hasTrip,
      facilityKinds,
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
    setTripMapTopics(state.tripMapTopics);
    setPlaceMapTopics(state.placeMapTopics);
    setPriceFilter(state.priceFilter);
    setHasTrip(state.hasTrip);
    setFacilityKinds([...state.facilityKinds]);
    if (isDesktop) {
      setDesktopBrowseTab(state.desktopBrowseTab);
      if (state.expandSearch) setSearchExpanded(true);
    }
  }, [isDesktop]);
  useEffect(() => {
    applyHydratedState(clampGuestPeopleBrowse(parseExploreBrowseStateFromSearchParams(searchParams, isDesktop), isSignedIn));
  }, [searchParams, isDesktop, isSignedIn, applyHydratedState]);
  useExploreBrowsePeekDismissOnFilterChange(searchParams, clearSelection);
  useExploreBrowseUrlInboundMigrations({ searchParams, setSearchParams, isDesktop });
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
      setTripMapTopics,
      setPlaceMapTopics,
      setPriceFilter,
      setHasTrip,
      setFacilityKinds,
    }),
    []
  );

  const handlers = useExploreBrowseUrlApplyHandlers({
    isDesktop,
    isSignedIn,
    clearSelection,
    syncExploreUrl,
    listOpen,
    browseOpen,
    panel,
    mapFilter,
    buddySubtype,
    outingTopic,
    topicPills,
    tripMapTopics,
    placeMapTopics,
    activityFilter,
    venueFilter,
    query,
    searchScope,
    listMode,
    exploreReturnPath: `${location.pathname}${location.search}`,
    setters: browseSetters,
  });

  const openListExplorer = useCallback(() => {
    clearSelection();
    if (isDesktop) {
      setPeopleBrowseOpen(false);
      setListMode('default');
      setListOpen(true);
      syncExploreUrl({ list: true, listMode: 'default', peopleBrowseOpen: false });
      return;
    }
    const current = `${location.pathname}${location.search}`;
    navigate(listDiscoveryPathFromExploreSearch(searchParams.toString()), {
      state: exploreMapMobileBackState(current),
    });
  }, [clearSelection, isDesktop, location.pathname, location.search, navigate, searchParams, syncExploreUrl]);

  const showListPanel = listOpen && listMode === 'people';
  const showDesktopCatalogDrawer = isDesktop && !peopleBrowseOpen;
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
    openBrowse: openListExplorer,
    openMapListPanel: openListExplorer,
    openDiscoverBrowse: openListExplorer,
    closeDiscoverBrowse: handlers.closeDiscoverBrowse,
    browseOpen,
    closeListPanel: handlers.closeListPanel,
    showListPanel,
    showDesktopCatalogDrawer,
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
    tripMapTopics,
    placeMapTopics,
    priceFilter,
    hasTrip,
    facilityKinds,
    applyTripMapTopics: handlers.applyTripMapTopics,
    applyPlaceMapTopics: handlers.applyPlaceMapTopics,
    applyPriceFilter: handlers.applyPriceFilter,
    applyHasTrip: handlers.applyHasTrip,
    applyFacilityKinds: handlers.applyFacilityKinds,
    applyVenueFilters: handlers.applyVenueFilters,
    toggleTripMapTopic: handlers.toggleTripMapTopic,
    togglePlaceMapTopic: handlers.togglePlaceMapTopic,
  };
};
