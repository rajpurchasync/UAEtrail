import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, type SetURLSearchParams } from 'react-router-dom';
import {
  type ActivityListFilterKey,
  type ExplorePanel,
  type MapFilterKey,
  type VenueListFilterKey,
  type ExploreActivityDatePreset,
} from '../routing';
import { type DesktopBrowseTab } from './exploreBrowsePanelCopy';
import { type ExploreMapFilterPillKey, type ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import {
  commitExploreBrowseUrlSync,
  type ExploreBrowseListMode,
  type ExploreBrowseUrlSyncPatch,
} from '../exploreBrowseUrlSync';
import { resolveExploreBrowsePanelLayout } from './exploreBrowseUrlPanelLayout';
import { openExploreListFromMap } from './openExploreListFromMap';
import { buildExploreBrowseUrlPublicApi } from './exploreBrowseUrlPublicApi';
import { createExploreBrowseUrlBrowseSetters } from './exploreBrowseUrlBrowseSetters';
import { useExploreBrowseUrlHydrateFromSearch } from './useExploreBrowseUrlHydrateFromSearch';
import {
  clampGuestPeopleBrowse,
  parseExploreBrowseStateFromSearchParams,
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

export { UNIFIED_MAP_FILTER_KEYS } from './exploreBrowseUrlConstants';
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
  const [geoPath, setGeoPath] = useState<string[]>(initial.geoPath);
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
      const browseState = {
        mapFilter,
        activityFilter,
        venueFilter,
        panel,
        listOpen,
        browseOpen,
        query,
        venueRegions,
        geoPath,
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
      };
      commitExploreBrowseUrlSync(
        { pathname: location.pathname, navigate, setSearchParams },
        { isDesktop, state: browseState, patch: next }
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
      geoPath,
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
      setSearchParams,
      isDesktop,
      location.pathname,
      navigate,
    ]
  );

  const browseSetters = useMemo(
    () =>
      createExploreBrowseUrlBrowseSetters({
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
        setGeoPath,
        setSearchScope,
        setTripMapTopics,
        setPlaceMapTopics,
        setPriceFilter,
        setHasTrip,
        setFacilityKinds,
        setQuery,
        setSearchExpanded,
      }),
    []
  );
  useExploreBrowseUrlHydrateFromSearch(searchParams, isDesktop, isSignedIn, browseSetters);
  useExploreBrowsePeekDismissOnFilterChange(searchParams, clearSelection);
  useExploreBrowseUrlInboundMigrations({ searchParams, setSearchParams, isDesktop });

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

  const openListExplorer = useCallback(
    () =>
      openExploreListFromMap({
        clearSelection,
        isDesktop,
        setPeopleBrowseOpen,
        setListMode,
        setListOpen,
        syncExploreUrl,
        locationPathname: location.pathname,
        locationSearch: location.search,
        navigate,
        searchParamsString: searchParams.toString(),
      }),
    [clearSelection, isDesktop, location.pathname, location.search, navigate, searchParams, syncExploreUrl]
  );

  const {
    showListPanel,
    showDesktopCatalogDrawer,
    sidebarPanel,
    contextualMapFilters,
    desktopFilterKeys,
    browseFilterKeys,
    placesMode,
  } = useMemo(
    () =>
      resolveExploreBrowsePanelLayout({
        isDesktop,
        panel,
        desktopBrowseTab,
        listOpen,
        listMode,
        peopleBrowseOpen,
        mapFilter,
      }),
    [isDesktop, panel, desktopBrowseTab, listOpen, listMode, peopleBrowseOpen, mapFilter]
  );

  return buildExploreBrowseUrlPublicApi({
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
    geoPath,
    desktopBrowseTab,
    searchExpanded,
    setSearchExpanded,
    activityDatePreset,
    activityModeFilter,
    syncExploreUrl,
    browseOpen,
    buddySubtype,
    outingTopic,
    searchScope,
    pinKind,
    topicPills,
    peopleBrowseTab,
    buddiesDiscoverSegment,
    listMode,
    peopleBrowseOpen,
    tripMapTopics,
    placeMapTopics,
    priceFilter,
    hasTrip,
    facilityKinds,
    handlers,
    openListExplorer,
    showListPanel,
    showDesktopCatalogDrawer,
    sidebarPanel,
    desktopFilterKeys,
    browseFilterKeys,
    placesMode,
  });
};
