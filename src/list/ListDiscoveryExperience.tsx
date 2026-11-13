import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { EXPLORE_MAP_PATH } from '../config/routingCatalog';
import { useCreateFlow } from '../create/CreateFlowProvider';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { reloadExploreMap } from '../hooks/useExploreMap';
import { browseListFilterPatchForSearchScope } from './listDiscoverySearchCommit';
import type { BrowseListFilterState } from './browseListFilters';
import { countExploreSearchScopes } from '../explore/exploreSearchMatches';
import type { ExploreSearchScopeKey } from '../explore/exploreBrowseTaxonomy';
import { useBrowseListFeed } from './useBrowseListFeed';
import { useListDiscoveryUrlState } from './useListDiscoveryUrlState';
import { BrowseListCreateFab } from './ui/BrowseListCreateFab';
import { BrowseListMapFab } from './ui/BrowseListMapFab';
import { PeopleBrowsePanel } from '@/people-discovery/panel/PeopleBrowsePanel';
import { usePeopleDiscoverySeekingActivities } from '@/people-discovery/hooks/usePeopleDiscoverySeekingActivities';
import { exploreMapPathFromListSearch } from './routing';
import { listDiscoveryEmbeddedOnExplore, type ListDiscoverySurface } from './listDiscoverySurface';
import { useMemberDiscoveryRoster } from '@/people-discovery/hooks/useMemberDiscoveryRoster';
import { useExplorePeopleAvailability } from '@/people-discovery/hooks/usePeopleAvailability';
import { parseExploreAreaSlug } from '../explore/exploreAreaFilter';
import { listExplorerEntityLinkState } from './explorer/listExplorerNavState';
import { countListExplorerFilters } from './explorer/listExplorerLayout';
import {
  listExplorerBucketCategories,
  parseListExplorerBucket,
  serializeListExplorerBucket,
} from './explorer/listExplorerBucket';
import { listCatForListExplorerBucket, scopeBrowseListStateForListCat } from './browseListMapHandoff';
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
import type { ExploreActivityDatePreset } from '../explore/exploreActivityDateFilter';
import { resolveBrowseListCreateFabLabel } from './browseListCopy';
import { resolveCreateFabComposeEntry } from '../explore/create/composeFabEntry';

