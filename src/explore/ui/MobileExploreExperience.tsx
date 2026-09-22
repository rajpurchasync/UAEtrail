import { lazy, Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  List,
  PanelLeftClose,
  Plus,
  Search,
  X,
} from 'lucide-react';
import type { ActivityDTO, ExploreMapItemDTO, MyActivityRequestDTO, ActivityParticipationDTO, WithdrawReason } from '@uaetrail/shared-types';
import { resolveActivityDisplayCoordinates } from '@uaetrail/shared-types';
import { api } from '../../api/services';
import { describeExploreMapLoadError } from '../../utils/exploreMapErrors';
import { PageMeta } from '../../components/seo/PageMeta';
import { JoinRequestModal } from '../../components/ui/JoinRequestModal';
import { WithdrawRequestModal } from '../../components/ui/WithdrawRequestModal';
import type { PlaceMapPin, MapPinKind } from '../../components/ui/PlacesMap';
import { useAuth } from '../../context/AuthContext';
import { useOrganisationGate } from '../../hooks/useOrganisationGate';
import { useExploreMap, reloadExploreMap } from '../../hooks/useExploreMap';
import { MobileCreateActivityFlow } from './MobileCreateActivityFlow';
import { MobileCreateDemandFlow } from './MobileCreateDemandFlow';
import { MobileCreateIntentSheet, type ComposeIntentChoice } from './MobileCreateIntentSheet';
import { MobileCreateContributeFlow } from './MobileCreateContributeFlow';
import type { ContributeSubmitResult } from './mobileContributeFlow';
import { MobileContributeTypeSheet, type ContributeVenueKind } from './MobileContributeTypeSheet';
import { createDraftFromDemand, type MobileCreateDraft } from './mobileCreateFlow';
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
  EXPLORE_LIST_FILTER_INACTIVE,
  EXPLORE_MOBILE_MAP_CHROME,
  EXPLORE_SHEET,
  EXPLORE_Z,
  exploreActivityListFilterActiveClass,
  exploreVenueListFilterActiveClass,
} from '../../config/exploreTheme';
import { buildExploreCardModel } from '../exploreCardModel';
import { resolveExploreItemSource } from '../exploreCopy';
import { messagesRouteForRole } from '../../utils/authRouting';
import { buildSignInRedirect, signInPathForReturn } from '../../utils/authReturnContext';
import { activityHostUserId } from '../../utils/hostLabels';
import { resolveJoinRequestUiState, withdrawModalVariant, type JoinRequestUiState } from '../../utils/joinRequestUi';
import { useActivityFormSession } from '../../context/ActivityFormSessionContext';
import { ExploreGuestJoinBanner } from './ExploreGuestJoinBanner';
import { ExploreGuestJoinSheet } from './ExploreGuestJoinSheet';
import { ExploreCoachMarks } from './ExploreCoachMarks';
import { ExploreMapFilterBar } from './ExploreMapFilterBar';
import { ExploreMapLoadingSkeleton } from './ExploreMapLoadingSkeleton';
import { ExploreListSkeleton } from './ExploreListSkeleton';
import { ExploreItemSheet } from './ExploreItemSheet';
import { ExplorePlaceMapPreview } from './ExplorePlaceMapPreview';
import { MobileExploreHeader } from './MobileExploreHeader';
import { ExploreListRow } from './ExploreListRow';
import { ExploreFilterIcon } from './ExploreFilterIcon';
import { ExploreMapStyleToggle } from './ExploreMapStyleToggle';
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
  parseContributeParam,
  explorePath,
  parseFulfillIntentMapItemId,
  clearFulfillIntentMapItemParams,
  exploreFulfillIntentReturnPath,
  type ActivityListFilterKey,
  type ExplorePanel,
  type MapFilterKey,
  type VenueListFilterKey,
} from '../../utils/exploreRouting';
import { sortExploreActivities, sortExploreVenues } from '../../utils/exploreListSort';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';
import { MAP_FILTER_PILLS, mapFilterLabel } from '../../config/exploreMapFilters';

const PlacesMap = lazy(() =>
  import('../../components/ui/PlacesMap').then((m) => ({ default: m.PlacesMap }))
);

const ACTIVITY_LIST_FILTERS: Array<{ key: ActivityListFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'carpool', label: 'Rideshare' },
  { key: 'event', label: 'Events' },
];

