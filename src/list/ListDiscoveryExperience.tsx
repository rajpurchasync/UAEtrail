import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductLocation, useProductSearchParams } from '../routing/useEffectiveLocation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { EXPLORE_MAP_PATH } from '../config/routingCatalog';
import { useCreateFlowOptional } from '../create/CreateFlowProvider';
import {
  listDiscoverySearchComposeStub,
  listDiscoverySearchRegisterBridgeStub,
} from './listDiscoverySearchCreateFlowStub';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { reloadExploreMap } from '../hooks/useExploreMap';
import { browseListFilterPatchForSearchScope } from './browse/browseListSearchCommit';
import type { BrowseListFilterState } from './browse/browseListFilters';
import {
  countExploreSearchScopes,
  parseExploreAreaSlug,
  useExplorePublishedAreasQuery,
  type ExploreActivityDatePreset,
  type ExploreSearchScopeKey,
} from './browse/discoveryListRuntime';
import { useBrowseListFeed } from './useBrowseListFeed';
import { useListDiscoveryUrlState } from './useListDiscoveryUrlState';
import { BrowseListCreateFab } from './ui/BrowseListCreateFab';
import { PeopleBrowsePanel } from '@/people-discovery/panel/PeopleBrowsePanel';
import { usePeopleDiscoveryAvailabilityCatalog } from '@/people-discovery/hooks/usePeopleDiscoveryAvailabilityCatalog';
import { exploreMapPathFromListSearch } from './routing';
import {
  listDiscoveryEmbeddedOnExplore,
  listDiscoveryExploreSearch,
  listDiscoverySearchChrome,
  type ListDiscoverySurface,
} from './listDiscoverySurface';
import {
  exploreSearchMapViewPathFromListSearch,
  exploreSearchResultsPath,
  parseExploreSearchBrowseState,
} from '../explore/search/exploreSearchRouting';
import {
  resolveExploreSearchTripPool,
  resolveExploreSearchVenuePool,
} from '../explore/search/exploreSearchJoinablePools';
import { exploreSearchWhereBrowseQuery } from '../explore/search/exploreSearchWhereQuery';
import { buildListFeedCards } from './buildListFeedCards';
import { sortBrowseListCards } from './browse/listBrowseSort';
import { setExploreClockStyle } from '@uaetrail/shared-types';
import { useDisplayPreferences } from '../preferences/useDisplayPreferences';
import { useMemberDiscoveryRoster } from '@/people-discovery/hooks/useMemberDiscoveryRoster';
import { useExplorePeopleAvailability } from '@/people-discovery/hooks/usePeopleAvailability';
import { resolveEffectiveBrowseVenueRegions } from './browse/browseGeoPath';
import { useBrowseGeoScopeHydration } from './browse/useBrowseGeoScopeHydration';
import { browseListEntityLinkState } from './browse/browseListNavState';
import { countBrowseListFilters } from './browse/browseListLayout';
import {
  browseListBucketCategories,
  parseBrowseListBucket,
  serializeBrowseListBucket,
} from './browse/browseListBucket';
import { browseListCatForBucket, scopeBrowseListStateForListCat } from './browse/browseListMapHandoff';
import { ListExplorer } from './explorer/ListExplorer';
import { ListFeedActionsProvider } from './ui/ListFeedActionsProvider';
import { ListCrewsExplorer } from './explorer/ListCrewsExplorer';
import { ListDiscoveryMapColumn } from './explorer/ListDiscoveryMapColumn';
import { ListSideMapResizeHandle } from './explorer/ListSideMapResizeHandle';
import { useBindExploreListMapHover } from '../explore/ExploreMapChromeContext';
import { useMinWidthMd } from '../hooks/useMinWidthMd';
import { useMinWidthPx } from '../hooks/useMinWidthPx';
import { collapseDesktopSideNav } from '../hooks/useDesktopSideNavExpanded';
import { useListSideMapWidth } from './explorer/useListSideMapWidth';
import {
  LIST_DISCOVERY_MAP_AUTO_MIN_PX,
  LIST_DISCOVERY_MAP_DISMISSED_STORAGE_KEY,
  LIST_DISCOVERY_MAP_OPEN_STORAGE_KEY,
} from './listDiscoveryMapLayout';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  browseListSearchUsesScopeHints,
  resolveBrowseListCreateFabLabel,
  resolveBrowseListSearchPlaceholder,
} from './browseListCopy';
import { resolveCreateFabComposeEntry } from '../explore/create/composeFabEntry';
import { availabilityFlexibleCompose } from '../explore/compose';
import { useHostingFromActivity } from '../explore/create/hooks/useHostingFromActivity';
import { useHostingWizardPrefill } from '../explore/create/hooks/useHostingWizardPrefill';
import { useExploreCreateFlowBridge } from '../explore/shell/useExploreCreateFlowBridge';

