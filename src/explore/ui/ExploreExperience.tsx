import { lazy, Suspense, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { List, LocateFixed, Plus, X } from 'lucide-react';
import type { ActivityDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { resolveActivityDisplayCoordinates } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { describeExploreMapLoadError } from '../../utils/exploreMapErrors';
import { PageMeta } from '../../components/seo/PageMeta';
import type { PlaceMapPin, MapPinKind } from '../../components/ui/PlacesMap';
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
import { getMapBounds } from '../../config/regions';
import {
  EXPLORE_MAP_STYLE_STORAGE_KEY,
  getExploreMapTiles,
  MAP_CONFIG,
  readExploreMapStyle,
  type ExploreMapStyle,
} from '../../config/platform';
import {
  EXPLORE_FLOATING_CONTROL,
  EXPLORE_MOBILE_MAP_CHROME,
  EXPLORE_SHEET,
  EXPLORE_Z,
} from '../../config/exploreTheme';
import { buildExploreCardModel } from '../exploreCardModel';
import { resolveExploreItemSource } from '../exploreCopy';
import { messagesRouteForRole } from '../../utils/authRouting';
import { buildSignInRedirect, signInPathForReturn } from '../../utils/authReturnContext';
import { activityHostUserId } from '../../utils/hostLabels';
import { useActivityFormSession } from '../../context/ActivityFormSessionContext';
import { ExploreGuestJoinBanner } from './ExploreGuestJoinBanner';
import { ExploreCoachMarks } from './ExploreCoachMarks';
import { ExploreMapFilterBar } from './ExploreMapFilterBar';
import { ExploreMapLocationPrompt } from './ExploreMapLocationPrompt';
import { useExploreDeviceLocation } from '../../hooks/useExploreDeviceLocation';
import { shouldShowExploreLocationPrompt } from '../../utils/exploreMapLocationPreference';
import { ExploreMapLoadingSkeleton } from './ExploreMapLoadingSkeleton';
import { ExploreItemSheet } from './ExploreItemSheet';
import { ExplorePlaceMapPreview } from './ExplorePlaceMapPreview';
import { ExploreMapStyleToggle } from './ExploreMapStyleToggle';
import { ExploreBrowsePanel } from './ExploreBrowsePanel';
import {
  ACTIVITY_LIST_FILTERS,
  MAP_FILTERS_BY_BROWSE_TAB,
  parseDesktopBrowseTab,
  type DesktopBrowseTab,
  VENUE_LIST_FILTERS,
} from './exploreBrowsePanelCopy';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
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
import { sortExploreActivities, sortExploreVenues } from '../../utils/exploreListSort';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';
import { MAP_FILTER_PILLS, mapFilterLabel } from '../../config/exploreMapFilters';

const PlacesMap = lazy(() =>
  import('../../components/ui/PlacesMap').then((m) => ({ default: m.PlacesMap }))
);

/** `list=1` open, `list=0` closed; desktop defaults to list open. */
const parseListOpen = (listParam: string | null, isDesktop: boolean): boolean => {
  if (listParam === '1') return true;
  if (listParam === '0') return false;
  return isDesktop;
};

const readInitialListOpen = (listParam: string | null): boolean => {
  const isDesktop =
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false;
  return parseListOpen(listParam, isDesktop);
};

const mapFilterToPanel = (filter: MapFilterKey): ExplorePanel => {
  if (filter === 'shops') return 'shops';
  return 'activities';
};

const useMinWidthLg = (): boolean => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return matches;
};

const matchesVenueFilter = (item: ExploreMapItemDTO, venueFilter: VenueListFilterKey): boolean => {
  if (venueFilter === 'all') return true;
  if (venueFilter === 'shop') return item.kind === 'shop';
  if (venueFilter === 'hiking') return item.kind === 'hiking';
  if (venueFilter === 'camping') return item.kind === 'camping';
  if (venueFilter === 'event') return item.kind === 'event' && item.source === 'venue';
  return true;
};

const isShopListItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'shop' && item.kind === 'shop' && !item.id.startsWith('product:');

const isPhysicalShopItem = (item: ExploreMapItemDTO): boolean =>
  isShopListItem(item) && item.shopPresence !== 'online' && item.latitude != null && item.longitude != null;

const isOnlineShopItem = (item: ExploreMapItemDTO): boolean =>
  isShopListItem(item) && (item.shopPresence === 'online' || item.latitude == null || item.longitude == null);

/** @deprecated Use isShopListItem */
const isShopMapItem = isShopListItem;

const isMapPin = (item: ExploreMapItemDTO): boolean => {
  if (item.latitude == null || item.longitude == null) return false;
  if (!isShopMapItem(item) && item.source === 'shop' && item.id.startsWith('product:')) return false;
  return true;
};

const matchesMapFilter = (item: ExploreMapItemDTO, mapFilter: MapFilterKey): boolean => {
  if (mapFilter === 'all') return true;
  if (mapFilter === 'shops') return isShopMapItem(item) || item.kind === 'shop';

  const kind = item.kind;

  if (mapFilter === 'hiking') {
    return kind === 'hiking' && (item.source === 'activity' || item.source === 'demand' || item.source === 'venue');
  }
  if (mapFilter === 'camping') {
    return kind === 'camping' && (item.source === 'activity' || item.source === 'demand' || item.source === 'venue');
  }
  if (mapFilter === 'carpool') {
    return kind === 'carpool' && (item.source === 'activity' || item.source === 'demand');
  }
  if (mapFilter === 'others') {
    return kind === 'event' && (item.source === 'activity' || item.source === 'demand' || item.source === 'venue');
  }

  return false;
};

const matchesActivityFilter = (item: ExploreMapItemDTO, activityFilter: ActivityListFilterKey): boolean => {
  if (item.source !== 'activity' && item.source !== 'demand') return false;
  if (activityFilter === 'all') return true;
  if (activityFilter === 'carpool') return item.kind === 'carpool';
  if (item.kind === 'carpool') return false;
  return item.kind === activityFilter;
};

const mapPinKind = (item: ExploreMapItemDTO): MapPinKind => {
  if (item.source === 'demand') return item.kind === 'carpool' ? 'carpool' : (item.kind as MapPinKind);
  if (item.kind === 'shop') return 'shop';
  if (item.kind === 'carpool') return 'carpool';
  return item.kind as MapPinKind;
};

const expandMapPins = (items: ExploreMapItemDTO[]): PlaceMapPin[] => {
  const pins: PlaceMapPin[] = [];

  for (const item of items.filter(isMapPin)) {
    const hasDistinctTo =
      item.toLatitude != null &&
      item.toLongitude != null &&
      (Math.abs(item.toLatitude - item.latitude!) > 0.00001 ||
        Math.abs(item.toLongitude - item.longitude!) > 0.00001);

    pins.push({
      id: item.id,
      exploreItemId: item.id,
      name: item.title,
      latitude: item.latitude as number,
      longitude: item.longitude as number,
      activityType: mapPinKind(item),
      path: item.path,
      hostAvatar: item.hostAvatar,
      source: resolveExploreItemSource(item),
      carpoolEndpoint: hasDistinctTo ? 'from' : undefined,
    });

    if (hasDistinctTo) {
      pins.push({
        id: `${item.id}:to`,
        exploreItemId: item.id,
        name: item.title,
        latitude: item.toLatitude as number,
        longitude: item.toLongitude as number,
        activityType: 'carpool',
        path: item.path,
        hostAvatar: item.hostAvatar,
        source: resolveExploreItemSource(item),
        carpoolEndpoint: 'to',
      });
    }
  }

  return pins.sort((a, b) => pinLayerOrder(a.source) - pinLayerOrder(b.source));
};

const pinLayerOrder = (source?: ExploreMapItemDTO['source']): number => {
  if (source === 'venue') return 0;
  if (source === 'shop') return 1;
  return 2;
};

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

  const filtered = useMemo(() => {
    let result = items.filter((item) => matchesMapFilter(item, mapFilter));
    if (isDesktop) {
      if (desktopBrowseTab === 'activities') {
        result = result.filter((item) => item.source === 'activity' || item.source === 'demand');
      } else if (desktopBrowseTab === 'venues') {
        result = result.filter((item) => item.source === 'venue' || isShopMapItem(item));
      }
    }
    return result;
  }, [items, mapFilter, isDesktop, desktopBrowseTab]);

  const mapPins = useMemo((): PlaceMapPin[] => expandMapPins(filtered), [filtered]);

  const listItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (item: ExploreMapItemDTO) => {
      if (!q) return true;
      return `${item.title} ${item.subtitle ?? ''} ${item.featuredPerson?.displayName ?? item.hostName ?? ''}`.toLowerCase().includes(q);
    };

    if (isDesktop) {
      if (desktopBrowseTab === 'activities') {
        return sortExploreActivities(
          items
            .filter((item) => item.source === 'activity' || item.source === 'demand')
            .filter((item) => matchesMapFilter(item, mapFilter))
            .filter(matchesQuery)
        );
      }
      return sortExploreVenues(
        items
          .filter((item) => item.source === 'venue' || isShopMapItem(item))
          .filter((item) => matchesMapFilter(item, mapFilter))
          .filter((item) => venueItemMatchesRegions(item, venueRegions))
          .filter(matchesQuery)
      );
    }

    if (sidebarPanel === 'venues') {
      return sortExploreVenues(
        items
          .filter((item) => item.source === 'venue')
          .filter((item) => matchesVenueFilter(item, venueFilter))
          .filter((item) => venueItemMatchesRegions(item, venueRegions))
          .filter(matchesQuery)
      );
    }

    if (sidebarPanel === 'shops') {
      return sortExploreVenues(items.filter(isShopListItem).filter(matchesQuery));
    }

    return sortExploreActivities(
      items
        .filter((item) => item.source === 'activity' || item.source === 'demand')
        .filter((item) => matchesActivityFilter(item, activityFilter))
        .filter(matchesQuery)
    );
  }, [items, activityFilter, venueFilter, venueRegions, query, sidebarPanel, isDesktop, desktopBrowseTab, mapFilter]);

  const shopListSections = useMemo(() => {
    const showShopsPanel =
      sidebarPanel === 'shops' || (isDesktop && (mapFilter === 'shops' || desktopBrowseTab === 'venues' && listItems.some(isShopListItem)));
    if (!showShopsPanel || !listItems.some(isShopListItem)) return null;
    const physical = sortExploreVenues(listItems.filter(isPhysicalShopItem));
    const online = sortExploreVenues(listItems.filter(isOnlineShopItem));
    return { physical, online };
  }, [listItems, sidebarPanel, isDesktop, desktopBrowseTab, mapFilter]);

  const browseFilterHint = useMemo(() => {
    const parts: string[] = [];
    if (mapFilter !== 'all') {
      parts.push(`Map: ${mapFilterLabel(mapFilter)}`);
    }
    if (sidebarPanel === 'activities' && activityFilter !== 'all') {
      const listLabel = ACTIVITY_LIST_FILTERS.find((option) => option.key === activityFilter)?.label ?? 'All';
      parts.push(`List: ${listLabel}`);
    }
    if (sidebarPanel === 'venues' && venueFilter !== 'all') {
      const listLabel = VENUE_LIST_FILTERS.find((option) => option.key === venueFilter)?.label ?? 'All';
      parts.push(`List: ${listLabel}`);
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [mapFilter, sidebarPanel, activityFilter, venueFilter]);

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

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0 z-0">
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-[#eef2f6]" />}>
              <PlacesMap
                key={exploreMapStyle}
                pins={mapPins}
                bounds={getMapBounds()}
                fill
                allowEmpty
                exploreMode
                showLegend={false}
                selectedExploreItemId={selectedId ?? undefined}
                tileUrl={exploreMapTiles.tileUrl}
                tileAttribution={MAP_CONFIG.exploreTileAttribution}
                labelTileUrl={exploreMapTiles.labelTileUrl}
                onPinClick={handleMapPinClick}
                recenterTo={recenterTo}
                exploreMapCenter={exploreMapCenter}
                className="h-full w-full"
                minHeight={0}
              />
            </Suspense>
          </div>

          <ExploreGuestJoinBanner />
          {!listOpen && !isDesktop ? <ExploreCoachMarks /> : null}

          {(!listOpen || isDesktop) && (
            <ExploreMapFilterBar
              mapFilter={mapFilter}
              onFilterChange={applyMapFilter}
              allowedKeys={isDesktop ? desktopFilterKeys : undefined}
            />
          )}

          {user && !listOpen ? (
            <ExploreMapLocationPrompt
              open={locationPromptOpen}
              loading={locatingDevice}
              onAllow={handleAllowMapLocation}
              onDismiss={() => {
                dismissLocationPrompt();
                setLocationPromptOpen(false);
              }}
            />
          ) : null}

      {venueNotice && (
        <div className={`absolute left-4 right-4 top-3 z-[1100] rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow lg:top-4 ${EXPLORE_MOBILE_MAP_CHROME.noticeTop}`}>
          <div className="flex items-start justify-between gap-3">
            <p>{venueNotice}</p>
            <button
              type="button"
              onClick={() => setVenueNotice(null)}
              className="shrink-0 text-emerald-700"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {demandNotice && (
        <div className={`absolute left-4 right-4 top-3 z-[1100] rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow lg:top-4 ${EXPLORE_MOBILE_MAP_CHROME.noticeTop}`}>
          <div className="flex items-start justify-between gap-3">
            <p>{demandNotice}</p>
            <button
              type="button"
              onClick={() => setDemandNotice(null)}
              className="shrink-0 text-emerald-700"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute left-4 right-4 top-32 z-[1100] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-medium text-amber-900 shadow">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => reloadMap()}
            className="mt-2 rounded-lg bg-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-950 hover:bg-amber-200"
          >
            Retry map
          </button>
        </div>
      )}

      {loading ? <ExploreMapLoadingSkeleton /> : null}

      {!listOpen && isDesktop ? (
        <button
          type="button"
          onClick={openBrowse}
          className={`${EXPLORE_FLOATING_CONTROL} pointer-events-auto absolute left-0 top-1/2 z-[1100] hidden -translate-y-1/2 rounded-l-none border-l-0 px-2.5 py-3 lg:inline-flex`}
          aria-label="Show activities list"
        >
          <List className="h-4 w-4" aria-hidden />
        </button>
      ) : null}

      {!listOpen ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--explore-float-base)+0.75rem)] z-[1100] flex items-end justify-between gap-3 px-4 lg:hidden">
          <button
            type="button"
            onClick={openBrowse}
            className={`${EXPLORE_FLOATING_CONTROL} pointer-events-auto inline-flex gap-2 px-4 py-2.5 text-sm font-semibold text-gray-900`}
          >
            <List className="h-4 w-4" aria-hidden />
            List
          </button>
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locatingDevice}
              className={`${EXPLORE_FLOATING_CONTROL} inline-flex h-11 w-11 items-center justify-center text-emerald-700 disabled:opacity-60`}
              aria-label="Center map on my location"
            >
              <LocateFixed className="h-5 w-5" strokeWidth={2.25} />
            </button>
            <ExploreMapStyleToggle style={exploreMapStyle} onToggle={toggleExploreMapStyle} />
            <button
              type="button"
              onClick={handlePrimaryFab}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_4px_20px_rgba(5,150,105,.45)] hover:bg-emerald-700 active:scale-[0.98]"
              aria-label={primaryFabLabel}
            >
              <Plus className="h-6 w-6 shrink-0" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-6 right-4 z-[1100] hidden lg:flex lg:flex-col lg:items-center lg:gap-3">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locatingDevice}
          className={`${EXPLORE_FLOATING_CONTROL} pointer-events-auto inline-flex h-11 w-11 items-center justify-center text-emerald-700 disabled:opacity-60`}
          aria-label="Center map on my location"
        >
          <LocateFixed className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <ExploreMapStyleToggle style={exploreMapStyle} onToggle={toggleExploreMapStyle} />
        <button
          type="button"
          onClick={handlePrimaryFab}
          className="pointer-events-auto inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-base font-bold text-white shadow-[0_4px_20px_rgba(5,150,105,.45)] hover:bg-emerald-700 active:scale-[0.98]"
          aria-label={primaryFabLabel}
        >
          <Plus className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
          {primaryFabLabel}
        </button>
      </div>

      {selectedCard && selected?.source === 'venue' && selected ? (
        <ExplorePlaceMapPreview
          item={selected}
          onClose={() => setSelectedId(null)}
          onFocusMapLocation={handleFocusMapLocation}
        />
      ) : selectedCard ? (
        <ExploreItemSheet
          card={selectedCard}
          onClose={() => setSelectedId(null)}
          onJoin={handleJoin}
          onMessage={selectedCard.showHostActions ? handleHostMessage : handleDemandMessage}
          onFulfillIntent={canFulfillParticipantIntent ? handleFulfillIntent : undefined}
          onManage={selectedCard.showHostActions ? handleHostManage : undefined}
          joinUiState={selectedCard.showHostActions ? undefined : joinUiState}
          onWithdraw={() => joinActions.setShowWithdraw(true)}
          joinStateLoading={joinStateLoading}
          onFocusMapLocation={handleFocusMapLocation}
        />
      ) : null}

        </div>

        {showListPanel && !isDesktop && (
          <>
            <ExploreResponsiveSheet
              open
              onClose={closeListPanel}
              zClass={EXPLORE_Z.browseSheet}
              maxWidthClass="lg:max-w-lg"
              showHandle={false}
              panelClassName={`${EXPLORE_SHEET.browseHeight} px-4 pt-2 lg:px-5 lg:pt-3`}
            >
              {browsePanel}
            </ExploreResponsiveSheet>
          </>
        )}
      </div>
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