const VENUE_LIST_FILTERS: Array<{ key: VenueListFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'event', label: 'Events' },
  { key: 'shop', label: 'Shop' },
];

const PANEL_TABS: Array<{ key: ExplorePanel; label: string }> = [
  { key: 'activities', label: 'Activities' },
  { key: 'venues', label: 'Venues' },
  { key: 'shops', label: 'Shops' },
];

type DesktopBrowseTab = 'activities' | 'venues';

const DESKTOP_BROWSE_TABS: Array<{ key: DesktopBrowseTab; label: string }> = [
  { key: 'activities', label: 'Activities' },
  { key: 'venues', label: 'Venues' },
];

const MAP_FILTERS_BY_BROWSE_TAB: Record<DesktopBrowseTab, MapFilterKey[]> = {
  activities: ['all', 'hiking', 'camping', 'carpool', 'others'],
  venues: ['all', 'hiking', 'camping', 'others', 'shops'],
};

const parseDesktopBrowseTab = (panel: ExplorePanel): DesktopBrowseTab =>
  panel === 'venues' ? 'venues' : 'activities';

/** `list=1` open, `list=0` closed; default closed (map first). */
const parseListOpen = (listParam: string | null): boolean => {
  if (listParam === '1') return true;
  if (listParam === '0') return false;
  return false;
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

const listItemLabel = (activityFilter: ActivityListFilterKey, count: number): string => {
  if (activityFilter === 'carpool') return `${count} rideshare${count === 1 ? '' : 's'} in your area`;
  if (activityFilter === 'event') return `${count} event${count === 1 ? '' : 's'} in your area`;
  if (activityFilter === 'hiking') return `${count} hike${count === 1 ? '' : 's'} in your area`;
  if (activityFilter === 'camping') return `${count} camp${count === 1 ? '' : 's'} in your area`;
  return `${count} activit${count === 1 ? 'y' : 'ies'} in your area`;
};

const venueListLabel = (venueFilter: VenueListFilterKey, count: number): string => {
  if (venueFilter === 'hiking') return `${count} hiking venue${count === 1 ? '' : 's'} in your area`;
  if (venueFilter === 'camping') return `${count} camping spot${count === 1 ? '' : 's'} in your area`;
  if (venueFilter === 'event') return `${count} event venue${count === 1 ? '' : 's'} in your area`;
  if (venueFilter === 'shop') return `${count} shop${count === 1 ? '' : 's'} in your area`;
  return `${count} venue${count === 1 ? '' : 's'} in your area`;
};

const panelListTitle = (
  panel: ExplorePanel,
  count: number,
  activityFilter: ActivityListFilterKey,
  venueFilter: VenueListFilterKey
): string => {
  if (panel === 'venues') return venueListLabel(venueFilter, count);
  if (panel === 'shops') return 'Gear shops & partners';
  return listItemLabel(activityFilter, count);
};

const desktopBrowseListTitle = (tab: DesktopBrowseTab, count: number, mapFilter: MapFilterKey): string => {
  if (tab === 'activities') {
    return listItemLabel(mapFilterToActivityListFilter(mapFilter), count);
  }
  return venueListLabel(mapFilterToVenueListFilter(mapFilter), count);
};

const desktopSearchPlaceholder = (tab: DesktopBrowseTab): string =>
  tab === 'venues' ? 'Search venues…' : 'Search activities…';

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

const panelSearchPlaceholder = (panel: ExplorePanel): string => {
  if (panel === 'venues') return 'Search places…';
  if (panel === 'shops') return 'Search shops…';
  return 'Search activities…';
};

export const MobileExploreExperience = () => {
  const { user } = useAuth();
  const { canPublish, loading: hostGateLoading, tenantId } = useOrganisationGate({
    enabled: Boolean(user),
  });
  const { openEdit } = useActivityFormSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { pathname, search } = useLocation();
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
  const [listOpen, setListOpen] = useState(() => parseListOpen(searchParams.get('list')));
  const [composeOpen, setComposeOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [contributeFlowOpen, setContributeFlowOpen] = useState(false);
  const [contributeKind, setContributeKind] = useState<ContributeVenueKind>('hiking');
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [guestJoinSheetOpen, setGuestJoinSheetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [fulfillIntentPrefill, setFulfillIntentPrefill] = useState<{
    draft: MobileCreateDraft;
    participantIntentId: string;
  } | null>(null);
  const [demandOpen, setDemandOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinActivity, setJoinActivity] = useState<ActivityDTO | null>(null);
  const [joinUiState, setJoinUiState] = useState<JoinRequestUiState>({ kind: 'open' });
  const [joinContext, setJoinContext] = useState<{
    myRequest: MyActivityRequestDTO | null;
    participation: ActivityParticipationDTO | null;
  } | null>(null);
  const [joinStateLoading, setJoinStateLoading] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
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
    if (searchParams.get('addLocation') !== '1') return;
    if (!user) {
      navigate(signInPathForReturn(explorePath({ panel: 'venues', addLocation: true })));
      return;
    }
    setPanel('venues');
    setListOpen(false);
    setContributeOpen(true);
    const params = new URLSearchParams(searchParams);
    params.delete('addLocation');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, user, navigate]);

  useEffect(() => {
    const contributeParam = searchParams.get('contribute');
    if (!contributeParam) return;
    const parsed = parseContributeParam(contributeParam);
    if (!parsed.openTypeSheet && !parsed.kind) return;
    if (!user) {
      navigate(
        signInPathForReturn(
          explorePath({
            panel: 'venues',
            contribute: parsed.kind ?? true,
          })
        )
      );
      return;
    }
    if (parsed.kind) {
      setContributeKind(parsed.kind);
      setContributeFlowOpen(true);
    } else {
      setContributeOpen(true);
    }
    const params = new URLSearchParams(searchParams);
    params.delete('contribute');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, user, navigate]);

  useEffect(() => {
    if (searchParams.get('request') !== '1') return;
    if (!user) {
      navigate(signInPathForReturn(explorePath({ request: true })));
      return;
    }
    setDemandOpen(true);
    const params = new URLSearchParams(searchParams);
    params.delete('request');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, user, navigate]);

  useEffect(() => {
    if (searchParams.get('compose') !== '1') return;
    if (!user) {
      navigate(signInPathForReturn(explorePath({ compose: true })));
      return;
    }
    setSelectedId(null);
    setComposeOpen(true);
    const params = new URLSearchParams(searchParams);
    params.delete('compose');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, user, navigate]);

  useEffect(() => {
    const nextMapFilter = parseMapFilter(searchParams.get('filter'));
    const nextPanel = parseExplorePanel(searchParams.get('panel'));
    setMapFilter(nextMapFilter);
    setActivityFilter(parseActivityListFilter(searchParams.get('activity')));
    setVenueFilter(mapFilterToVenueListFilter(nextMapFilter));
    setPanel(nextPanel);
    setListOpen(parseListOpen(searchParams.get('list')));
    setQuery(searchParams.get('q') ?? '');
    setVenueRegions(parseVenueRegionsParam(searchParams));
    if (isDesktop) {
      setDesktopBrowseTab(parseDesktopBrowseTab(nextPanel));
      if (searchParams.get('q')?.trim()) setSearchExpanded(true);
    }
  }, [searchParams, isDesktop]);

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

  const loadJoinContext = async (activityId: string) => {
    if (!user) {
      setJoinContext(null);
      setJoinUiState({ kind: 'open' });
      return;
    }
    setJoinStateLoading(true);
    try {
      const res = await api.getPublicActivityDetail(activityId);
      const nextContext = {
        myRequest: res.data.myRequest ?? null,
        participation: res.data.myParticipation ?? null,
      };
      setJoinContext(nextContext);
      setJoinUiState(resolveJoinRequestUiState(nextContext));
    } catch {
      setJoinContext(null);
      setJoinUiState({ kind: 'open' });
    } finally {
      setJoinStateLoading(false);
    }
  };

  useEffect(() => {
    if (!selected?.activity?.id || selectedCard?.showHostActions || !user) {
      setJoinContext(null);
      setJoinUiState({ kind: 'open' });
      setJoinStateLoading(false);
      return;
    }
    void loadJoinContext(selected.activity.id);
  }, [selected?.activity?.id, selectedCard?.showHostActions, user?.id]);
  const { href: signInHref } = buildSignInRedirect({ pathname, search });
  const reloadMap = () => {
    void reloadExploreMap(queryClient);
  };

  const openItem = useCallback((item: ExploreMapItemDTO) => {
    setComposeOpen(false);
    setCreateOpen(false);
    setFulfillIntentPrefill(null);
    setDemandOpen(false);
    setSelectedId(item.id);
    setListOpen(false);
  }, []);

  const handleFocusMapLocation = useCallback((coords: { lat: number; lng: number }) => {
    setRecenterTo(null);
    window.requestAnimationFrame(() => {
      setRecenterTo(coords);
    });
  }, []);

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
      navigate(signInHref);
      return;
    }
    if (hostGateLoading) return;
    setComposeOpen(true);
  };

  const handlePrimaryFab = () => {
    handleCreateTap();
  };

  const primaryFabLabel = 'Add New';

  const handleComposeChoice = (choice: ComposeIntentChoice) => {
    setComposeOpen(false);
    if (!user) {
      const redirect =
        choice === 'contribute'
          ? explorePath({ panel: 'venues', contribute: true })
          : choice === 'request'
            ? explorePath({ request: true })
            : explorePath({ compose: true });
      navigate(signInPathForReturn(redirect));
      return;
    }
    if (choice === 'host') {
      if (hostGateLoading) return;
      if (!canPublish) {
        navigate('/become-host');
        return;
      }
      setCreateOpen(true);
      return;
    }
    if (choice === 'request') {
      setDemandOpen(true);
      return;
    }
    setContributeOpen(true);
  };

  const handleContributeChoice = (kind: ContributeVenueKind) => {
    if (!user) {
      navigate(signInPathForReturn(explorePath({ panel: 'venues', contribute: kind })));
      return;
    }
    setContributeOpen(false);
    setContributeKind(kind);
    setContributeFlowOpen(true);
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
      setGuestJoinSheetOpen(true);
      return;
    }
    if (joinUiState.kind !== 'open') return;
    setJoinActivity(selected.activity);
    setJoinOpen(true);
  };

  const handleJoinSuccess = (message: string) => {
    setDemandNotice(message);
    if (selected?.activity?.id) {
      void loadJoinContext(selected.activity.id);
    }
  };

  const handleWithdraw = async (payload: { reason: WithdrawReason; message?: string }) => {
    const activity = selected?.activity ?? joinActivity;
    const requestId =
      joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed'
        ? joinUiState.requestId
        : joinContext?.myRequest?.id;
    if (!activity || !requestId) return;

    setWithdrawing(true);
    try {
      await api.cancelJoinRequest(activity.id, requestId, payload);
      setShowWithdraw(false);
      setDemandNotice(
        joinUiState.kind === 'confirmed' ? 'You have withdrawn from this activity.' : 'Join request cancelled.'
      );
      await loadJoinContext(activity.id);
    } catch (err) {
      setDemandNotice(err instanceof Error ? err.message : 'Could not withdraw');
      setShowWithdraw(false);
    } finally {
      setWithdrawing(false);
    }
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
    setCreateOpen(true);
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
    setCreateOpen(false);
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

  const closeJoinModal = () => {
    setJoinOpen(false);
    setJoinActivity(null);
  };

  const renderListPanelContent = () => (
    <>
      <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-neutral-200 lg:hidden" />

      {isDesktop ? (
        <>
          <div className="mb-3 flex shrink-0 items-center gap-2 border-b border-neutral-200">
            <div className="flex min-w-0 flex-1">
              {DESKTOP_BROWSE_TABS.map((tab) => {
                const active = desktopBrowseTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => applyDesktopBrowseTab(tab.key)}
                    className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="flex shrink-0 items-center gap-1 pb-1">
              <button
                type="button"
                onClick={() => setSearchExpanded((open) => !open)}
                className={`rounded-full p-2 ${
                  searchExpanded || query.trim()
                    ? 'bg-neutral-100 text-gray-900'
                    : 'text-gray-500 hover:bg-neutral-50'
                }`}
                aria-label={searchExpanded ? 'Close search' : 'Search'}
                aria-expanded={searchExpanded}
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={closeListPanel}
                className="rounded-full p-2 text-gray-500 hover:bg-neutral-50 hover:text-gray-800"
                aria-label="Collapse list panel"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          </div>
          {(searchExpanded || query.trim()) && (
            <label className="mb-3 flex shrink-0 items-center gap-2 rounded-2xl bg-neutral-100 px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onBlur={() => syncExploreUrl({ q: query })}
                placeholder={desktopSearchPlaceholder(desktopBrowseTab)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                autoFocus
              />
              {query.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    syncExploreUrl({ q: '' });
                  }}
                  className="shrink-0 rounded-full p-0.5 text-gray-500 hover:text-gray-700"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </label>
          )}
          <h2 className="mb-3 shrink-0 text-lg font-bold text-gray-900 lg:text-xl">
            {desktopBrowseListTitle(desktopBrowseTab, listItems.length, mapFilter)}
          </h2>
        </>
      ) : (
        <>
          <div className="mb-4 flex shrink-0 items-start justify-between gap-3 border-b border-neutral-200/80 pb-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-gray-900">
                {panelListTitle(sidebarPanel, listItems.length, activityFilter, venueFilter)}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-gray-500">
                {listItems.length === 1 ? '1 result' : `${listItems.length} results`}
              </p>
            </div>
            <button
              type="button"
              onClick={closeListPanel}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-neutral-200/80"
              aria-label="Close browse panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-3 flex shrink-0 gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {PANEL_TABS.map((tab) => {
              const active = panel === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => applyPanel(tab.key)}
                  className={`inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-sm transition ${
                    active
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                      : 'bg-white text-gray-700 ring-1 ring-neutral-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          {browseFilterHint && (
            <p className="mb-3 shrink-0 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs leading-relaxed text-emerald-900">
              {browseFilterHint}
            </p>
          )}
          <label className="mb-3 flex shrink-0 items-center gap-2 rounded-2xl border border-neutral-200/80 bg-white px-3 py-2.5 shadow-sm">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onBlur={() => syncExploreUrl({ q: query })}
              placeholder={panelSearchPlaceholder(sidebarPanel)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </label>
          {sidebarPanel === 'venues' && (
            <div className="mb-3 shrink-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Filter list</p>
              <div className="flex flex-wrap gap-2">
                {VENUE_LIST_FILTERS.map((option) => {
                  const active = venueFilter === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => applyVenueFilter(option.key)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                        active ? exploreVenueListFilterActiveClass(option.key) : EXPLORE_LIST_FILTER_INACTIVE
                      }`}
                    >
                      <ExploreFilterIcon filter={option.key === 'shop' ? 'shops' : option.key === 'all' ? 'all' : option.key} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {sidebarPanel === 'activities' && (
            <div className="mb-3 shrink-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Filter list</p>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_LIST_FILTERS.map((option) => {
                  const active = activityFilter === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => applyActivityFilter(option.key)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                        active ? exploreActivityListFilterActiveClass(option.key) : EXPLORE_LIST_FILTER_INACTIVE
                      }`}
                    >
                      <ExploreFilterIcon filter={option.key} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className={`${EXPLORE_SHEET.browseList} lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-8`}>
        {loading && listItems.length === 0 ? (
          <ExploreListSkeleton rows={isDesktop ? 8 : 5} />
        ) : listItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            {isDesktop
              ? desktopBrowseTab === 'venues'
                ? 'No venues match this filter yet.'
                : 'Nothing here with these filters — try another type or date.'
              : sidebarPanel === 'venues'
                ? 'No venues match this filter yet.'
                : sidebarPanel === 'shops'
                  ? 'No gear shops listed yet.'
                  : 'Nothing here with these filters — try another type or date.'}
          </p>
        ) : null}
        {listItems.length > 0 && shopListSections ? (
          <>
            {shopListSections.physical.length > 0 && (
              <>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  On the map ({shopListSections.physical.length})
                </p>
                {shopListSections.physical.map((item) => (
                  <ExploreListRow
                    key={item.id}
                    item={item}
                    card={buildExploreCardModel(item)}
                    onClick={() => openItem(item)}
                    onFocusMapLocation={handleFocusMapLocation}
                  />
                ))}
              </>
            )}
            {shopListSections.online.length > 0 && (
              <>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 ${shopListSections.physical.length > 0 ? 'mt-6' : ''}`}>
                  Online partners ({shopListSections.online.length})
                </p>
                {shopListSections.online.map((item) => (
                  <ExploreListRow
                    key={item.id}
                    item={item}
                    card={buildExploreCardModel(item)}
                    onClick={() => openItem(item)}
                    onFocusMapLocation={handleFocusMapLocation}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          listItems.map((item) => (
            <ExploreListRow
              key={item.id}
              item={item}
              card={buildExploreCardModel(item)}
              onClick={() => openItem(item)}
              onFocusMapLocation={handleFocusMapLocation}
            />
          ))
        )}
      </div>
    </>
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
            {renderListPanelContent()}
          </aside>
        )}

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <MobileExploreHeader />

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
              isDesktop={isDesktop}
              allowedKeys={isDesktop ? desktopFilterKeys : undefined}
              moreOpen={moreFiltersOpen}
              onMoreOpenChange={setMoreFiltersOpen}
            />
          )}

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
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--safe-bottom)+0.75rem)] z-[1100] flex items-end justify-between gap-3 px-4 lg:hidden">
          <button
            type="button"
            onClick={openBrowse}
            className={`${EXPLORE_FLOATING_CONTROL} pointer-events-auto inline-flex gap-2 px-4 py-2.5 text-sm font-semibold text-gray-900`}
          >
            <List className="h-4 w-4" aria-hidden />
            List
          </button>
          <div className="pointer-events-auto flex flex-col items-center gap-4">
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

      <div className="pointer-events-none absolute bottom-6 right-4 z-[1100] hidden lg:flex lg:flex-col lg:items-center lg:gap-4">
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
          onWithdraw={() => setShowWithdraw(true)}
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
              {renderListPanelContent()}
            </ExploreResponsiveSheet>
          </>
        )}
      </div>
      </div>

      {composeOpen && (
        <MobileCreateIntentSheet
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          onChoose={handleComposeChoice}
        />
      )}

      {contributeOpen && (
        <MobileContributeTypeSheet
          open={contributeOpen}
          onClose={() => setContributeOpen(false)}
          onBack={() => {
            setContributeOpen(false);
            setComposeOpen(true);
          }}
          onChoose={handleContributeChoice}
        />
      )}

      {contributeFlowOpen && (
        <MobileCreateContributeFlow
          open={contributeFlowOpen}
          kind={contributeKind}
          onClose={() => setContributeFlowOpen(false)}
          onBackToIntent={() => setContributeOpen(true)}
          onSubmitted={(result: ContributeSubmitResult) => {
            reloadMap();
            if (result.kind === 'shop') {
              setVenueNotice('Shop submitted for review. We\'ll notify you once it\'s on the map.');
            } else {
              setVenueNotice(
                `"${result.location.name}" submitted for admin review. You'll see it on the map once published.`
              );
            }
          }}
          signInHref={signInHref}
        />
      )}

      {createOpen && (
        <MobileCreateActivityFlow
          open={createOpen}
          onClose={closeCreateFlow}
          demandPrefill={fulfillIntentPrefill}
          onBackToIntent={() => {
            setFulfillIntentPrefill(null);
            setComposeOpen(true);
          }}
          onPublished={handleActivityPublished}
          onOpenHostApplication={() => {
            closeCreateFlow();
            navigate('/become-host');
          }}
          signInHref={signInHref}
        />
      )}

      {demandOpen && (
        <MobileCreateDemandFlow
          open={demandOpen}
          onClose={() => setDemandOpen(false)}
          onBackToIntent={() => setComposeOpen(true)}
          onSubmitted={(result) => {
            reloadMap();
            if (!result.visibleOnMap) {
              setDemandNotice(
                'Request posted. Add a map pin next time to show on Explore — nearby hosts can still message you.'
              );
            } else {
              setDemandNotice(
                'Request posted on the map. Nearby hosts and guides can message you or propose a matching activity.'
              );
            }
          }}
          signInHref={signInHref}
        />
      )}

      {joinOpen && joinActivity && (
        <JoinRequestModal
          open={joinOpen}
          onClose={closeJoinModal}
          activity={joinActivity}
          overlayClassName="z-[6000]"
          onSuccess={handleJoinSuccess}
        />
      )}

      {(selected?.activity ?? joinActivity) && (
        <WithdrawRequestModal
          open={showWithdraw}
          onClose={() => setShowWithdraw(false)}
          activityTitle={(selected?.activity ?? joinActivity)?.title ?? 'this activity'}
          activityDate={(selected?.activity ?? joinActivity)?.date}
          variant={withdrawModalVariant(joinUiState)}
          submitting={withdrawing}
          onConfirm={handleWithdraw}
        />
      )}

      <ExploreGuestJoinSheet
        open={guestJoinSheetOpen}
        onClose={() => setGuestJoinSheetOpen(false)}
        activityTitle={selected?.activity?.title || selected?.activity?.locationName}
      />

    </div>
  );
};