type ListDiscoveryExperienceProps = {
  surface: ListDiscoverySurface;
  onCloseMapOverlay?: () => void;
  overlayImmersive?: boolean;
  onImmersiveSubtitleChange?: (subtitle: string | null) => void;
  /** Explore desktop drawer — reuse map catalog (no projection=list refetch). */
  prefetchedCatalogItems?: ExploreMapItemDTO[];
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
}: ListDiscoveryExperienceProps) => {
  const embeddedOnExplore = listDiscoveryEmbeddedOnExplore(surface);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const { refresh: refreshHostGate } = useMemberStatus({ enabled: Boolean(user) });
  const { compose, registerBridge } = useCreateFlow();

  const reloadFeed = useCallback(async () => {
    await reloadExploreMap(queryClient);
    void refreshHostGate();
  }, [queryClient, refreshHostGate]);

  const browseUrl = useListDiscoveryUrlState({ mapOverlay: embeddedOnExplore });
  const {
    filters,
    syncUrl,
    venueRegions,
    listCat,
    layout,
    sort,
    crewsOpenLens,
    availabilitySheetOpen,
  } = browseUrl;
  const isPeopleCategory = listCat === 'people';
  const explorerBucket = parseListExplorerBucket(listCat);
  const createFabContext = useMemo(
    () => ({
      isPeopleCategory,
      explorerBucket,
    }),
    [isPeopleCategory, explorerBucket]
  );

  const createFabLabel = useMemo(
    () => resolveBrowseListCreateFabLabel(location.pathname, location.search, createFabContext),
    [location.pathname, location.search, createFabContext]
  );

  const handleCreateFabTap = useCallback(() => {
    compose.handleCreateTap(
      resolveCreateFabComposeEntry(location.pathname, location.search, createFabContext)
    );
  }, [compose, location.pathname, location.search, createFabContext]);

  useEffect(() => {
    if (embeddedOnExplore) return undefined;
    registerBridge({
      onActivityPublished: () => void reloadFeed(),
      onSeekingSubmitted: () => void reloadFeed(),
      onAddSubmitted: () => void reloadFeed(),
    });
    return () => registerBridge(null);
  }, [embeddedOnExplore, registerBridge, reloadFeed]);
  const [draftQuery, setDraftQuery] = useState(filters.query);
  useEffect(() => {
    setDraftQuery(filters.query);
  }, [filters.query]);
  const areaSlug = parseExploreAreaSlug(searchParams);
  const peopleSegment = filters.buddiesSegment;
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

  const { cards, filteredItems, items, isLoading, isError, refetch: reloadMap } = useBrowseListFeed({
    filters: isPeopleCategory
      ? { ...filters, query: draftQuery, categories: [] }
      : {
          ...filters,
          query: draftQuery,
          categories:
            listCat === 'agencies' ? ['agencies'] : listExplorerBucketCategories(explorerBucket),
        },
    venueRegions,
    mapEnabled:
      !isPeopleCategory ||
      peopleSegment === 'looking' ||
      ((peopleSegment === 'available' || peopleSegment === 'hub') &&
        (crewsOpenLens === 'all' || crewsOpenLens === 'looking')),
    catalogItems: embeddedOnExplore ? prefetchedCatalogItems : undefined,
  });

  const { seekingActivities } = usePeopleDiscoverySeekingActivities({
    enabled: isPeopleCategory && crewsNeedsAvailability,
    exploreCatalogFallback: items,
    filters: {
      mapFilter: 'all',
      buddySubtype: 'all',
      outingTopic: 'all',
      query: draftQuery,
    },
  });

  const handleOpenSeekingActivity = useCallback(
    (item: { path: string }) => {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(item.path, { state: listExplorerEntityLinkState(returnTo) });
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
    : countListExplorerFilters(filters, venueRegions, explorerBucket);

  const crewsStatCounts = useMemo(() => {
    const buddiesCount = memberRoster.loading ? null : memberRoster.friendsGoing.length;
    const markedCount = memberAvailability.loading ? 0 : memberAvailability.people.length;
    const lookingCount = isLoading ? 0 : seekingActivities.length;
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
    seekingActivities.length,
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
        tripLookingOnly: false,
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
    const cat = listCat ?? listCatForListExplorerBucket(explorerBucket);
    syncUrl({
      query: draftQuery,
      listCat: cat,
      ...scopeBrowseListStateForListCat(filters, cat === 'venues' ? 'venues' : 'activities'),
    });
  };

  const clearAllFilters = () => {
    const cat = listCat ?? listCatForListExplorerBucket(explorerBucket);
    const emptyBase: BrowseListFilterState = {
      query: '',
      categories: [],
      tripTopics: [],
      placeTopics: [],
      tripLookingOnly: false,
      price: 'all',
      when: 'any',
      activityDatePreset: 'anyday',
      buddiesSegment: filters.buddiesSegment,
      hasTrip: false,
      facilityKinds: [],
    };
  const scoped =
      cat === 'venues' || cat === 'activities'
        ? scopeBrowseListStateForListCat(emptyBase, cat)
        : emptyBase;
    syncUrl({ ...scoped, listCat: cat, regions: [] });
    setDraftQuery('');
  };

  const handleActivityDatePresetChange = useCallback(
    (preset: ExploreActivityDatePreset) => syncUrl({ activityDatePreset: preset }),
    [syncUrl]
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
    return exploreMapPathFromListSearch(search);
  }, [onCloseMapOverlay, search]);

  const desktopMd = useMinWidthMd();
  const wideListMapSplit = useMinWidthPx(LIST_DISCOVERY_MAP_AUTO_MIN_PX);
  const [listMapColumnOpen, setListMapColumnOpen] = useState(readListMapColumnOpen);
  const [listMapDismissed, setListMapDismissed] = useState(readListMapDismissed);
  const [listMapHighlightedId, setListMapHighlightedId] = useState<string | null>(null);
  const [listMapSelectedId, setListMapSelectedId] = useState<string | null>(null);
  const listMapSplitEnabled = !embeddedOnExplore && !isPeopleCategory;
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

  const handleListMapSelectItem = useCallback((item: ExploreMapItemDTO) => {
    setListMapSelectedId(item.id);
    setListMapHighlightedId(item.id);
  }, []);

  const sideMapWidth = useListSideMapWidth(showListMapColumn);

  return (
    <>
      {isPeopleCategory ? (
        embeddedOnExplore ? (
          <PeopleBrowsePanel
            embedded
            isDesktop={surface === 'exploreSidebar'}
            query={draftQuery}
            onQueryChange={setDraftQuery}
            onQuerySync={commitQuery}
            onClose={() => syncUrl({ listCat: null, categories: [] })}
            peopleBrowseTab={filters.buddiesSegment === 'hub' ? 'looking' : filters.buddiesSegment}
            onPeopleBrowseTabChange={(tab) => syncUrl({ buddiesSegment: tab })}
            memberPeopleNetwork={[]}
            memberPeopleLoading={false}
            memberPeopleError={null}
            onRefreshMemberPeople={() => {}}
            discoveryFriendsGoing={memberRoster.friendsGoing}
            discoveryHostsGoing={memberRoster.hostsGoing}
            discoverySeekingOnMap={memberRoster.seekingOnMap}
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
            seekingActivities={seekingActivities}
            exploreCatalogItems={items}
            exploreCatalogLoading={isLoading}
            onOpenSeekingActivity={handleOpenSeekingActivity}
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
            peopleBrowseTab={filters.buddiesSegment}
            onPeopleBrowseTabChange={(tab) => syncUrl({ buddiesSegment: tab, crewsOpen: null })}
            crewsOpenLens={crewsOpenLens}
            onCrewsOpenLensChange={(lens) => syncUrl({ crewsOpen: lens })}
            availabilitySheetOpen={availabilitySheetOpen}
            onAvailabilitySheetOpenChange={(open) => syncUrl({ availabilitySheet: open })}
            isSignedIn={Boolean(user)}
            filterCount={filterCount}
            statCounts={crewsStatCounts}
            seekingActivities={seekingActivities}
            exploreCatalogItems={items}
            exploreCatalogLoading={isLoading}
            onOpenSeekingActivity={handleOpenSeekingActivity}
            availabilityPeople={memberAvailability.people}
            availabilityLoading={memberAvailability.loading}
            availabilityError={memberAvailability.error}
            discoveryFriendsGoing={memberRoster.friendsGoing}
            discoveryHostsGoing={memberRoster.hostsGoing}
            discoveryDirectory={memberRoster.directory}
            discoveryQuota={memberRoster.quota}
            discoveryLoading={memberRoster.loading}
            discoveryError={memberRoster.error}
            exploreAreaSlug={areaSlug}
          />
        )
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
              const cat = listCatForListExplorerBucket(next);
              syncUrl({
                query: draftQuery,
                listCat: cat,
                ...scopeBrowseListStateForListCat(filters, cat),
                regions: venueRegions,
                ...(next === 'places' && layout === 'calendar' ? { layout: 'thumbnails' as const } : {}),
              });
            }}
            hideBucketToggleOnMobile={!embeddedOnExplore}
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
            onTripTopicsChange={(next) => syncUrl({ tripTopics: next, tripLookingOnly: false })}
            onPlaceTopicsChange={(next) => syncUrl({ placeTopics: next })}
            onPriceChange={(next) => syncUrl({ price: next })}
            onHasTripChange={(next) => syncUrl({ hasTrip: next })}
            onFacilityKindsChange={(next) => syncUrl({ facilityKinds: next })}
            onVenueFiltersChange={(next) => syncUrl({ placeTopics: next.placeTopics, facilityKinds: next.facilityKinds })}
            onActivityDatePresetChange={handleActivityDatePresetChange}
            onVenueRegionsChange={handleVenueRegionsChange}
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

      {embeddedOnExplore || overlayImmersive ? null : (
        <>
          {!isPeopleCategory ? <BrowseListMapFab mapHref={mapHref} /> : null}
          <BrowseListCreateFab onClick={handleCreateFabTap} label={createFabLabel} />
        </>
      )}
    </>
  );
};
