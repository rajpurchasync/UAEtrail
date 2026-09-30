import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { PlaceMapPin } from '../../components/ui/PlacesMap';
import { describeExploreMapLoadError } from '../../utils/exploreMapErrors';
import { PageMeta } from '../../components/seo/PageMeta';
import { useAuth } from '../../context/AuthContext';
import { useOrganisationGate } from '../../hooks/useOrganisationGate';
import { useExploreMap, reloadExploreMap } from '../../hooks/useExploreMap';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { useActivityFormSession } from '../../context/ActivityFormSessionContext';
import { useMinWidthLg } from '../../hooks/useMinWidthLg';
import { getExploreMapTiles } from '../../config/platform';
import { ExploreComposeHost } from './ExploreComposeHost';
import { ExploreJoinOverlays } from './ExploreJoinOverlays';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreBrowsePanel } from './ExploreBrowsePanel';
import { ExploreMapStage } from './ExploreMapStage';
import { useExploreBrowseList } from './useExploreBrowseList';
import { useWhosGoingFriends } from './useWhosGoingFriends';
import { useExploreBrowseUrlState } from './useExploreBrowseUrlState';
import { useExploreComposeRoute } from './useExploreComposeRoute';
import { useExploreFulfillIntent } from './useExploreFulfillIntent';
import { useExploreOrganizeFromActivity } from './useExploreOrganizeFromActivity';
import type { OrganizeWizardPrefill } from './organizeWizardPrefill';
import { useExploreMapViewport } from './useExploreMapViewport';
import { useExploreSelectionActions } from './useExploreSelectionActions';
import { parseExplorePinMapItemId, parseOrganizeFromActivityId } from '../routing';
import type { ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';

export const ExploreExperience = () => {
  const { user } = useAuth();
  const { canPublish, loading: hostGateLoading, tenantId } = useOrganisationGate({
    enabled: Boolean(user),
  });
  const { openEdit } = useActivityFormSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { pathname, search, state: locationState } = useLocation();
  const isDesktop = useMinWidthLg();
  const { data: items = [], isLoading: loading, error: mapError } = useExploreMap();
  const loadError = mapError ? describeExploreMapLoadError(mapError) : null;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredListItemId, setHoveredListItemId] = useState<string | null>(null);
  const clearSelection = useCallback(() => setSelectedId(null), []);

  const browse = useExploreBrowseUrlState({
    isDesktop,
    searchParams,
    setSearchParams,
    clearSelection,
  });

  const viewport = useExploreMapViewport({
    user,
    locationState,
    pathname,
    search,
    navigate,
  });

  const compose = useExploreComposeRoute({
    user,
    navigate,
    searchParams,
    setSearchParams,
    onOpenComposeMenu: clearSelection,
    canPublish,
    hostGateLoading,
  });

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const fulfill = useExploreFulfillIntent({
    items,
    loading,
    user,
    hostGateLoading,
    canPublish,
    navigate,
    pathname,
    searchParams,
    setSearchParams,
    setSelectedId,
    selected,
  });

  const organizeFrom = useExploreOrganizeFromActivity({
    user,
    tenantId,
    hostGateLoading,
    canPublish,
    navigate,
    pathname,
    searchParams,
    setSearchParams,
    setComposeRoute: compose.setComposeRoute,
    organizeKind: compose.organizeRoute?.kind ?? null,
  });

  const organizeWizardPrefill = useMemo((): OrganizeWizardPrefill | null => {
    if (fulfill.fulfillIntentPrefill) {
      return {
        draft: fulfill.fulfillIntentPrefill.draft,
        participantIntentId: fulfill.fulfillIntentPrefill.participantIntentId,
      };
    }
    if (organizeFrom.organizeFromPrefill) {
      return {
        draft: organizeFrom.organizeFromPrefill.draft,
        sourceActivityId: organizeFrom.organizeFromPrefill.sourceActivityId,
      };
    }
    return null;
  }, [fulfill.fulfillIntentPrefill, organizeFrom.organizeFromPrefill]);

  const selection = useExploreSelectionActions({
    items,
    selectedId,
    setSelectedId,
    user,
    tenantId,
    navigate,
    queryClient,
    browse,
    isDesktop,
    closeCompose: compose.closeCompose,
    clearFulfillPrefill: () => fulfill.setFulfillIntentPrefill(null),
    fulfillIntentPrefill: fulfill.fulfillIntentPrefill,
    clearFulfillAfterPublish: () => fulfill.setFulfillIntentPrefill(null),
    openEdit,
    handleFocusMapLocation: viewport.handleFocusMapLocation,
  });

  const organizeFromPending = Boolean(parseOrganizeFromActivityId(searchParams));
  const organizeWizardOpen =
    Boolean(organizeWizardPrefill) ||
    (Boolean(compose.organizeRoute) && !organizeFromPending);

  const deepLinkPinId = parseExplorePinMapItemId(searchParams);
  const openedDeepLinkPinRef = useRef<string | null>(null);

  useEffect(() => {
    if (!deepLinkPinId || loading) return;
    if (openedDeepLinkPinRef.current === deepLinkPinId) return;
    const item = items.find((entry) => entry.id === deepLinkPinId);
    if (!item) return;
    openedDeepLinkPinRef.current = deepLinkPinId;
    selection.openItem(item);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('pin');
        return next;
      },
      { replace: true }
    );
  }, [deepLinkPinId, loading, items, selection.openItem, setSearchParams]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const whosGoingFriends = useWhosGoingFriends({
    enabled: Boolean(user) && browse.listMode === 'whosGoing',
    userId: user?.id,
    mapItems: items,
    activityDatePreset: browse.activityDatePreset,
  });

  const {
    mapPins,
    listItems,
    shopListSections,
    whosGoingPreview,
    searchScopeCounts,
    whosGoingTripsCount,
    whosGoingListItems,
  } =
    useExploreBrowseList({
      items,
      mapFilter: browse.mapFilter,
      venueRegions: browse.venueRegions,
      query: browse.query,
      activityDatePreset: browse.activityDatePreset,
      topicPills: browse.topicPills,
      listMode: browse.listMode,
      whosGoingSegment: browse.whosGoingSegment,
      searchScope: browse.searchScope,
      friendIds: user ? whosGoingFriends.friendIds : undefined,
      sidebarPanel: browse.sidebarPanel,
      isDesktop,
      desktopBrowseTab: browse.desktopBrowseTab,
      buddySubtype: browse.buddySubtype,
      outingTopic: browse.outingTopic,
    });

  const whosGoingFriendRowsFiltered = useMemo(() => {
    const q = browse.query.trim().toLowerCase();
    if (!q) return whosGoingFriends.friendRows;
    return whosGoingFriends.friendRows.filter((row) => {
      const name = row.buddy.displayName.toLowerCase();
      const hosting = row.hosting?.title.toLowerCase() ?? '';
      const joining = row.joining?.title.toLowerCase() ?? '';
      return name.includes(q) || hosting.includes(q) || joining.includes(q);
    });
  }, [whosGoingFriends.friendRows, browse.query]);

  const exploreMapTiles = useMemo(
    () => getExploreMapTiles(viewport.exploreMapStyle),
    [viewport.exploreMapStyle]
  );

  const reloadMap = () => {
    void reloadExploreMap(queryClient);
  };

  const handleMapPinClick = useCallback(
    (pin: PlaceMapPin) => {
      const stack = pin.stackExploreItemIds;
      const itemId =
        (stack?.find((id) => id === selectedId) ?? stack?.[0]) ?? pin.exploreItemId ?? pin.id;
      const item = items.find((entry) => entry.id === itemId);
      if (item) selection.openItem(item);
    },
    [items, selectedId, selection]
  );

  const closeCreateFlow = () => {
    compose.closeCompose();
    fulfill.setFulfillIntentPrefill(null);
    organizeFrom.clearOrganizeFromPrefill();
  };

  const [searchFocusNonce, setSearchFocusNonce] = useState(0);
  const handleMapSearchCommit = (scope?: ExploreSearchScopeKey | null) => {
    browse.commitMapSearch(scope);
    setSearchFocusNonce((n) => n + 1);
  };

  const browsePanelShared = {
    isDesktop,
    loading,
    shopListSections,
    desktopBrowseTab: browse.desktopBrowseTab,
    mapFilter: browse.mapFilter,
    browseFilterKeys: browse.browseFilterKeys,
    placesMode: browse.placesMode,
    onMapFilterChange: browse.applyMapFilter,
    activityDatePreset: browse.activityDatePreset,
    onActivityDatePresetChange: browse.applyActivityDatePreset,
    venueRegions: browse.venueRegions,
    onVenueRegionsChange: browse.applyVenueRegions,
    onDesktopBrowseTabChange: browse.applyDesktopBrowseTab,
    panel: browse.panel,
    sidebarPanel: browse.sidebarPanel,
    onPanelChange: browse.applyPanel,
    buddySubtype: browse.buddySubtype,
    onBuddySubtypeChange: browse.applyBuddySubtype,
    outingTopic: browse.outingTopic,
    onOutingTopicChange: browse.applyOutingTopic,
    query: browse.query,
    onQueryChange: browse.setQuery,
    onQuerySync: () => browse.syncExploreUrl({ q: browse.query }),
    onClearQuery: () => {
      browse.setQuery('');
      browse.syncExploreUrl({ q: '' });
    },
    onOpenItem: selection.openItem,
    searchScopeCounts,
    onSearchScopePick: handleMapSearchCommit,
    searchFocusNonce,
    whosGoingSegment: browse.whosGoingSegment,
    onWhosGoingSegmentChange: browse.applyWhosGoingSegment,
    whosGoingTripsCount,
    whosGoingPeopleCount: whosGoingFriends.friendsOnTrips.length,
    whosGoingFriendRows: whosGoingFriendRowsFiltered,
    whosGoingFriendsLoading: whosGoingFriends.loading,
    whosGoingFriendsError: whosGoingFriends.error,
    isSignedIn: Boolean(user),
    userRole: user?.role,
    friendUserIds: user ? whosGoingFriends.friendIds : undefined,
  };

  const desktopBrowsePanel = (
    <ExploreBrowsePanel
      {...browsePanelShared}
      listItems={listItems}
      onClose={browse.closeListPanel}
      listMode="default"
      onListItemHover={(id) => setHoveredListItemId(id)}
      onListItemHoverEnd={() => setHoveredListItemId(null)}
    />
  );

  const desktopWhosGoingPanel = (
    <ExploreBrowsePanel
      {...browsePanelShared}
      listItems={whosGoingListItems}
      onClose={browse.closeWhosGoingPanel}
      closePanelAriaLabel="Close Who's going panel"
      closeButtonVariant="dismiss"
      listMode="whosGoing"
    />
  );

  const mobileBrowsePanel = (
    <ExploreBrowsePanel
      {...browsePanelShared}
      listItems={
        browse.listMode === 'whosGoing' && browse.whosGoingSegment === 'trips'
          ? whosGoingListItems
          : listItems
      }
      onClose={browse.closeListPanel}
      listMode={browse.listMode}
    />
  );

  const primaryFabLabel = 'Add New';

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <PageMeta
        title="Explore hiking, camping, events & shops"
        description="Find live hiking, camping, events, and shops on the map across the UAE."
        path="/explore"
      />

      <div className="relative flex min-h-0 flex-1 lg:flex-row">
        {browse.showListPanel && isDesktop && (
          <aside className="hidden lg:flex lg:min-h-0 lg:w-[min(400px,32vw)] lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-r lg:border-neutral-200 lg:bg-white lg:px-5 lg:py-4 lg:transition-[width] lg:duration-300">
            {desktopBrowsePanel}
          </aside>
        )}

        <ExploreMapStage
          isDesktop={isDesktop}
          listOpen={browse.listOpen}
          showListPanel={browse.showListPanel}
          topicPills={browse.topicPills}
          onTopicPillToggle={browse.toggleMapTopicPill}
          onWhosGoing={browse.openWhosGoingList}
          whosGoingAvatars={whosGoingPreview.avatars}
          whosGoingExtraCount={whosGoingPreview.extraCount}
          whosGoingTotalJoining={whosGoingPreview.totalJoining}
          searchQuery={browse.query}
          onSearchQueryChange={browse.setQuery}
          onSearchCommit={handleMapSearchCommit}
          searchScopeCounts={searchScopeCounts}
          exploreMapStyle={viewport.exploreMapStyle}
          exploreMapTiles={exploreMapTiles}
          onToggleMapStyle={viewport.toggleExploreMapStyle}
          mapPins={mapPins}
          selectedId={selectedId}
          highlightedExploreItemId={isDesktop ? hoveredListItemId : null}
          recenterTo={viewport.recenterTo}
          exploreMapCenter={viewport.exploreMapCenter}
          onPinClick={handleMapPinClick}
          loading={loading}
          loadError={loadError}
          onReloadMap={reloadMap}
          venueNotice={selection.venueNotice}
          onDismissVenueNotice={() => selection.setVenueNotice(null)}
          demandNotice={selection.demandNotice}
          onDismissDemandNotice={() => selection.setDemandNotice(null)}
          user={user}
          locationPromptOpen={viewport.locationPromptOpen}
          locatingDevice={viewport.locatingDevice}
          onAllowMapLocation={viewport.handleAllowMapLocation}
          onDismissLocationPrompt={viewport.dismissLocationPromptUi}
          onOpenBrowse={browse.openBrowse}
          onPrimaryFab={compose.handleCreateTap}
          primaryFabLabel={primaryFabLabel}
          selected={selection.selected}
          selectedCard={selection.selectedCard}
          joinUiState={selection.selectedCard?.showHostActions ? undefined : selection.joinUiState}
          joinStateLoading={selection.joinStateLoading}
          canFulfillParticipantIntent={fulfill.canFulfillParticipantIntent}
          onCloseSelection={selection.handleCloseSelection}
          onJoin={selection.handleJoin}
          onMessage={
            selection.selectedCard?.showHostActions
              ? selection.handleHostMessage
              : selection.handleDemandMessage
          }
          onFulfillIntent={fulfill.handleFulfillIntent}
          onManage={selection.selectedCard?.showHostActions ? selection.handleHostManage : undefined}
          showCarpoolLink={selection.showCarpoolLinkOnPeek}
          onLinkCarpool={selection.handleLinkCarpool}
          carpoolLinkLoading={selection.carpoolLinkLoading}
          onWithdraw={() => selection.joinActions.setShowWithdraw(true)}
          onCloseMobileBrowse={browse.closeListPanel}
          mobileBrowseSheet={mobileBrowsePanel}
          onGuestGatedAction={selection.handleGuestGatedAction}
        />

        {isDesktop && browse.listMode === 'whosGoing' ? (
          <aside
            className="hidden lg:flex lg:min-h-0 lg:w-[min(400px,32vw)] lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-l lg:border-neutral-200 lg:bg-white lg:px-5 lg:py-4 lg:transition-[width] lg:duration-300"
          >
            {desktopWhosGoingPanel}
          </aside>
        ) : null}
      </div>

      <ExploreComposeHost
        exploreCompose={compose.exploreCompose}
        composeMenuOpen={compose.composeMenuOpen}
        organizeWizardOpen={organizeWizardOpen}
        findWizardOpen={Boolean(compose.findRoute)}
        addWizardOpen={Boolean(compose.addRoute)}
        organizeKind={compose.organizeRoute?.kind ?? null}
        findKind={compose.findRoute?.kind}
        addKind={compose.addRoute?.kind ?? null}
        fulfillIntentPrefill={organizeWizardPrefill}
        signInHref={buildSignInRedirect({ pathname, search }).href}
        onComposeRouteChange={compose.handleComposeRouteChange}
        onCloseCompose={compose.closeCompose}
        onCloseCreateFlow={closeCreateFlow}
        onOrganizeBackToIntent={() => {
          fulfill.setFulfillIntentPrefill(null);
          organizeFrom.clearOrganizeFromPrefill();
          compose.setComposeRoute({ surface: 'menu', intent: 'organize' });
        }}
        onFindBackToIntent={() => compose.setComposeRoute({ surface: 'menu', intent: 'find' })}
        onAddBackToIntent={() => compose.setComposeRoute({ surface: 'menu', intent: 'add' })}
        onActivityPublished={selection.handleActivityPublished}
        onOpenHostApplication={() => {
          closeCreateFlow();
          navigate('/become-host');
        }}
        onContributeSubmitted={selection.handleContributeSubmitted}
        onDemandSubmitted={selection.handleDemandSubmitted}
      />

      <ExploreJoinOverlays activity={selection.selected?.activity} joinActions={selection.joinActions} />

      <ExploreResponsiveSheet
        open={compose.guestComposeSignInOpen}
        onClose={compose.closeGuestComposeSignIn}
        maxWidthClass="max-w-md"
        zClass={EXPLORE_Z.guestJoinSheet}
        overlayFixed
        layout="centered"
        showCloseButton
        showHandle={false}
        ariaLabel="Sign in to continue"
      >
        <div className="px-4 pb-5 pt-8 sm:px-6 sm:pb-6">
          <ExploreGuestSignInCard intent="peek-details" compact />
          <button
            type="button"
            onClick={compose.closeGuestComposeSignIn}
            className="mt-2 block w-full py-2 text-center text-sm font-medium text-neutral-400"
          >
            Keep browsing
          </button>
        </div>
      </ExploreResponsiveSheet>
    </div>
  );
};
