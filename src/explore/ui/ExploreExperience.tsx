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
import { createDraftFromDemand, type CreateActivityDraft } from './organizeFlow';
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
import { mapFilterToPanel, parseListOpen, readInitialListOpen } from './exploreListPanelUrl';
import { useExploreBrowseList } from './useExploreBrowseList';
import {
  MAP_FILTERS_BY_BROWSE_TAB,
  parseDesktopBrowseTab,
  type DesktopBrowseTab,
} from './exploreBrowsePanelCopy';
import {
  parseMapFilter,
  parseExplorePanel,
  parseActivityListFilter,
  parseVenueRegionsParam,
  mapFilterToActivityListFilter,
  mapFilterToVenueListFilter,
  activityFilterToMapFilter,
  venueFilterToMapFilter,
  explorePath,
  parseFulfillIntentMapItemId,
  clearFulfillIntentMapItemParams,
  exploreFulfillIntentReturnPath,
  type ActivityListFilterKey,
  type ExplorePanel,
  type MapFilterKey,
  type VenueListFilterKey,
} from '../routing';
import { MAP_FILTER_PILLS } from '../../config/exploreMapFilters';

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

  const [mapFilter, setMapFilter] = useState<MapFilterKey>(() => parseMapFilter(searchParams.get('filter')));
  const [activityFilter, setActivityFilter] = useState<ActivityListFilterKey>(() =>
    parseActivityListFilter(searchParams.get('activity'))
  );
  const [panel, setPanel] = useState<ExplorePanel>(() => parseExplorePanel(searchParams.get('panel')));
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const [listOpen, setListOpen] = useState(() => readInitialListOpen(searchParams.get('list')));
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

  const [fulfillIntentPrefill, setFulfillIntentPrefill] = useState<{
    draft: CreateActivityDraft;
    participantIntentId: string;
  } | null>(null);
  const organizeWizardOpen = Boolean(organizeRoute) || Boolean(fulfillIntentPrefill);
  const findWizardOpen = Boolean(findRoute);
  const addWizardOpen = Boolean(addRoute);
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [demandNotice, setDemandNotice] = useState<string | null>(null);
  const [venueFilter, setVenueFilter] = useState<VenueListFilterKey>('all');
  const [venueRegions, setVenueRegions] = useState<string[]>(() => parseVenueRegionsParam(searchParams));
  const [venueNotice, setVenueNotice] = useState<string | null>(null);
  const [desktopBrowseTab, setDesktopBrowseTab] = useState<DesktopBrowseTab>(() =>
    parseDesktopBrowseTab(parseExplorePanel(searchParams.get('panel')))
  );
  const [searchExpanded, setSearchExpanded] = useState(() => Boolean(searchParams.get('q')?.trim()));
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

  const syncExploreUrl = useCallback(
    (next: {
      filter?: MapFilterKey;
      activityFilter?: ActivityListFilterKey;
      panel?: ExplorePanel;
      list?: boolean;
      q?: string;
      venueRegions?: string[];
    }) => {
      const params = new URLSearchParams(searchParams);
      const filterValue = next.filter ?? mapFilter;
      const activityFilterValue = next.activityFilter ?? activityFilter;
      const panelValue = next.panel ?? panel;
      const listValue = next.list ?? listOpen;
      const queryValue = next.q ?? query;
      const regionValue = next.venueRegions ?? venueRegions;

      if (filterValue === 'all') params.delete('filter');
      else params.set('filter', filterValue);

      if (activityFilterValue === 'all') params.delete('activity');
      else params.set('activity', activityFilterValue);

      if (panelValue === 'activities') params.delete('panel');
      else params.set('panel', panelValue);

      if (listValue) params.set('list', '1');
      else params.set('list', '0');

      if (queryValue.trim()) params.set('q', queryValue.trim());
      else params.delete('q');

      if (regionValue.length > 0) {
        params.set('regions', regionValue.join(','));
        params.delete('region');
      } else {
        params.delete('regions');
        params.delete('region');
      }

      params.delete('addLocation');
      params.delete('compose');
      params.delete('contribute');
      params.delete('request');
      clearFulfillIntentMapItemParams(params);

      setSearchParams(params, { replace: true });
    },
    [mapFilter, activityFilter, panel, listOpen, query, venueRegions, searchParams, setSearchParams]
  );

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
    const nextMapFilter = parseMapFilter(searchParams.get('filter'));
    const nextPanel = parseExplorePanel(searchParams.get('panel'));
    setMapFilter(nextMapFilter);
    setActivityFilter(parseActivityListFilter(searchParams.get('activity')));
    setVenueFilter(mapFilterToVenueListFilter(nextMapFilter));
    setPanel(nextPanel);
    setListOpen(parseListOpen(searchParams.get('list'), isDesktop));
    setQuery(searchParams.get('q') ?? '');
    setVenueRegions(parseVenueRegionsParam(searchParams));
    if (isDesktop) {
      setDesktopBrowseTab(parseDesktopBrowseTab(nextPanel));
      if (searchParams.get('q')?.trim()) setSearchExpanded(true);
    }
  }, [searchParams, isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;
    const listParam = searchParams.get('list');
    if (listParam === '0' || listParam === '1') return;
    syncExploreUrl({ list: true });
  }, [isDesktop, searchParams, syncExploreUrl]);

  const applyMapFilter = (next: MapFilterKey) => {
    setMapFilter(next);
    setSelectedId(null);
    const syncedActivity = mapFilterToActivityListFilter(next);
    const syncedVenue = mapFilterToVenueListFilter(next);
    const syncedPanel = isDesktop
      ? desktopBrowseTab === 'venues'
        ? 'venues'
        : 'activities'
      : mapFilterToPanel(next);
    setActivityFilter(syncedActivity);
    setVenueFilter(syncedVenue);
    setPanel(syncedPanel);
    syncExploreUrl({
      filter: next,
      panel: syncedPanel,
      activityFilter: syncedActivity,
      list: listOpen,
    });
  };

  const applyDesktopBrowseTab = (next: DesktopBrowseTab) => {
    setDesktopBrowseTab(next);
    setSelectedId(null);
    setMapFilter('all');
    setActivityFilter('all');
    setVenueFilter('all');
    const syncedPanel = next === 'venues' ? 'venues' : 'activities';
    setPanel(syncedPanel);
    syncExploreUrl({
      filter: 'all',
      activityFilter: 'all',
      panel: syncedPanel,
      list: listOpen,
    });
  };

  const applyActivityFilter = (next: ActivityListFilterKey) => {
    setActivityFilter(next);
    setSelectedId(null);
    const syncedMap = activityFilterToMapFilter(next);
    if (syncedMap && syncedMap !== mapFilter) {
      setMapFilter(syncedMap);
      setVenueFilter(mapFilterToVenueListFilter(syncedMap));
      setPanel('activities');
      syncExploreUrl({
        activityFilter: next,
        filter: syncedMap,
        panel: 'activities',
        list: listOpen,
      });
      return;
    }
    syncExploreUrl({ activityFilter: next, list: listOpen });
  };

  const applyPanel = (next: ExplorePanel) => {
    setPanel(next);
    setSelectedId(null);
    syncExploreUrl({ panel: next, list: true });
    setListOpen(true);
  };

  const openBrowse = () => {
    setSelectedId(null);
    setListOpen(true);
    syncExploreUrl({ list: true, panel });
  };

  const closeListPanel = () => {
    setListOpen(false);
    syncExploreUrl({ list: false });
  };

  const showListPanel = listOpen;
  const sidebarPanel: ExplorePanel = isDesktop
    ? panel === 'venues'
      ? 'venues'
      : mapFilterToPanel(mapFilter)
    : panel;

  const applyVenueFilter = (next: VenueListFilterKey) => {
    setVenueFilter(next);
    setSelectedId(null);
    const syncedMap = venueFilterToMapFilter(next);
    if (syncedMap && syncedMap !== mapFilter) {
      setMapFilter(syncedMap);
      setActivityFilter(mapFilterToActivityListFilter(syncedMap));
      setPanel(syncedMap === 'shops' ? 'shops' : 'venues');
      syncExploreUrl({
        filter: syncedMap,
        activityFilter: mapFilterToActivityListFilter(syncedMap),
        panel: syncedMap === 'shops' ? 'shops' : 'venues',
        list: listOpen,
      });
      return;
    }
    syncExploreUrl({ list: listOpen });
  };

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const contextualMapFilters = useMemo(() => {
    if (!isDesktop) return MAP_FILTER_PILLS;
    const allowed = MAP_FILTERS_BY_BROWSE_TAB[desktopBrowseTab];
    return MAP_FILTER_PILLS.filter((pill) => allowed.includes(pill.key));
  }, [isDesktop, desktopBrowseTab]);

  const desktopFilterKeys = useMemo(
    () => contextualMapFilters.map((pill) => pill.key),
    [contextualMapFilters]
  );

  const { mapPins, listItems, shopListSections, browseFilterHint } = useExploreBrowseList({
    items,
    mapFilter,
    activityFilter,
    venueFilter,
    venueRegions,
    query,
    sidebarPanel,
    isDesktop,
    desktopBrowseTab,
  });

  const selected = items.find((item) => item.id === selectedId) ?? null;
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
      setListOpen(false);
    }
  }, [closeCompose, isDesktop]);

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

      setMapFilter('all');
      setActivityFilter('all');
      syncExploreUrl({ filter: 'all', activityFilter: 'all', panel: 'activities' });

      await reloadExploreMap(queryClient);

      const { latitude, longitude } = resolveActivityDisplayCoordinates(activity);
      if (latitude != null && longitude != null) {
        handleFocusMapLocation({ lat: latitude, lng: longitude });
        setSelectedId(`activity:${activity.id}`);
      }

      setVenueNotice('Activity published — it is now on the map.');
    },
    [queryClient, syncExploreUrl, handleFocusMapLocation, fulfillIntentPrefill]
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

  const handlePrimaryFab = () => {
    handleCreateTap();
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

  const clearFulfillIntentParam = useCallback(() => {
    if (!parseFulfillIntentMapItemId(searchParams)) return;
    const params = new URLSearchParams(searchParams);
    clearFulfillIntentMapItemParams(params);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const openFulfillIntentFlow = useCallback((item: ExploreMapItemDTO) => {
    if (!item.participantIntentId) return;
    setFulfillIntentPrefill({
      draft: createDraftFromDemand(item),
      participantIntentId: item.participantIntentId,
    });
    setSelectedId(null);
  }, []);

  useEffect(() => {
    const intentMapItemId = parseFulfillIntentMapItemId(searchParams);
    if (!intentMapItemId || loading) return;

    const item = items.find((entry) => entry.id === intentMapItemId);
    if (!item || item.source !== 'demand' || !item.participantIntentId || item.convertedActivityId) {
      clearFulfillIntentParam();
      return;
    }

    setSelectedId(intentMapItemId);

    if (!user) return;
    if (item.requesterUserId === user.id) {
      clearFulfillIntentParam();
      return;
    }
    if (hostGateLoading) return;

    const returnPath = exploreFulfillIntentReturnPath(intentMapItemId, searchParams, pathname);

    if (!canPublish) {
      navigate(`/become-host?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }

    openFulfillIntentFlow(item);
    clearFulfillIntentParam();
  }, [
    searchParams,
    loading,
    items,
    user,
    hostGateLoading,
    canPublish,
    navigate,
    pathname,
    clearFulfillIntentParam,
    openFulfillIntentFlow,
  ]);

  const canFulfillParticipantIntent = Boolean(
    selected?.source === 'demand' &&
      selected.participantIntentId &&
      !selected.convertedActivityId &&
      selected.requesterUserId &&
      (!user || selected.requesterUserId !== user.id)
  );

  const handleFulfillIntent = () => {
    if (!selected?.participantIntentId) return;

    const returnPath = exploreFulfillIntentReturnPath(selected.id, searchParams, pathname);

    if (!user) {
      navigate(`/signup?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }
    if (hostGateLoading) return;
    if (!canPublish) {
      navigate(`/become-host?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }
    openFulfillIntentFlow(selected);
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
      desktopBrowseTab={desktopBrowseTab}
      mapFilter={mapFilter}
      searchExpanded={searchExpanded}
      onSearchExpandedChange={setSearchExpanded}
      onDesktopBrowseTabChange={applyDesktopBrowseTab}
      panel={panel}
      sidebarPanel={sidebarPanel}
      activityFilter={activityFilter}
      venueFilter={venueFilter}
      browseFilterHint={browseFilterHint}
      onPanelChange={applyPanel}
      onActivityFilterChange={applyActivityFilter}
      onVenueFilterChange={applyVenueFilter}
      query={query}
      onQueryChange={setQuery}
      onQuerySync={() => syncExploreUrl({ q: query })}
      onClearQuery={() => {
        setQuery('');
        syncExploreUrl({ q: '' });
      }}
      onClose={closeListPanel}
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
        {showListPanel && isDesktop && (
          <aside className="hidden lg:flex lg:min-h-0 lg:w-[min(400px,32vw)] lg:shrink-0 lg:flex-col lg:border-r lg:border-neutral-200 lg:bg-white lg:px-5 lg:py-4 lg:transition-[width] lg:duration-300">
            {browsePanel}
          </aside>
        )}

        <ExploreMapStage
          isDesktop={isDesktop}
          listOpen={listOpen}
          showListPanel={showListPanel}
          mapFilter={mapFilter}
          desktopFilterKeys={desktopFilterKeys}
          onMapFilterChange={applyMapFilter}
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
          onOpenBrowse={openBrowse}
          onLocateMe={handleLocateMe}
          onPrimaryFab={handlePrimaryFab}
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
          onCloseMobileBrowse={closeListPanel}
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
