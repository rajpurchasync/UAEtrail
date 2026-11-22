/** List discovery orchestration — composes browse URL, feed, crews, search, map, compose shells. */

import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductLocation, useProductSearchParams } from '../../routing/useEffectiveLocation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { reloadExploreMap } from '../../hooks/useExploreMap';
import { countExploreSearchScopes } from '../browse/discoveryListRuntime';
import { useBrowseListFeed } from '../browse/useBrowseListFeed';
import {
  listDiscoveryEmbeddedOnExplore,
  listDiscoveryExploreSearch,
  listDiscoverySearchChrome,
  type ListDiscoverySurface,
} from '../browse/listDiscoverySurface';
import { useDisplayPreferences } from '../../preferences/useDisplayPreferences';
import { browseListBucketCategories } from '../browse/browseListBucket';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { crewsCategoryMapFeedEnabled } from '@/crew-discovery/crewBrowseState';
import {
  useListDiscoveryCrewsCategoryAugment,
  useListDiscoveryCrewsCategoryModel,
} from './useListDiscoveryCrewsCategoryModel';
import { useListDiscoveryMapSplitModel } from './useListDiscoveryMapSplitModel';
import {
  resolveListDiscoveryMapHref,
  useListDiscoveryExploreSearchFeedModel,
} from './useListDiscoveryExploreSearchFeedModel';
import { useListDiscoveryComposeBridgeModel } from './useListDiscoveryComposeBridgeModel';
import { useListDiscoveryBrowseActionsModel } from './useListDiscoveryBrowseActionsModel';
import { useListDiscoveryBrowseUrlModel } from './useListDiscoveryBrowseUrlModel';

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
  const { user } = useAuth();
  const { clock } = useDisplayPreferences();
  const navigate = useNavigate();
  const location = useProductLocation();
  const { pathname } = location;
  const [searchParams, setSearchParams] = useProductSearchParams();
  const queryClient = useQueryClient();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const {
    filters,
    syncUrl,
    venueRegions,
    geoPath,
    listCat,
    layout,
    sort,
    crewsOpenLens,
    crewsAvailabilityGuideFilter,
    isPeopleCategory,
    explorerBucket,
    createFabContext,
    listSearchPlaceholder,
    listSearchScopeHints,
    draftQuery,
    setDraftQuery,
    areaSlug,
    publishedAreas,
    hubVenueRegions,
    filterCount,
  } = useListDiscoveryBrowseUrlModel({
    mapOverlay: embeddedOnExplore,
    searchResultsBrowse: searchResultsChrome,
    searchParams,
  });

  const { handleCreateFabTap, handleOpenMarkAvailability, createFabLabel, offerRideshareForAvailabilityItem } =
    useListDiscoveryComposeBridgeModel({
      exploreSearch,
      embeddedOnExplore,
      embeddedOfferRideshare: embeddedOfferRideshare,
      user,
      pathname,
      search,
      searchParams,
      setSearchParams,
      navigate,
      locationPathname: location.pathname,
      locationSearch: location.search,
      createFabContext,
    });

  const { memberRoster, memberAvailability, crewsNeedsAvailability } = useListDiscoveryCrewsCategoryModel({
    enabled: isPeopleCategory,
    user,
    draftQuery,
    crewBrowseLane: filters.crewBrowseLane,
    crewPeopleFacet: filters.crewPeopleFacet,
    crewProfessionalKind: filters.crewProfessionalKind,
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
      !isPeopleCategory ||
      crewsCategoryMapFeedEnabled(
        {
          lane: filters.crewBrowseLane,
          facet: filters.crewPeopleFacet,
          proKind: filters.crewProfessionalKind,
        },
        crewsOpenLens
      ),
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
      crewBrowseLane: filters.crewBrowseLane,
      crewPeopleFacet: filters.crewPeopleFacet,
      crewProfessionalKind: filters.crewProfessionalKind,
      crewsNeedsAvailability,
      crewsOpenLens,
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

  const {
    commitQuery,
    handleSearchCommit,
    clearAllFilters,
    handleActivityDatePresetChange,
    handleClearGeoScope,
    handlePopGeoScope,
    handleVenueRegionsChange,
  } = useListDiscoveryBrowseActionsModel({
    draftQuery,
    setDraftQuery,
    filters,
    listCat,
    explorerBucket,
    geoPath,
    syncUrl,
  });

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
    crewsAvailabilityGuideFilter,
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