type ListDiscoveryExperienceProps = {
  surface: ListDiscoverySurface;
  onCloseMapOverlay?: () => void;
  overlayImmersive?: boolean;
  onImmersiveSubtitleChange?: (subtitle: string | null) => void;
  /** Explore desktop drawer — reuse map catalog (no projection=list refetch). */
  prefetchedCatalogItems?: ExploreMapItemDTO[];
  /** Explore embed — host compose for offer-rideshare lives on explore shell. */
  onOfferRideshareForAvailabilityItem?: (item: ExploreMapItemDTO) => void;
  /** Search results — hide in-list search; chrome owns query. */
  suppressSearch?: boolean;
};

const readListMapColumnOpen = (): boolean => {
  try {
    return sessionStorage.getItem(LIST_DISCOVERY_MAP_OPEN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeListMapColumnOpen = (open: boolean) => {
  try {
    sessionStorage.setItem(LIST_DISCOVERY_MAP_OPEN_STORAGE_KEY, open ? '1' : '0');
  } catch {
    /* ignore */
  }
};

const readListMapDismissed = (): boolean => {
  try {
    return sessionStorage.getItem(LIST_DISCOVERY_MAP_DISMISSED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeListMapDismissed = (dismissed: boolean) => {
  try {
    sessionStorage.setItem(LIST_DISCOVERY_MAP_DISMISSED_STORAGE_KEY, dismissed ? '1' : '0');
  } catch {
    /* ignore */
  }
};

export const ListDiscoveryExperience = ({
  surface,
  onCloseMapOverlay,
  overlayImmersive = false,
  onImmersiveSubtitleChange,
  prefetchedCatalogItems,
  onOfferRideshareForAvailabilityItem: embeddedOfferRideshare,
  suppressSearch = false,
}: ListDiscoveryExperienceProps) => {
  const embeddedOnExplore = listDiscoveryEmbeddedOnExplore(surface);
  const searchResultsChrome = listDiscoverySearchChrome(surface);
  const exploreSearch = listDiscoveryExploreSearch(surface);
  const suppressListSearch = suppressSearch || exploreSearch;
  const createFlowCtx = useCreateFlowOptional();
  if (!createFlowCtx && !exploreSearch) {
    throw new Error('useCreateFlow must be used under CreateFlowProvider (ProductShell).');
  }
  const compose = createFlowCtx?.compose ?? listDiscoverySearchComposeStub();
  const registerBridge = createFlowCtx?.registerBridge ?? listDiscoverySearchRegisterBridgeStub;
  const { user } = useAuth();
  const { clock } = useDisplayPreferences();
  const navigate = useNavigate();
  const location = useProductLocation();
  const { pathname } = location;
  const [searchParams, setSearchParams] = useProductSearchParams();
  const queryClient = useQueryClient();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const { refresh: refreshHostGate, tenantId } = useMemberStatus({ enabled: Boolean(user) });

  const reloadFeed = useCallback(async () => {
    await reloadExploreMap(queryClient);
    void refreshHostGate();
  }, [queryClient, refreshHostGate]);

  const browseUrl = useListDiscoveryUrlState({
    mapOverlay: embeddedOnExplore,
    searchResultsBrowse: searchResultsChrome,
  });
  const {
    filters,
    syncUrl,
    venueRegions,
    geoPath,
    listCat,
    layout,
    sort,
    crewsOpenLens,
    availabilitySheetOpen,
  } = browseUrl;
  useBrowseGeoScopeHydration(geoPath);
  const isPeopleCategory = listCat === 'people';
  const explorerBucket = parseBrowseListBucket(listCat);
  const createFabContext = useMemo(
    () => ({
      isPeopleCategory,
      explorerBucket,
    }),
    [isPeopleCategory, explorerBucket]
  );

  const listSearchPlaceholder = useMemo(
    () => resolveBrowseListSearchPlaceholder(listCat, explorerBucket),
    [listCat, explorerBucket]
  );
  const listSearchScopeHints = useMemo(() => browseListSearchUsesScopeHints(listCat), [listCat]);

  const createFabLabel = useMemo(
    () => resolveBrowseListCreateFabLabel(location.pathname, location.search, createFabContext),
    [location.pathname, location.search, createFabContext]
  );

  const handleCreateFabTap = useCallback(() => {
    compose.handleCreateTap(
      resolveCreateFabComposeEntry(location.pathname, location.search, createFabContext)
    );
  }, [compose, location.pathname, location.search, createFabContext]);

  const handleOpenMarkAvailability = useCallback(() => {
    compose.handleCreateTap(availabilityFlexibleCompose());
  }, [compose]);

  const availabilityLegacyMigratedRef = useRef(false);
  useEffect(() => {
    if (!availabilitySheetOpen || availabilityLegacyMigratedRef.current) return;
    availabilityLegacyMigratedRef.current = true;
    syncUrl({ availabilitySheet: false });
    compose.handleCreateTap(availabilityFlexibleCompose());
  }, [availabilitySheetOpen, compose, syncUrl]);

  const hostingFrom = useHostingFromActivity({
    user,
    tenantId,
    searchParams,
    setSearchParams,
    setComposeRoute: compose.setComposeRoute,
    hostComposeKind: compose.hostComposeRoute?.kind ?? null,
  });

  const [listSelectedId, setListSelectedId] = useState<string | null>(null);
  const hostingLauncher = useHostingWizardPrefill({
    pathname,
    search,
    searchParams,
    setSearchParams,
    user,
    navigate,
    compose,
    hostingFrom,
    selected: null,
    setSelectedId: setListSelectedId,
  });

  useExploreCreateFlowBridge({
    enabled: !embeddedOnExplore && Boolean(createFlowCtx),
    registerBridge,
    hostingWizardPrefill: hostingLauncher.hostingWizardPrefill,
    closeCreateFlow: hostingLauncher.closeCreateFlow,
    onHostingBackToIntent: hostingLauncher.onHostingBackToIntent,
    rideshareLinkAvailability: hostingLauncher.rideshareLinkAvailability,
    setRideshareLinkAvailability: hostingLauncher.setRideshareLinkAvailability,
    handleCreateLinkedRideshare: hostingLauncher.handleCreateLinkedRideshare,
    handleActivityPublished: reloadFeed,
    handleAvailabilityFixedSubmitted: () => void reloadFeed(),
    handleAddSubmitted: () => void reloadFeed(),
    planWithBuddyUserId: null,
    composeAreaSlug: null,
    facilityOnPlaceId: null,
    tenantId,
    refreshHostGate,
  });

  const offerRideshareForAvailabilityItem = embeddedOnExplore
    ? embeddedOfferRideshare
    : hostingLauncher.offerRideshareForAvailabilityItem;

  const [draftQuery, setDraftQuery] = useState(filters.query);
  useEffect(() => {
    setDraftQuery(filters.query);
  }, [filters.query]);
  const areaSlug = parseExploreAreaSlug(searchParams);
  const { data: publishedAreas = [] } = useExplorePublishedAreasQuery(!isPeopleCategory);
  const hubVenueRegions = useMemo(
    () => resolveEffectiveBrowseVenueRegions(venueRegions, geoPath, publishedAreas),
    [venueRegions, geoPath, publishedAreas]
  );
  const peopleSegment = filters.peopleBrowseTab;
  const crewsNeedsRoster =
    peopleSegment === 'hub' ||
    peopleSegment === 'going' ||
    peopleSegment === 'connect' ||
    peopleSegment === 'available' ||
    peopleSegment === 'looking';
  const crewsNeedsAvailability =
    peopleSegment === 'hub' ||
    peopleSegment === 'available' ||
    peopleSegment === 'looking';
  const memberRoster = useMemberDiscoveryRoster({
    enabled: isPeopleCategory && Boolean(user) && crewsNeedsRoster,
    search: draftQuery,
    activityDatePreset: filters.activityDatePreset,
    omitDirectory: !(peopleSegment === 'connect' || peopleSegment === 'hub'),
  });
  const memberAvailability = useExplorePeopleAvailability({
    enabled: isPeopleCategory && Boolean(user) && crewsNeedsAvailability,
    search: draftQuery,
    activityDatePreset: filters.activityDatePreset,
    areaSlug,
    mapFilter: 'all',
  });
  const wasGuestRef = useRef(!user);
  useEffect(() => {
    if (user && wasGuestRef.current) {
      wasGuestRef.current = false;
      void reloadExploreMap(queryClient);
    }
    if (!user) {
      wasGuestRef.current = true;
    }
  }, [user, queryClient]);

  const {
    cards: feedCards,
    filteredItems,
    items,
    isLoading,
    isError,
    refetch: reloadMap,
  } = useBrowseListFeed({
    filters: isPeopleCategory
      ? { ...filters, query: draftQuery, categories: [] }
      : {
          ...filters,
          query: draftQuery,
          categories:
            listCat === 'agencies' ? ['agencies'] : browseListBucketCategories(explorerBucket),
        },
    venueRegions,
    geoPath,
    mapEnabled:
      !isPeopleCategory ||
      peopleSegment === 'looking' ||
      ((peopleSegment === 'available' || peopleSegment === 'hub') &&
        (crewsOpenLens === 'all' || crewsOpenLens === 'looking')),
    catalogItems: embeddedOnExplore ? prefetchedCatalogItems : undefined,
  });

  const searchResultsBrowse = useMemo(
    () => (exploreSearch ? parseExploreSearchBrowseState(searchParams) : null),
    [exploreSearch, searchParams]
  );
  const searchResultsMapView = searchResultsBrowse?.view === 'map';

  const exploreSearchMapPool = useMemo(() => {
    if (!exploreSearch || isPeopleCategory) return null;
    const searchBrowse = searchResultsBrowse ?? parseExploreSearchBrowseState(searchParams);
    const browseQuery = exploreSearchWhereBrowseQuery(searchBrowse.query.trim() || filters.query);
    const scopedFilters =
      listCat === 'venues'
        ? scopeBrowseListStateForListCat({ ...filters, query: browseQuery }, 'venues')
        : scopeBrowseListStateForListCat(
            {
              ...filters,
              query: browseQuery,
              activityDatePreset:
                searchBrowse.searchScope === 'places'
                  ? filters.activityDatePreset
                  : searchBrowse.activityDatePreset,
            },
            'activities'
          );
    return listCat === 'venues'
      ? resolveExploreSearchVenuePool(items, scopedFilters, hubVenueRegions, geoPath, publishedAreas).pool
      : resolveExploreSearchTripPool(items, scopedFilters, hubVenueRegions, geoPath, publishedAreas).pool;
  }, [
    exploreSearch,
    filters,
    geoPath,
    hubVenueRegions,
    isPeopleCategory,
    items,
    listCat,
    publishedAreas,
    searchParams,
    searchResultsBrowse,
  ]);

  const exploreSearchCards = useMemo(() => {
    if (!exploreSearchMapPool) return null;
    setExploreClockStyle(clock);
    const built = buildListFeedCards(exploreSearchMapPool, user, items);
    return sortBrowseListCards(built, sort, null);
  }, [clock, exploreSearchMapPool, items, sort, user]);

  const cards = exploreSearchCards ?? feedCards;

  const { availabilityCatalogItems } = usePeopleDiscoveryAvailabilityCatalog({
    enabled: isPeopleCategory && crewsNeedsAvailability,
    exploreCatalogFallback: items,
    filters: {
      mapFilter: 'all',
      buddySubtype: 'all',
      outingTopic: 'all',
      query: draftQuery,
    },
  });

  const handleOpenAvailabilityCatalogItem = useCallback(
    (item: { path: string }) => {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(item.path, { state: browseListEntityLinkState(returnTo) });
    },
    [location.pathname, location.search, navigate]
  );

  const searchScopeCounts = useMemo(
    () => countExploreSearchScopes(items, draftQuery, filters.activityDatePreset, venueRegions),
    [items, draftQuery, filters.activityDatePreset, venueRegions]
  );

  const filterCount = isPeopleCategory
    ? filters.activityDatePreset !== 'anyday'
      ? 1
      : 0
    : countBrowseListFilters(filters, venueRegions, explorerBucket, geoPath.length);

  const crewsStatCounts = useMemo(() => {
    const buddiesCount = memberRoster.loading ? null : memberRoster.friendsGoing.length;
    const markedCount = memberAvailability.loading ? 0 : memberAvailability.people.length;
    const lookingCount = isLoading ? 0 : availabilityCatalogItems.length;
    const availableCount = markedCount + lookingCount;
    const everyoneCount = memberRoster.loading ? null : memberRoster.directory.length;
    return {
      buddies: buddiesCount,
      available: memberRoster.loading || memberAvailability.loading || isLoading ? null : availableCount,
      everyone: everyoneCount,
    };
  }, [
    memberRoster.loading,
    memberRoster.friendsGoing.length,
    memberRoster.directory.length,
    memberAvailability.loading,
    memberAvailability.people.length,
    isLoading,
    availabilityCatalogItems.length,
  ]);

  const commitQuery = () => {
    syncUrl({ query: draftQuery });
  };

  const handleSearchCommit = (scope?: ExploreSearchScopeKey | null) => {
    if (scope === 'facilities') return;
    if (scope === 'people') {
      syncUrl({
        query: draftQuery,
        listCat: 'people',
        categories: ['people'],
        tripAvailabilityOnly: false,
        tripTopics: [],
        placeTopics: [],
        activityDatePreset: 'anyday',
      });
      return;
    }
    if (scope === 'activities') {
      syncUrl({
        query: draftQuery,
        listCat: 'activities',
        ...scopeBrowseListStateForListCat(filters, 'activities'),
      });
      return;
    }
    if (scope === 'places' || scope === 'shops') {
      const patch = browseListFilterPatchForSearchScope(scope);
      syncUrl({
        query: draftQuery,
        listCat: 'venues',
        ...scopeBrowseListStateForListCat(
          { ...filters, placeTopics: patch?.placeTopics ?? [] },
          'venues'
        ),
      });
      return;
    }
    if (scope === 'agencies') {
      syncUrl({ query: draftQuery, listCat: 'agencies', categories: ['agencies'] });
      return;
    }
    const cat = listCat ?? browseListCatForBucket(explorerBucket);
    syncUrl({
      query: draftQuery,
      listCat: cat,
      ...scopeBrowseListStateForListCat(filters, cat === 'venues' ? 'venues' : 'activities'),
    });
  };

  const clearAllFilters = () => {
    const cat = listCat ?? browseListCatForBucket(explorerBucket);
    const emptyBase: BrowseListFilterState = {
      query: '',
      categories: [],
      tripTopics: [],
      placeTopics: [],
      tripAvailabilityOnly: false,
      price: 'all',
      when: 'any',
      activityDatePreset: 'anyday',
      peopleBrowseTab: filters.peopleBrowseTab,
      hasTrip: false,
      facilityKinds: [],
      audience: 'anyone',
    };
  const scoped =
      cat === 'venues' || cat === 'activities'
        ? scopeBrowseListStateForListCat(emptyBase, cat)
        : emptyBase;
    syncUrl({ ...scoped, listCat: cat, regions: [], geoPath: [] });
    setDraftQuery('');
  };

  const handleActivityDatePresetChange = useCallback(
    (preset: ExploreActivityDatePreset) => syncUrl({ activityDatePreset: preset }),
    [syncUrl]
  );

  const handleClearGeoScope = useCallback(() => syncUrl({ geoPath: [] }), [syncUrl]);

  const handlePopGeoScope = useCallback(
    () => syncUrl({ geoPath: geoPath.slice(0, -1) }),
    [geoPath, syncUrl]
  );

  const handleVenueRegionsChange = useCallback(
    (regions: string[]) => syncUrl({ regions }),
    [syncUrl]
  );

  useEffect(() => {
    onImmersiveSubtitleChange?.(null);
  }, [onImmersiveSubtitleChange]);

  const mapHref = useMemo(() => {
    if (onCloseMapOverlay) return EXPLORE_MAP_PATH;
    if (exploreSearch) {
      const searchBrowse = parseExploreSearchBrowseState(searchParams);
      return searchBrowse.view === 'map'
        ? exploreSearchResultsPath({ ...searchBrowse, view: 'list' })
        : exploreSearchMapViewPathFromListSearch(search);
    }
    return exploreMapPathFromListSearch(search);
  }, [exploreSearch, onCloseMapOverlay, search, searchParams]);

  const desktopMd = useMinWidthMd();
  const wideListMapSplit = useMinWidthPx(LIST_DISCOVERY_MAP_AUTO_MIN_PX);
  const [listMapColumnOpen, setListMapColumnOpen] = useState(readListMapColumnOpen);
  const [listMapDismissed, setListMapDismissed] = useState(readListMapDismissed);
  const [listMapHighlightedId, setListMapHighlightedId] = useState<string | null>(null);
  const [listMapSelectedId, setListMapSelectedId] = useState<string | null>(null);
  const listMapSplitEnabled = !embeddedOnExplore && !isPeopleCategory && !exploreSearch;
  const showListMapColumn =
    listMapSplitEnabled && desktopMd && !listMapDismissed && (wideListMapSplit || listMapColumnOpen);
  const showListMapColumnPrompt =
    listMapSplitEnabled &&
    desktopMd &&
    !showListMapColumn &&
    (listMapDismissed || !wideListMapSplit);

  useBindExploreListMapHover(setListMapHighlightedId);

  const openListMapColumn = useCallback(() => {
    collapseDesktopSideNav();
    setListMapDismissed(false);
    writeListMapDismissed(false);
    setListMapColumnOpen(true);
    writeListMapColumnOpen(true);
  }, []);

  const closeListMapColumn = useCallback(() => {
    setListMapDismissed(true);
    writeListMapDismissed(true);
    setListMapColumnOpen(false);
    writeListMapColumnOpen(false);
    setListMapHighlightedId(null);
    setListMapSelectedId(null);
  }, []);

  useEffect(() => {
    if (wideListMapSplit && !listMapDismissed) {
      setListMapColumnOpen(false);
      writeListMapColumnOpen(false);
    }
  }, [wideListMapSplit, listMapDismissed]);

  const handleListMapSelectItem = useCallback(
    (item: ExploreMapItemDTO) => {
      setListMapSelectedId(item.id);
      setListMapHighlightedId(item.id);
      if (exploreSearch && item.path) {
        const returnTo = `${location.pathname}${location.search}`;
        navigate(item.path, { state: browseListEntityLinkState(returnTo) });
      }
    },
    [exploreSearch, location.pathname, location.search, navigate]
  );

  const sideMapWidth = useListSideMapWidth(showListMapColumn);

  const hubListRoot =
    searchResultsChrome ? 'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden' : undefined;

  return (
    <div className={hubListRoot}>
      {isPeopleCategory ? (
        embeddedOnExplore ? (
          <PeopleBrowsePanel
            embedded
            isDesktop={surface === 'exploreSidebar'}
            query={draftQuery}
            onQueryChange={setDraftQuery}
            onQuerySync={commitQuery}
            onClose={() => syncUrl({ listCat: null, categories: [] })}
            peopleBrowseTab={filters.peopleBrowseTab === 'hub' ? 'looking' : filters.peopleBrowseTab}
            onPeopleBrowseTabChange={(tab) => syncUrl({ peopleBrowseTab: tab })}
            memberPeopleNetwork={[]}
            memberPeopleLoading={false}
            memberPeopleError={null}
            onRefreshMemberPeople={() => {}}
            discoveryFriendsGoing={memberRoster.friendsGoing}
            discoveryHostsGoing={memberRoster.hostsGoing}
            discoveryAvailabilityOnMap={memberRoster.availabilityOnMap}
            discoveryFollowed={memberRoster.followed}
            discoveryDirectory={memberRoster.directory}
            discoveryQuota={memberRoster.quota}
            discoveryLoading={memberRoster.loading}
            discoveryError={memberRoster.error}
            onRefreshMemberDiscovery={() => void memberRoster.refresh()}
            availabilityPeople={memberAvailability.people}
            availabilityLoading={memberAvailability.loading}
            availabilityError={memberAvailability.error}
            onRefreshAvailability={() => void memberAvailability.refresh()}
            isSignedIn={Boolean(user)}
            userRole={user?.role}
            availabilityCatalogItems={availabilityCatalogItems}
            exploreCatalogItems={items}
            exploreCatalogLoading={isLoading}
            onOpenAvailabilityCatalogItem={handleOpenAvailabilityCatalogItem}
            onOfferRideshareForAvailabilityItem={offerRideshareForAvailabilityItem}
          />
        ) : (
          <ListCrewsExplorer
            query={draftQuery}
            onQueryChange={setDraftQuery}
            onQuerySync={commitQuery}
            onSearchCommit={handleSearchCommit}
            onClearQuery={() => syncUrl({ query: '' })}
            searchScopeCounts={searchScopeCounts}
            mapHref={mapHref}
            suppressSearch={suppressListSearch}
            searchPlaceholder={listSearchPlaceholder}
            enableSearchScopeHints={listSearchScopeHints}
            searchResultsChrome={searchResultsChrome}
            exploreSearchResults={exploreSearch}
            peopleBrowseTab={filters.peopleBrowseTab}
            onPeopleBrowseTabChange={(tab) => syncUrl({ peopleBrowseTab: tab, crewsOpen: null })}
            crewsOpenLens={crewsOpenLens}
            onCrewsOpenLensChange={(lens) => syncUrl({ crewsOpen: lens })}
            onOpenMarkAvailability={handleOpenMarkAvailability}
            isSignedIn={Boolean(user)}
            filterCount={filterCount}
            statCounts={crewsStatCounts}
            availabilityCatalogItems={availabilityCatalogItems}
            exploreCatalogItems={items}
            exploreCatalogLoading={isLoading}
            onOpenAvailabilityCatalogItem={handleOpenAvailabilityCatalogItem}
            onOfferRideshareForAvailabilityItem={offerRideshareForAvailabilityItem}
            availabilityPeople={memberAvailability.people}
            availabilityLoading={memberAvailability.loading}
            availabilityError={memberAvailability.error}
            discoveryFriendsGoing={memberRoster.friendsGoing}
            discoveryHostsGoing={memberRoster.hostsGoing}
            discoveryDirectory={memberRoster.directory}
            discoveryQuota={memberRoster.quota}
            discoveryLoading={memberRoster.loading}
            discoveryError={memberRoster.error}
          />
        )
      ) : exploreSearch && searchResultsMapView && !isPeopleCategory ? (
        <ListDiscoveryMapColumn
          presentation="primary"
          items={exploreSearchMapPool ?? []}
          loading={isLoading}
          highlightedExploreItemId={listMapHighlightedId}
          selectedExploreItemId={listMapSelectedId}
          onSelectItem={handleListMapSelectItem}
          layoutRevision={searchResultsMapView}
          className="mx-auto w-full max-w-lg rounded-2xl border border-neutral-200"
        />
      ) : (
        <ListFeedActionsProvider>
        <div ref={sideMapWidth.splitRef} className="flex h-full min-h-0 min-w-0 flex-1 flex-row">
          <ListExplorer
            cards={cards}
            loading={isLoading}
            error={isError}
            onRetry={() => void reloadMap()}
            onClose={onCloseMapOverlay}
            embedded={embeddedOnExplore}
            query={draftQuery}
            onQueryChange={setDraftQuery}
            onQuerySync={commitQuery}
            onSearchCommit={handleSearchCommit}
            onClearQuery={() => syncUrl({ query: '' })}
            searchScopeCounts={searchScopeCounts}
            mapHref={mapHref}
            layout={layout}
            onLayoutChange={(next) => syncUrl({ layout: next })}
            bucket={explorerBucket}
            onBucketChange={(next) => {
              const cat = browseListCatForBucket(next);
              syncUrl({
                query: draftQuery,
                listCat: cat,
                ...scopeBrowseListStateForListCat(filters, cat),
                regions: venueRegions,
                ...(next === 'places' && layout === 'calendar' ? { layout: 'thumbnails' as const } : {}),
              });
            }}
            hideBucketToggleOnMobile={!embeddedOnExplore || searchResultsChrome}
            suppressSearch={suppressListSearch}
            searchResultsChrome={searchResultsChrome}
            exploreSearchResults={exploreSearch}
            suppressMapListToggle={searchResultsChrome}
            suppressDateSectionHeaders={listCat === 'activities'}
            filters={filters}
            regions={venueRegions}
            filterCount={filterCount}
            onApplyFilters={(state, regions) => syncUrl({ ...state, regions })}
            onClearFilters={clearAllFilters}
            mapColumnVisible={showListMapColumn}
            showMapColumnPrompt={showListMapColumnPrompt}
            onOpenMapColumn={openListMapColumn}
            onMapHover={showListMapColumn ? setListMapHighlightedId : undefined}
            sort={sort}
            onSortChange={(next) => syncUrl({ sort: next })}
            showGuestCatalogPreview={!user && !embeddedOnExplore && !isPeopleCategory}
            listPanelWidthPx={showListMapColumn ? sideMapWidth.listPanelWidth : undefined}
            onTripTopicsChange={(next) => syncUrl({ tripTopics: next, tripAvailabilityOnly: false })}
            onPlaceTopicsChange={(next) => syncUrl({ placeTopics: next })}
            onPriceChange={(next) => syncUrl({ price: next })}
            onHasTripChange={(next) => syncUrl({ hasTrip: next })}
            onFacilityKindsChange={(next) => syncUrl({ facilityKinds: next })}
            onVenueFiltersChange={(next) => syncUrl({ placeTopics: next.placeTopics, facilityKinds: next.facilityKinds })}
            onActivityDatePresetChange={handleActivityDatePresetChange}
            onVenueRegionsChange={handleVenueRegionsChange}
            searchPlaceholder={listSearchPlaceholder}
            enableSearchScopeHints={listSearchScopeHints}
            geoPath={geoPath}
            onClearGeoScope={handleClearGeoScope}
            onPopGeoScope={geoPath.length > 1 ? handlePopGeoScope : undefined}
          />
          {showListMapColumn ? (
            <>
              <ListSideMapResizeHandle
                getStartWidth={sideMapWidth.getStartListWidth}
                onWidthChange={sideMapWidth.setListPanelWidthClamped}
                onResizeCommit={sideMapWidth.commitListPanelWidth}
                ariaValueNow={sideMapWidth.listPanelWidth}
                ariaValueMax={sideMapWidth.listPanelMaxPx()}
              />
              <ListDiscoveryMapColumn
                items={filteredItems}
                loading={isLoading}
                highlightedExploreItemId={listMapHighlightedId}
                selectedExploreItemId={listMapSelectedId}
                onSelectItem={handleListMapSelectItem}
                onClose={closeListMapColumn}
                layoutRevision={sideMapWidth.listPanelWidth}
              />
            </>
          ) : null}
        </div>
        </ListFeedActionsProvider>
      )}

      {embeddedOnExplore || overlayImmersive || exploreSearch ? null : (
        <BrowseListCreateFab onClick={handleCreateFabTap} label={createFabLabel} />
      )}
    </div>
  );
};
