/** List discovery orchestration — browse + people + map split (R2, mirrors explore shell model). */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductLocation, useProductSearchParams } from '../../routing/useEffectiveLocation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useCreateFlowOptional } from '../../create/CreateFlowProvider';
import {
  listDiscoverySearchComposeStub,
  listDiscoverySearchRegisterBridgeStub,
} from '../browse/listDiscoverySearchCreateFlowStub';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { reloadExploreMap } from '../../hooks/useExploreMap';
import { browseListFilterPatchForSearchScope } from '../browse/browseListSearchCommit';
import type { BrowseListFilterState } from '../browse/browseListFilters';
import {
  countExploreSearchScopes,
  parseExploreAreaSlug,
  useExplorePublishedAreasQuery,
  type ExploreActivityDatePreset,
  type ExploreSearchScopeKey,
} from '../browse/discoveryListRuntime';
import { useBrowseListFeed } from '../browse/useBrowseListFeed';
import { useListDiscoveryUrlState } from '../browse/useListDiscoveryUrlState';
import { exploreMapPathFromListSearch } from '../browse/browseListRouting';
import {
  listDiscoveryEmbeddedOnExplore,
  listDiscoveryExploreSearch,
  listDiscoverySearchChrome,
  type ListDiscoverySurface,
} from '../browse/listDiscoverySurface';
import { useDisplayPreferences } from '../../preferences/useDisplayPreferences';
import { resolveEffectiveBrowseVenueRegions } from '../browse/browseGeoPath';
import { useBrowseGeoScopeHydration } from '../browse/useBrowseGeoScopeHydration';
import { countBrowseListFilters } from '../browse/browseListLayout';
import {
  browseListBucketCategories,
  parseBrowseListBucket,
} from '../browse/browseListBucket';
import { browseListCatForBucket, scopeBrowseListStateForListCat } from '../browse/browseListMapHandoff';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  crewsCategoryMapFeedEnabled,
  useListDiscoveryCrewsCategoryAugment,
  useListDiscoveryCrewsCategoryModel,
} from './useListDiscoveryCrewsCategoryModel';
import { useListDiscoveryMapSplitModel } from './useListDiscoveryMapSplitModel';
import {
  resolveListDiscoveryMapHref,
  useListDiscoveryExploreSearchFeedModel,
} from './useListDiscoveryExploreSearchFeedModel';
import {
  browseListSearchUsesScopeHints,
  resolveBrowseListCreateFabLabel,
  resolveBrowseListSearchPlaceholder,
} from '../browse/browseListCopy';
import { resolveCreateFabComposeEntry } from '../../explore/create/composeFabEntry';
import { availabilityFlexibleCompose } from '../../explore/compose';
import { useHostingFromActivity } from '../../explore/create/hooks/useHostingFromActivity';
import { useHostingWizardPrefill } from '../../explore/create/hooks/useHostingWizardPrefill';
import { useExploreCreateFlowBridge } from '../../explore/shell/useExploreCreateFlowBridge';

export type ListDiscoveryExperienceProps = {
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

export const useListDiscoveryExperienceModel = ({
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
  const { memberRoster, memberAvailability, crewsNeedsAvailability } = useListDiscoveryCrewsCategoryModel({
    enabled: isPeopleCategory,
    user,
    draftQuery,
    peopleBrowseTab: peopleSegment,
    activityDatePreset: filters.activityDatePreset,
    areaSlug,
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
      !isPeopleCategory || crewsCategoryMapFeedEnabled(peopleSegment, crewsOpenLens),
    catalogItems: embeddedOnExplore ? prefetchedCatalogItems : undefined,
  });

  const {
    searchResultsMapView: exploreSearchMapView,
    exploreSearchMapPool,
    cards,
  } = useListDiscoveryExploreSearchFeedModel({
    exploreSearch,
    isPeopleCategory,
    searchParams,
    search,
    filters,
    listCat,
    items,
    hubVenueRegions,
    geoPath,
    publishedAreas,
    clock,
    sort,
    user,
    feedCards,
  });

  const { availabilityCatalogItems, handleOpenAvailabilityCatalogItem, crewsStatCounts } =
    useListDiscoveryCrewsCategoryAugment({
      enabled: isPeopleCategory,
      peopleBrowseTab: peopleSegment,
      crewsNeedsAvailability,
      draftQuery,
      exploreCatalogItems: items,
      exploreCatalogLoading: isLoading,
      memberRoster,
      memberAvailability,
      navigate,
      locationPathname: location.pathname,
      locationSearch: location.search,
    });

  const searchScopeCounts = useMemo(
    () => countExploreSearchScopes(items, draftQuery, filters.activityDatePreset, venueRegions),
    [items, draftQuery, filters.activityDatePreset, venueRegions]
  );

  const filterCount = isPeopleCategory
    ? filters.activityDatePreset !== 'anyday'
      ? 1
      : 0
    : countBrowseListFilters(filters, venueRegions, explorerBucket, geoPath.length);

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

  const mapHref = useMemo(
    () =>
      resolveListDiscoveryMapHref({
        onCloseMapOverlay,
        exploreSearch,
        searchParams,
        search,
      }),
    [exploreSearch, onCloseMapOverlay, search, searchParams]
  );

  const {
    showListMapColumn,
    showListMapColumnPrompt,
    openListMapColumn,
    closeListMapColumn,
    listMapHighlightedId,
    setListMapHighlightedId,
    listMapSelectedId,
    handleListMapSelectItem,
    sideMapWidth,
  } = useListDiscoveryMapSplitModel({
    enabled: !embeddedOnExplore && !isPeopleCategory && !exploreSearch,
    exploreSearch,
    navigate,
    locationPathname: location.pathname,
    locationSearch: location.search,
  });

  const hubListRoot =
    searchResultsChrome ? 'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden' : undefined;

  return {
    surface,
    onCloseMapOverlay,
    overlayImmersive,
    hubListRoot,
    embeddedOnExplore,
    searchResultsChrome,
    exploreSearch,
    suppressListSearch,
    user,
    draftQuery,
    setDraftQuery,
    commitQuery,
    handleSearchCommit,
    syncUrl,
    filters,
    isPeopleCategory,
    memberRoster,
    memberAvailability,
    availabilityCatalogItems,
    offerRideshareForAvailabilityItem,
    handleOpenAvailabilityCatalogItem,
    searchScopeCounts,
    mapHref,
    listSearchPlaceholder,
    listSearchScopeHints,
    crewsOpenLens,
    handleOpenMarkAvailability,
    filterCount,
    crewsStatCounts,
    items,
    isLoading,
    exploreSearchMapView,
    exploreSearchMapPool,
    listMapHighlightedId,
    listMapSelectedId,
    handleListMapSelectItem,
    cards,
    isError,
    reloadMap,
    explorerBucket,
    layout,
    venueRegions,
    listCat,
    geoPath,
    clearAllFilters,
    showListMapColumn,
    showListMapColumnPrompt,
    openListMapColumn,
    setListMapHighlightedId,
    sort,
    handleActivityDatePresetChange,
    handleVenueRegionsChange,
    handleClearGeoScope,
    handlePopGeoScope,
    filteredItems,
    sideMapWidth,
    closeListMapColumn,
    handleCreateFabTap,
    createFabLabel,
  };
};
