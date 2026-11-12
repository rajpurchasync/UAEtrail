import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { LIST_DISCOVERY_PATH } from '../config/platform';
import { EXPLORE_MAP_PATH } from '../config/routingCatalog';
import { ComposeHost } from '../explore/create/ComposeHost';
import { GuestComposeSignInSheet } from '../explore/ui/GuestComposeSignInSheet';
import { useComposeRoute } from '../explore/create/hooks/useComposeRoute';
import { clearComposeWizardSessionForRoute } from '../explore/ui/composeWizardSession';
import { addVenueKindFromRoute, isSeekFixedWizard } from '../explore/compose';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { reloadExploreMap } from '../hooks/useExploreMap';
import { buildSignInRedirect } from '../utils/authReturnContext';
import {
  memberPublishGateHref,
  memberPublishGateInputFromMemberStatus,
} from '../utils/memberPublishGate';
import { browseListFilterPatchForSearchScope } from './listDiscoverySearchCommit';
import { countExploreSearchScopes } from '../explore/exploreSearchMatches';
import type { ExploreSearchScopeKey } from '../explore/exploreBrowseTaxonomy';
import { useBrowseListFeed } from './useBrowseListFeed';
import { useListDiscoveryUrlState } from './useListDiscoveryUrlState';
import { BrowseListCreateFab } from './ui/BrowseListCreateFab';
import { PeopleBrowsePanel } from '@/people-discovery/panel/PeopleBrowsePanel';
import { usePeopleDiscoverySeekingActivities } from '@/people-discovery/hooks/usePeopleDiscoverySeekingActivities';
import { useHostActivitySheetBundle } from '../hooks/useHostActivitySheetBundle';
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
import { ListExplorer } from './explorer/ListExplorer';
import { BrowsePanelCollapsedRail } from './explorer/BrowsePanelCollapsedRail';
import { browseAppliedFilterLabels } from './explorer/browseAppliedFilterLabels';
import { useExploreDesktopListDrawerChrome } from '../explore/ui/ExploreDesktopListDrawer';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const pathname = embeddedOnExplore ? EXPLORE_MAP_PATH : LIST_DISCOVERY_PATH;
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const {
    canPublish,
    profileComplete,
    isCommunityHost,
    hostTiers,
    loading: hostGateLoading,
    refresh: refreshHostGate,
    tenantId,
  } = useMemberStatus({ enabled: Boolean(user) });

  const hostSheets = useHostActivitySheetBundle({
    tenantId,
    onMapDataChanged: () => reloadExploreMap(queryClient),
  });
  const { hostManageSheet } = hostSheets;

  const navigateMemberPublishGate = useCallback(
    (returnPath: string) =>
      navigate(
        memberPublishGateHref(
          returnPath,
          memberPublishGateInputFromMemberStatus({
            viewerUserId: user?.id ?? null,
            profileComplete,
            canPublish,
            isCommunityHost,
            hostTiers,
          })
        )
      ),
    [navigate, user?.id, profileComplete, canPublish, isCommunityHost, hostTiers]
  );

  const compose = useComposeRoute({
    user,
    navigate,
    pathname,
    search,
    searchParams,
    setSearchParams,
    onOpenComposeMenu: () => {},
    canPublish,
    profileComplete,
    hostGateLoading,
  });

  const reloadFeed = useCallback(async () => {
    await reloadExploreMap(queryClient);
    void refreshHostGate();
  }, [queryClient, refreshHostGate]);

  const browseUrl = useListDiscoveryUrlState({ mapOverlay: embeddedOnExplore });
  const { filters, syncUrl, venueRegions, geoIds, listCat, layout, sort } = browseUrl;
  const isPeopleCategory = listCat === 'people';
  const explorerBucket = parseListExplorerBucket(listCat);
  const [draftQuery, setDraftQuery] = useState(filters.query);
  useEffect(() => {
    setDraftQuery(filters.query);
  }, [filters.query]);
  const areaSlug = parseExploreAreaSlug(searchParams);
  const peopleSegment = filters.buddiesSegment;
  const memberRoster = useMemberDiscoveryRoster({
    enabled:
      isPeopleCategory &&
      Boolean(user) &&
      (peopleSegment === 'looking' || peopleSegment === 'going' || peopleSegment === 'connect'),
    search: draftQuery,
    activityDatePreset: filters.activityDatePreset,
    omitDirectory: peopleSegment !== 'connect',
  });
  const memberAvailability = useExplorePeopleAvailability({
    enabled: isPeopleCategory && Boolean(user) && peopleSegment === 'available',
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
    geoIds,
    mapEnabled: !isPeopleCategory || peopleSegment === 'looking',
    catalogItems: embeddedOnExplore ? prefetchedCatalogItems : undefined,
  });

  const { seekingActivities } = usePeopleDiscoverySeekingActivities({
    enabled: isPeopleCategory && peopleSegment === 'looking',
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

  const filterCount = countListExplorerFilters(filters, venueRegions, explorerBucket, geoIds);

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
      syncUrl({ query: draftQuery, listCat: null, categories: [] });
      return;
    }
    if (scope === 'places' || scope === 'shops') {
      const patch = browseListFilterPatchForSearchScope(scope);
      syncUrl({
        query: draftQuery,
        listCat: 'venues',
        categories: [],
        tripTopics: [],
        tripLookingOnly: false,
        placeTopics: patch?.placeTopics ?? [],
      });
      return;
    }
    if (scope === 'agencies') {
      syncUrl({ query: draftQuery, listCat: 'agencies', categories: ['agencies'] });
      return;
    }
    syncUrl({ query: draftQuery, listCat: serializeListExplorerBucket(explorerBucket) });
  };

  const clearAllFilters = () => {
    syncUrl({
      query: '',
      categories: [],
      listCat: null,
      tripTopics: [],
      placeTopics: [],
      tripLookingOnly: false,
      price: 'all',
      when: 'any',
      activityDatePreset: 'anyday',
      regions: [],
      geoIds: [],
    });
    setDraftQuery('');
  };

  useEffect(() => {
    onImmersiveSubtitleChange?.(null);
  }, [onImmersiveSubtitleChange]);

  const mapHref = useMemo(() => {
    if (onCloseMapOverlay) return EXPLORE_MAP_PATH;
    return exploreMapPathFromListSearch(search);
  }, [onCloseMapOverlay, search]);

  const hostWizardOpen = Boolean(compose.hostComposeRoute) && Boolean(user);

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

  useBindExploreListMapHover(showListMapColumn ? setListMapHighlightedId : null);

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

  useEffect(() => {
    if (showListMapColumn) collapseDesktopSideNav();
  }, [showListMapColumn]);

  const handleListMapSelectItem = useCallback((item: ExploreMapItemDTO) => {
    setListMapSelectedId(item.id);
    setListMapHighlightedId(item.id);
  }, []);

  const sideMapWidth = useListSideMapWidth(showListMapColumn);
  const drawerChrome = useExploreDesktopListDrawerChrome();

  if (embeddedOnExplore && drawerChrome?.collapsed) {
    return (
      <BrowsePanelCollapsedRail
        labels={browseAppliedFilterLabels(filters, venueRegions, explorerBucket)}
        onExpand={drawerChrome.toggleCollapsed}
      />
    );
  }

  return (
    <>
      {isPeopleCategory ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PeopleBrowsePanel
          embedded
          isDesktop={surface === 'exploreSidebar'}
          query={draftQuery}
          onQueryChange={setDraftQuery}
          onQuerySync={commitQuery}
          onClose={() => syncUrl({ listCat: null, categories: [] })}
          peopleBrowseTab={filters.buddiesSegment}
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
        </div>
      ) : (
        <div
          ref={sideMapWidth.splitRef}
          className={`flex h-0 min-h-0 min-w-0 flex-1 flex-row overflow-hidden ${
            embeddedOnExplore ? 'w-full' : ''
          }`}
        >
          <ListExplorer
            cards={cards}
            loading={isLoading}
            error={isError}
            onRetry={() => void reloadMap()}
            onClose={
              embeddedOnExplore && drawerChrome ? drawerChrome.toggleCollapsed : onCloseMapOverlay
            }
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
            onBucketChange={(next) =>
              syncUrl({
                query: draftQuery,
                listCat: serializeListExplorerBucket(next),
                categories: [],
                ...(next === 'places' && layout === 'calendar' ? { layout: 'thumbnails' as const } : {}),
              })
            }
            filters={filters}
            regions={venueRegions}
            geoIds={geoIds}
            filterCount={filterCount}
            onApplyFilters={(state, regions, nextGeoIds) =>
              syncUrl({ ...state, regions, geoIds: nextGeoIds })
            }
            onClearFilters={clearAllFilters}
            mapColumnVisible={showListMapColumn}
            showMapColumnPrompt={showListMapColumnPrompt}
            onOpenMapColumn={openListMapColumn}
            onMapHover={showListMapColumn ? setListMapHighlightedId : undefined}
            sort={sort}
            onSortChange={(next) => syncUrl({ sort: next })}
            showGuestCatalogPreview={!user && !embeddedOnExplore && !isPeopleCategory}
            listPanelWidthPx={showListMapColumn ? sideMapWidth.listPanelWidth : undefined}
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
      )}

      {embeddedOnExplore || overlayImmersive ? null : <BrowseListCreateFab onClick={compose.handleCreateTap} />}

      {hostManageSheet}

      <ComposeHost
        composeRoute={compose.composeRoute}
        composeMenuOpen={compose.composeMenuOpen}
        hostWizardOpen={hostWizardOpen}
        seekFixedWizardOpen={
          Boolean(compose.seekFixedRoute && isSeekFixedWizard(compose.composeRoute)) && Boolean(user)
        }
        addWizardOpen={Boolean(compose.addRoute) && Boolean(user)}
        seekFlexibleOpen={compose.seekFlexibleOpen && Boolean(user)}
        hostComposeKind={compose.hostComposeRoute?.kind ?? null}
        seekFixedKind={compose.seekFixedRoute?.kind}
        addVenueKind={addVenueKindFromRoute(compose.addRoute)}
        hostingWizardPrefill={null}
        signInHref={buildSignInRedirect({ pathname, search }).href}
        onComposeRouteChange={compose.handleComposeRouteChange}
        onCloseCompose={compose.closeCompose}
        onCloseCreateFlow={compose.closeCompose}
        wizardEnteredFromMenu={compose.wizardEnteredFromMenu}
        onHostingBackToIntent={() => {
          clearComposeWizardSessionForRoute(compose.hostComposeRoute);
          compose.setComposeRoute({ surface: 'menu', intent: 'host' });
        }}
        onSeekingBackToIntent={() => {
          clearComposeWizardSessionForRoute(compose.seekFixedRoute);
          compose.setComposeRoute({ surface: 'menu', intent: 'seek' });
        }}
        onAddBackToIntent={() => {
          clearComposeWizardSessionForRoute(compose.addRoute);
          compose.setComposeRoute({ surface: 'menu', intent: 'add' });
        }}
        onActivityPublished={() => void reloadFeed()}
        onSeekingSubmitted={() => void reloadFeed()}
        onAddSubmitted={() => void reloadFeed()}
        onOpenHostApplication={() => {
          compose.closeCompose();
          navigateMemberPublishGate(`${pathname}${search}`);
        }}
      />

      <GuestComposeSignInSheet
        open={compose.guestComposeSignInOpen}
        onClose={compose.closeGuestComposeSignIn}
        authReturnPath={compose.guestComposeSignInReturnPath}
      />
    </>
  );
};
