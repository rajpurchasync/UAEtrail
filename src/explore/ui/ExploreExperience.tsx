import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ExploreBrowsePanel } from './ExploreBrowsePanel';
import { ExploreMapStage } from './ExploreMapStage';
import { useExploreBrowseList } from './useExploreBrowseList';
import { resolveExploreItemScheduleDate } from './exploreMapPinModel';
import { useExploreBrowseUrlState } from './useExploreBrowseUrlState';
import { useExploreComposeRoute } from './useExploreComposeRoute';
import { useExploreFulfillIntent } from './useExploreFulfillIntent';
import { useExploreMapViewport } from './useExploreMapViewport';
import { useExploreSelectionActions } from './useExploreSelectionActions';

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

  const selection = useExploreSelectionActions({
    items,
    selectedId,
    setSelectedId,
    user,
    tenantId,
    navigate,
    signInHref: buildSignInRedirect({ pathname, search }).href,
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

  const organizeWizardOpen = Boolean(compose.organizeRoute) || Boolean(fulfill.fulfillIntentPrefill);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const { mapPins, listItems, shopListSections } = useExploreBrowseList({
    items,
    mapFilter: browse.mapFilter,
    activityFilter: browse.activityFilter,
    venueFilter: browse.venueFilter,
    venueRegions: browse.venueRegions,
    query: browse.query,
    activityDate: browse.activityDate,
    sidebarPanel: browse.sidebarPanel,
    isDesktop,
    desktopBrowseTab: browse.desktopBrowseTab,
  });

  const scheduledDates = useMemo(() => {
    const dates = new Set<string>();
    for (const item of items) {
      const iso = resolveExploreItemScheduleDate(item);
      if (iso) dates.add(iso);
    }
    return [...dates].sort();
  }, [items]);

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
  };

  const browsePanel = (
    <ExploreBrowsePanel
      isDesktop={isDesktop}
      loading={loading}
      listItems={listItems}
      shopListSections={shopListSections}
      desktopBrowseTab={browse.desktopBrowseTab}
      mapFilter={browse.mapFilter}
      browseFilterKeys={browse.browseFilterKeys}
      placesMode={browse.placesMode}
      onMapFilterChange={browse.applyMapFilter}
      activityDate={browse.activityDate}
      onActivityDateChange={browse.applyActivityDate}
      scheduledDates={scheduledDates}
      venueRegions={browse.venueRegions}
      onVenueRegionsChange={browse.applyVenueRegions}
      onDesktopBrowseTabChange={browse.applyDesktopBrowseTab}
      panel={browse.panel}
      sidebarPanel={browse.sidebarPanel}
      onPanelChange={browse.applyPanel}
      query={browse.query}
      onQueryChange={browse.setQuery}
      onQuerySync={() => browse.syncExploreUrl({ q: browse.query })}
      onClearQuery={() => {
        browse.setQuery('');
        browse.syncExploreUrl({ q: '' });
      }}
      onClose={browse.closeListPanel}
      onOpenItem={selection.openItem}
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
            {browsePanel}
          </aside>
        )}

        <ExploreMapStage
          isDesktop={isDesktop}
          listOpen={browse.listOpen}
          showListPanel={browse.showListPanel}
          mapFilter={browse.mapFilter}
          browseFilterKeys={browse.browseFilterKeys}
          placesMode={browse.placesMode}
          onMapFilterChange={browse.applyMapFilter}
          activityDate={browse.activityDate}
          onActivityDateChange={browse.applyActivityDate}
          scheduledDates={scheduledDates}
          venueRegions={browse.venueRegions}
          onVenueRegionsChange={browse.applyVenueRegions}
          exploreMapStyle={viewport.exploreMapStyle}
          exploreMapTiles={exploreMapTiles}
          onToggleMapStyle={viewport.toggleExploreMapStyle}
          mapPins={mapPins}
          selectedId={selectedId}
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
          onLocateMe={viewport.handleLocateMe}
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
          mobileBrowseSheet={browsePanel}
        />
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
        fulfillIntentPrefill={fulfill.fulfillIntentPrefill}
        signInHref={buildSignInRedirect({ pathname, search }).href}
        onComposeRouteChange={compose.handleComposeRouteChange}
        onCloseCompose={compose.closeCompose}
        onCloseCreateFlow={closeCreateFlow}
        onOrganizeBackToIntent={() => {
          fulfill.setFulfillIntentPrefill(null);
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
    </div>
  );
};
