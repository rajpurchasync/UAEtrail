import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { ActivityDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { resolveActivityDisplayCoordinates } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { describeExploreMapLoadError } from '../../utils/exploreMapErrors';
import { PageMeta } from '../../components/seo/PageMeta';
import type { PlaceMapPin } from '../../components/ui/PlacesMap';
import { useAuth } from '../../context/AuthContext';
import { useOrganisationGate } from '../../hooks/useOrganisationGate';
import { useExploreMap, reloadExploreMap } from '../../hooks/useExploreMap';
import { useActivityJoinActions, useActivityJoinContext } from '../../hooks/useActivityJoinFlow';
import {
  clearExploreComposeParams,
  isAddWizard,
  isComposeMenu,
  isFindWizard,
  isOrganizeWizard,
  parseExploreCompose,
  setExploreComposeParam,
  type ExploreCompose,
} from '../compose';
import type { ContributeSubmitResult } from './contributeFlow';
import type { DemandSubmitResult } from './demandFlow';
import { ExploreComposeHost } from './ExploreComposeHost';
import { ExploreJoinOverlays } from './ExploreJoinOverlays';
import { ExploreBrowsePanel } from './ExploreBrowsePanel';
import { ExploreMapStage } from './ExploreMapStage';
import {
  EXPLORE_MAP_STYLE_STORAGE_KEY,
  getExploreMapTiles,
  MAP_CONFIG,
  readExploreMapStyle,
  type ExploreMapStyle,
} from '../../config/platform';
import { buildExploreCardModel } from '../exploreCardModel';
import { messagesRouteForRole } from '../../utils/authRouting';
import { buildSignInRedirect, signInPathForReturn } from '../../utils/authReturnContext';
import { activityHostUserId } from '../../utils/hostLabels';
import { useActivityFormSession } from '../../context/ActivityFormSessionContext';
import { useExploreDeviceLocation } from '../../hooks/useExploreDeviceLocation';
import { useMinWidthLg } from '../../hooks/useMinWidthLg';
import { shouldShowExploreLocationPrompt } from '../../utils/exploreMapLocationPreference';
import { useExploreBrowseList } from './useExploreBrowseList';
import { useExploreBrowseUrlState } from './useExploreBrowseUrlState';
import { useExploreFulfillIntent } from './useExploreFulfillIntent';
import { explorePath } from '../routing';

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

  const [recenterTo, setRecenterTo] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const mapCenteredRef = useRef(false);
  const {
    deviceFix,
    pending: locatingDevice,
    enableDeviceLocation,
    dismissLocationPrompt,
    requestDeviceLocation,
  } = useExploreDeviceLocation();

  const exploreCompose = useMemo(() => parseExploreCompose(searchParams), [searchParams]);

  const composeMenuOpen = isComposeMenu(exploreCompose);
  const organizeRoute = isOrganizeWizard(exploreCompose) ? exploreCompose : null;
  const findRoute = isFindWizard(exploreCompose) ? exploreCompose : null;
  const addRoute = isAddWizard(exploreCompose) ? exploreCompose : null;

  const setComposeRoute = useCallback(
    (route: ExploreCompose | null) => {
      const params = new URLSearchParams(searchParams);
      if (!route) {
        clearExploreComposeParams(params);
      } else {
        setExploreComposeParam(params, route);
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const closeCompose = useCallback(() => {
    setComposeRoute(null);
  }, [setComposeRoute]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const {
    fulfillIntentPrefill,
    setFulfillIntentPrefill,
    canFulfillParticipantIntent,
    handleFulfillIntent,
  } = useExploreFulfillIntent({
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

  const organizeWizardOpen = Boolean(organizeRoute) || Boolean(fulfillIntentPrefill);
  const findWizardOpen = Boolean(findRoute);
  const addWizardOpen = Boolean(addRoute);
  const [demandNotice, setDemandNotice] = useState<string | null>(null);
  const [venueNotice, setVenueNotice] = useState<string | null>(null);
  const [exploreMapStyle, setExploreMapStyle] = useState<ExploreMapStyle>(() => readExploreMapStyle());

  const exploreMapTiles = useMemo(() => getExploreMapTiles(exploreMapStyle), [exploreMapStyle]);

  const toggleExploreMapStyle = useCallback(() => {
    setExploreMapStyle((current) => {
      const next: ExploreMapStyle = current === 'satellite' ? 'map' : 'satellite';
      try {
        window.localStorage.setItem(EXPLORE_MAP_STYLE_STORAGE_KEY, next);
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const hasLegacy =
      searchParams.has('request') ||
      searchParams.has('contribute') ||
      searchParams.get('addLocation') === '1';
    if (!hasLegacy) return;
    const parsed = parseExploreCompose(searchParams);
    if (!parsed) return;
    const params = new URLSearchParams(searchParams);
    setExploreComposeParam(params, parsed);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (searchParams.get('compose') !== '1') return;
    if (!user) {
      navigate(signInPathForReturn(explorePath({ compose: 'menu' })));
      return;
    }
    setSelectedId(null);
    setComposeRoute({ surface: 'menu' });
  }, [searchParams, user, navigate, setComposeRoute]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const { mapPins, listItems, shopListSections, browseFilterHint } = useExploreBrowseList({
    items,
    mapFilter: browse.mapFilter,
    activityFilter: browse.activityFilter,
    venueFilter: browse.venueFilter,
    venueRegions: browse.venueRegions,
    query: browse.query,
    sidebarPanel: browse.sidebarPanel,
    isDesktop,
    desktopBrowseTab: browse.desktopBrowseTab,
  });

  const selectedCard = useMemo(() => {
    if (!selected) return null;
    const card = buildExploreCardModel(selected);
    const activity = selected.activity;
    const hostUserId = activity ? activityHostUserId(activity) : null;
    const isOwnActivity = Boolean(
      user &&
        activity &&
        (hostUserId === user.id || (tenantId && activity.tenantId === tenantId))
    );
    if (!isOwnActivity) return card;
    return {
      ...card,
      showJoinActions: false,
      showHostActions: true,
    };
  }, [selected, user, tenantId]);

  const joinContextEnabled = Boolean(selected?.activity?.id && !selectedCard?.showHostActions && user);
  const {
    context: joinContext,
    uiState: joinUiState,
    loading: joinStateLoading,
    reload: reloadJoinContext,
  } = useActivityJoinContext({
    activityId: selected?.activity?.id,
    enabled: joinContextEnabled,
    userId: user?.id,
  });

  const joinActions = useActivityJoinActions({
    activity: selected?.activity ?? null,
    uiState: joinUiState,
    requestIdFallback: joinContext?.myRequest?.id ?? null,
    onReload: reloadJoinContext,
    onMessage: setDemandNotice,
    onError: setDemandNotice,
  });

  const { href: signInHref } = buildSignInRedirect({ pathname, search });
  const reloadMap = () => {
    void reloadExploreMap(queryClient);
  };

  const openItem = useCallback((item: ExploreMapItemDTO) => {
    closeCompose();
    setFulfillIntentPrefill(null);
    setSelectedId(item.id);
    if (!isDesktop) {
      browse.setListOpen(false);
    }
  }, [closeCompose, isDesktop, browse, setFulfillIntentPrefill]);

  const handleFocusMapLocation = useCallback((coords: { lat: number; lng: number }) => {
    setRecenterTo(null);
    window.requestAnimationFrame(() => {
      setRecenterTo(coords);
    });
  }, []);

  const exploreMapCenter = useMemo(() => {
    if (deviceFix) return deviceFix;
    return MAP_CONFIG.exploreDefaultCenter;
  }, [deviceFix]);

  useEffect(() => {
    if (mapCenteredRef.current) return;
    mapCenteredRef.current = true;
    handleFocusMapLocation(exploreMapCenter);
  }, [exploreMapCenter, handleFocusMapLocation]);

  useEffect(() => {
    const navState = locationState as { showExploreLocationPrompt?: boolean } | null;
    if (user && navState?.showExploreLocationPrompt && shouldShowExploreLocationPrompt()) {
      setLocationPromptOpen(true);
      navigate({ pathname, search }, { replace: true, state: null });
    }
  }, [user, locationState, navigate, pathname, search]);

  const handleAllowMapLocation = () => {
    void enableDeviceLocation().then((fix) => {
      setLocationPromptOpen(false);
      if (fix) handleFocusMapLocation(fix);
    });
  };

  const handleLocateMe = () => {
    void requestDeviceLocation().then((fix) => {
      if (fix) handleFocusMapLocation(fix);
    });
  };

  const handleActivityPublished = useCallback(
    async (activity: ActivityDTO) => {
      if (fulfillIntentPrefill) {
        setDemandNotice('Activity published and linked to the community request.');
        setFulfillIntentPrefill(null);
      }

      if (activity.joinMode === 'private') {
        await reloadExploreMap(queryClient);
        setVenueNotice(
          'Activity published privately — share the link with your group. It will not appear on the public map.'
        );
        return;
      }

      browse.setMapFilter('all');
      browse.setActivityFilter('all');
      browse.syncExploreUrl({ filter: 'all', activityFilter: 'all', panel: 'activities' });

      await reloadExploreMap(queryClient);

      const { latitude, longitude } = resolveActivityDisplayCoordinates(activity);
      if (latitude != null && longitude != null) {
        handleFocusMapLocation({ lat: latitude, lng: longitude });
        setSelectedId(`activity:${activity.id}`);
      }

      setVenueNotice('Activity published — it is now on the map.');
    },
    [queryClient, browse, handleFocusMapLocation, fulfillIntentPrefill, setFulfillIntentPrefill]
  );

  const handleMapPinClick = useCallback(
    (pin: PlaceMapPin) => {
      const itemId = pin.exploreItemId ?? pin.id;
      const item = items.find((entry) => entry.id === itemId);
      if (item) openItem(item);
    },
    [items, openItem]
  );

  const handleCreateTap = () => {
    setSelectedId(null);
    if (!user) {
      navigate(signInPathForReturn(explorePath({ compose: 'menu' })));
      return;
    }
    if (hostGateLoading) return;
    setComposeRoute({ surface: 'menu' });
  };

  const primaryFabLabel = 'Add New';

  const handleComposeRouteChange = (route: ExploreCompose | null) => {
    if (route && isOrganizeWizard(route)) {
      if (!user) {
        navigate(signInPathForReturn(explorePath({ compose: route })));
        return;
      }
      if (hostGateLoading) return;
      if (!canPublish) {
        navigate('/become-host');
        return;
      }
    }
    if (route && (isFindWizard(route) || isAddWizard(route)) && !user) {
      navigate(signInPathForReturn(explorePath({ compose: route })));
      return;
    }
    setComposeRoute(route);
  };

  const respondToDemand = (item: ExploreMapItemDTO) => {
    const requesterId = item.requesterUserId;
    if (!requesterId) return;
    if (!user) {
      navigate(signInHref);
      return;
    }
    navigate(messagesRouteForRole(user.role ?? 'participant', requesterId));
    setSelectedId(null);
  };

  const handleJoin = () => {
    if (selected?.source === 'demand') {
      respondToDemand(selected);
      return;
    }
    if (!selected?.activity) return;
    if (!user) {
      joinActions.openGuestSheet();
      return;
    }
    if (joinUiState.kind !== 'open') return;
    joinActions.openJoinModal();
  };

  const closeCreateFlow = () => {
    closeCompose();
    setFulfillIntentPrefill(null);
  };

  const handleDemandMessage = () => {
    if (selected) respondToDemand(selected);
  };

  const handleHostMessage = async () => {
    const activity = selected?.activity;
    if (!activity) return;
    try {
      const res = await api.getActivityGroupChat(activity.id);
      setSelectedId(null);
      navigate(`/groups?group=${encodeURIComponent(res.data.groupId)}`);
    } catch (err) {
      setDemandNotice(err instanceof Error ? err.message : 'Could not open activity chat.');
    }
  };

  const handleHostManage = () => {
    const activity = selected?.activity;
    if (!activity) return;
    setSelectedId(null);

    if (activity.status === 'published' && tenantId) {
      navigate(`/host/activities?checkin=${encodeURIComponent(activity.id)}`);
      return;
    }

    if (tenantId) {
      openEdit(activity, { tenantId });
      return;
    }

    navigate(`/activities?tab=hosted&checkin=${encodeURIComponent(activity.id)}`);
  };

  const handleDemandSubmitted = useCallback(
    (result: DemandSubmitResult) => {
      void reloadExploreMap(queryClient);
      if (!result.visibleOnMap) {
        setDemandNotice(
          'Request posted. Add a map pin next time to show on Explore — nearby hosts can still message you.'
        );
      } else {
        setDemandNotice(
          'Request posted on the map. Nearby hosts and guides can message you or propose a matching activity.'
        );
      }
    },
    [queryClient]
  );

  const handleContributeSubmitted = useCallback((result: ContributeSubmitResult) => {
    void reloadExploreMap(queryClient);
    if (result.kind === 'shop') {
      setVenueNotice('Shop submitted for review. We\'ll notify you once it\'s on the map.');
    } else {
      setVenueNotice(
        `"${result.location.name}" submitted for admin review. You'll see it on the map once published.`
      );
    }
  }, [queryClient]);

  const browsePanel = (
    <ExploreBrowsePanel
      isDesktop={isDesktop}
      loading={loading}
      listItems={listItems}
      shopListSections={shopListSections}
      desktopBrowseTab={browse.desktopBrowseTab}
      mapFilter={browse.mapFilter}
      searchExpanded={browse.searchExpanded}
      onSearchExpandedChange={browse.setSearchExpanded}
      onDesktopBrowseTabChange={browse.applyDesktopBrowseTab}
      panel={browse.panel}
      sidebarPanel={browse.sidebarPanel}
      activityFilter={browse.activityFilter}
      venueFilter={browse.venueFilter}
      browseFilterHint={browseFilterHint}
      onPanelChange={browse.applyPanel}
      onActivityFilterChange={browse.applyActivityFilter}
      onVenueFilterChange={browse.applyVenueFilter}
      query={browse.query}
      onQueryChange={browse.setQuery}
      onQuerySync={() => browse.syncExploreUrl({ q: browse.query })}
      onClearQuery={() => {
        browse.setQuery('');
        browse.syncExploreUrl({ q: '' });
      }}
      onClose={browse.closeListPanel}
      onOpenItem={openItem}
      onFocusMapLocation={handleFocusMapLocation}
    />
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <PageMeta
        title="Explore hiking, camping, events & shops"
        description="Find live hiking, camping, events, and shops on the map across the UAE."
        path="/explore"
      />

      <div className="relative flex min-h-0 flex-1 lg:flex-row">
        {browse.showListPanel && isDesktop && (
          <aside className="hidden lg:flex lg:min-h-0 lg:w-[min(400px,32vw)] lg:shrink-0 lg:flex-col lg:border-r lg:border-neutral-200 lg:bg-white lg:px-5 lg:py-4 lg:transition-[width] lg:duration-300">
            {browsePanel}
          </aside>
        )}

        <ExploreMapStage
          isDesktop={isDesktop}
          listOpen={browse.listOpen}
          showListPanel={browse.showListPanel}
          mapFilter={browse.mapFilter}
          desktopFilterKeys={browse.desktopFilterKeys}
          onMapFilterChange={browse.applyMapFilter}
          exploreMapStyle={exploreMapStyle}
          exploreMapTiles={exploreMapTiles}
          onToggleMapStyle={toggleExploreMapStyle}
          mapPins={mapPins}
          selectedId={selectedId}
          recenterTo={recenterTo}
          exploreMapCenter={exploreMapCenter}
          onPinClick={handleMapPinClick}
          loading={loading}
          loadError={loadError}
          onReloadMap={reloadMap}
          venueNotice={venueNotice}
          onDismissVenueNotice={() => setVenueNotice(null)}
          demandNotice={demandNotice}
          onDismissDemandNotice={() => setDemandNotice(null)}
          user={user}
          locationPromptOpen={locationPromptOpen}
          locatingDevice={locatingDevice}
          onAllowMapLocation={handleAllowMapLocation}
          onDismissLocationPrompt={() => {
            dismissLocationPrompt();
            setLocationPromptOpen(false);
          }}
          onOpenBrowse={browse.openBrowse}
          onLocateMe={handleLocateMe}
          onPrimaryFab={handleCreateTap}
          primaryFabLabel={primaryFabLabel}
          selected={selected}
          selectedCard={selectedCard}
          joinUiState={selectedCard?.showHostActions ? undefined : joinUiState}
          joinStateLoading={joinStateLoading}
          canFulfillParticipantIntent={canFulfillParticipantIntent}
          onCloseSelection={() => setSelectedId(null)}
          onJoin={handleJoin}
          onMessage={selectedCard?.showHostActions ? handleHostMessage : handleDemandMessage}
          onFulfillIntent={handleFulfillIntent}
          onManage={selectedCard?.showHostActions ? handleHostManage : undefined}
          onWithdraw={() => joinActions.setShowWithdraw(true)}
          onFocusMapLocation={handleFocusMapLocation}
          onCloseMobileBrowse={browse.closeListPanel}
          mobileBrowseSheet={browsePanel}
        />
      </div>

      <ExploreComposeHost
        exploreCompose={exploreCompose}
        composeMenuOpen={composeMenuOpen}
        organizeWizardOpen={organizeWizardOpen}
        findWizardOpen={findWizardOpen}
        addWizardOpen={addWizardOpen}
        organizeKind={organizeRoute?.kind ?? null}
        findKind={findRoute?.kind}
        addKind={addRoute?.kind ?? null}
        fulfillIntentPrefill={fulfillIntentPrefill}
        signInHref={signInHref}
        onComposeRouteChange={handleComposeRouteChange}
        onCloseCompose={closeCompose}
        onCloseCreateFlow={closeCreateFlow}
        onOrganizeBackToIntent={() => {
          setFulfillIntentPrefill(null);
          setComposeRoute({ surface: 'menu', intent: 'organize' });
        }}
        onFindBackToIntent={() => setComposeRoute({ surface: 'menu', intent: 'find' })}
        onAddBackToIntent={() => setComposeRoute({ surface: 'menu', intent: 'add' })}
        onActivityPublished={handleActivityPublished}
        onOpenHostApplication={() => {
          closeCreateFlow();
          navigate('/become-host');
        }}
        onContributeSubmitted={handleContributeSubmitted}
        onDemandSubmitted={handleDemandSubmitted}
      />

      <ExploreJoinOverlays activity={selected?.activity} joinActions={joinActions} />

    </div>
  );
};
