import { EXPLORE_MAP_PATH } from '../config/platform';
import type { ContributeVenueKind } from './contributeTypes';

export type ExplorePanel = 'activities' | 'venues' | 'shops';

export const CONTRIBUTE_VENUE_KINDS = ['hiking', 'camping', 'shop', 'event'] as const satisfies readonly ContributeVenueKind[];

export const parseContributeParam = (
  value: string | null
): { openTypeSheet: boolean; kind: ContributeVenueKind | null } => {
  if (!value) return { openTypeSheet: false, kind: null };
  if (value === '1') return { openTypeSheet: true, kind: null };
  if ((CONTRIBUTE_VENUE_KINDS as readonly string[]).includes(value)) {
    return { openTypeSheet: false, kind: value as ContributeVenueKind };
  }
  return { openTypeSheet: false, kind: null };
};

/** Map overlay filter — controls which pins appear on the map. */
export type MapFilterKey = 'all' | 'hiking' | 'camping' | 'carpool' | 'others' | 'shops';

/** Side-panel activity list filter. */
export type ActivityListFilterKey = 'all' | 'hiking' | 'camping' | 'event' | 'carpool';

/** Side-panel venue list filter. */
export type VenueListFilterKey = 'all' | 'hiking' | 'camping' | 'shop' | 'event';

const MAP_FILTERS = new Set<MapFilterKey>(['all', 'hiking', 'camping', 'carpool', 'others', 'shops']);

const ACTIVITY_LIST_FILTER_SET = new Set<ActivityListFilterKey>([
  'all',
  'hiking',
  'camping',
  'event',
  'carpool',
]);

const LEGACY_MAP_FILTER: Record<string, MapFilterKey> = {
  shop: 'shops',
  shops: 'shops',
  activities: 'all',
  venues: 'all',
  looking: 'all',
  event: 'others',
  events: 'others',
};

const LEGACY_ACTIVITY_FROM_FILTER: Record<string, ActivityListFilterKey> = {
  hiking: 'hiking',
  camping: 'camping',
  event: 'event',
  events: 'event',
  others: 'event',
  carpool: 'carpool',
};

const EXPLORE_PANELS = new Set<ExplorePanel>(['activities', 'venues', 'shops']);

/** Resume publishing an {@link Activity} for a map {@link ParticipantIntent} after auth/onboarding. */
export const FULFILL_INTENT_QUERY_KEY = 'fulfillIntent';
/** @deprecated Legacy query key — parsed for backward compatibility. */
export const LEGACY_FULFILL_INTENT_QUERY_KEY = 'hostDemand';

export const parseFulfillIntentMapItemId = (
  searchParams: Pick<URLSearchParams, 'get'>
): string | null =>
  searchParams.get(FULFILL_INTENT_QUERY_KEY) ?? searchParams.get(LEGACY_FULFILL_INTENT_QUERY_KEY);

export const setFulfillIntentMapItemParam = (params: URLSearchParams, mapItemId: string): void => {
  params.set(FULFILL_INTENT_QUERY_KEY, mapItemId);
  params.delete(LEGACY_FULFILL_INTENT_QUERY_KEY);
};

export const clearFulfillIntentMapItemParams = (params: URLSearchParams): void => {
  params.delete(FULFILL_INTENT_QUERY_KEY);
  params.delete(LEGACY_FULFILL_INTENT_QUERY_KEY);
};

/** Auth return URL: reopen explore and continue fulfill-intent → Activity publish. */
export const exploreFulfillIntentReturnPath = (
  mapItemId: string,
  currentSearch: URLSearchParams,
  pathname: string = EXPLORE_MAP_PATH
): string => {
  const params = new URLSearchParams(currentSearch);
  setFulfillIntentMapItemParam(params, mapItemId);
  if (!params.has('list')) params.set('list', '1');
  return `${pathname}?${params.toString()}`;
};

export const parseMapFilter = (value: string | null): MapFilterKey => {
  if (value && MAP_FILTERS.has(value as MapFilterKey)) return value as MapFilterKey;
  if (value && LEGACY_MAP_FILTER[value]) return LEGACY_MAP_FILTER[value];
  return 'all';
};

export const parseActivityListFilter = (
  activityParam: string | null,
  legacyFilterParam: string | null = null
): ActivityListFilterKey => {
  if (activityParam && ACTIVITY_LIST_FILTER_SET.has(activityParam as ActivityListFilterKey)) {
    return activityParam as ActivityListFilterKey;
  }
  if (legacyFilterParam && LEGACY_ACTIVITY_FROM_FILTER[legacyFilterParam]) {
    return LEGACY_ACTIVITY_FROM_FILTER[legacyFilterParam];
  }
  return 'all';
};

const EXPLORE_PANEL_ALIASES: Record<string, ExplorePanel> = {
  locations: 'venues',
};

export const parseExplorePanel = (value: string | null): ExplorePanel => {
  if (value && EXPLORE_PANELS.has(value as ExplorePanel)) return value as ExplorePanel;
  if (value && EXPLORE_PANEL_ALIASES[value]) return EXPLORE_PANEL_ALIASES[value];
  return 'activities';
};

/** Parse venue state/emirate filters from URL (`regions=Dubai,RAK` or legacy `region=RAK`). */
export const parseVenueRegionsParam = (searchParams: Pick<URLSearchParams, 'get'>): string[] => {
  const multi = searchParams.get('regions');
  if (multi) {
    return [...new Set(multi.split(',').map((part) => part.trim()).filter(Boolean))];
  }
  const single = searchParams.get('region');
  return single ? [single] : [];
};

export const explorePath = (options?: {
  filter?: MapFilterKey;
  activity?: ActivityListFilterKey;
  panel?: ExplorePanel;
  list?: boolean;
  /** @deprecated Prefer `regions` for multi-select venue filters. */
  region?: string;
  /** Selected venue states/emirates (multi-select). */
  regions?: string[];
  addLocation?: boolean;
  compose?: boolean;
  /** Open contribute type sheet (`true`) or a specific contribute wizard step. */
  contribute?: boolean | ContributeVenueKind;
  /** Open the participant-intent (“I want to go”) request wizard. */
  request?: boolean;
  /**
   * Explore map item id for a {@link ParticipantIntent} (`source=demand`) — resume Activity publish.
   * Prefer this over legacy `hostDemand`.
   */
  fulfillIntent?: string;
  /** @deprecated Use {@link explorePath} `fulfillIntent` — legacy query key. */
  hostDemand?: string;
  q?: string;
}): string => {
  const params = new URLSearchParams();
  if (options?.filter && options.filter !== 'all') {
    params.set('filter', options.filter);
  }
  if (options?.activity && options.activity !== 'all') {
    params.set('activity', options.activity);
  }
  if (options?.panel && options.panel !== 'activities') {
    params.set('panel', options.panel);
  }
  if (options?.list) {
    params.set('list', '1');
  }
  if (options?.regions && options.regions.length > 0) {
    params.set('regions', options.regions.join(','));
  } else if (options?.region) {
    params.set('region', options.region);
  }
  if (options?.addLocation) {
    params.set('addLocation', '1');
  }
  if (options?.compose) {
    params.set('compose', '1');
  }
  if (options?.contribute === true) {
    params.set('contribute', '1');
  } else if (options?.contribute) {
    params.set('contribute', options.contribute);
  }
  if (options?.request) {
    params.set('request', '1');
  }
  const fulfillIntentId = options?.fulfillIntent ?? options?.hostDemand;
  if (fulfillIntentId) {
    setFulfillIntentMapItemParam(params, fulfillIntentId);
  }
  if (options?.q) {
    params.set('q', options.q);
  }
  const qs = params.toString();
  return qs ? `${EXPLORE_MAP_PATH}?${qs}` : EXPLORE_MAP_PATH;
};

export const activityFilterToMapFilter = (activity: ActivityListFilterKey): MapFilterKey | undefined => {
  if (activity === 'all') return undefined;
  if (activity === 'event') return 'others';
  return activity;
};

/** Keep browse list filters aligned when the map filter changes. */
export const mapFilterToActivityListFilter = (filter: MapFilterKey): ActivityListFilterKey => {
  switch (filter) {
    case 'hiking':
      return 'hiking';
    case 'camping':
      return 'camping';
    case 'carpool':
      return 'carpool';
    case 'others':
      return 'event';
    default:
      return 'all';
  }
};

export const mapFilterToVenueListFilter = (filter: MapFilterKey): VenueListFilterKey => {
  switch (filter) {
    case 'hiking':
      return 'hiking';
    case 'camping':
      return 'camping';
    case 'shops':
      return 'shop';
    case 'others':
      return 'event';
    default:
      return 'all';
  }
};

export const venueFilterToMapFilter = (filter: VenueListFilterKey): MapFilterKey | undefined => {
  switch (filter) {
    case 'hiking':
      return 'hiking';
    case 'camping':
      return 'camping';
    case 'shop':
      return 'shops';
    case 'event':
      return 'others';
    default:
      return undefined;
  }
};

/** Gear shops on the explore map (replaces legacy `/shop` catalogue browse). */
export const exploreShopsPath = (): string =>
  explorePath({ panel: 'shops', filter: 'shops' });

/** Scheduled activities on the explore map. */
export const exploreActivitiesPath = (options?: {
  activity?: ActivityListFilterKey;
  /** Pass `true` only when opening the browse list panel intentionally. */
  list?: boolean;
}): string =>
  explorePath({
    panel: 'activities',
    list: options?.list,
    activity: options?.activity,
  });

/** Places (trails, camps, events) on the explore map — URL panel stays `venues`. */
export const explorePlacesPath = (options?: {
  region?: string;
  addLocation?: boolean;
  q?: string;
  list?: boolean;
}): string => explorePath({ panel: 'venues', ...options });

/** @deprecated Use explorePlacesPath */
export const exploreVenuesPath = explorePlacesPath;

/** @deprecated Use explorePlacesPath */
export const exploreLocationsPath = explorePlacesPath;

/** Entity kinds that map to a consistent explore back target. */
export type DetailBackKind =
  | 'activity'
  | 'trail'
  | 'camp'
  | 'event'
  | 'shop'
  | 'host'
  | 'explore';

/** Canonical back target from entity detail pages — always map-first. */
export const detailBackPath = (kind: DetailBackKind): string => {
  switch (kind) {
    case 'activity':
      return exploreActivitiesPath();
    case 'trail':
      return explorePath({ panel: 'venues', filter: 'hiking' });
    case 'camp':
      return explorePath({ panel: 'venues', filter: 'camping' });
    case 'event':
      return explorePath({ panel: 'venues', filter: 'others' });
    case 'shop':
      return exploreShopsPath();
    case 'host':
    case 'explore':
    default:
      return EXPLORE_MAP_PATH;
  }
};

/** Personal activities hub — joined/hosted tabs only (not public browse). */
export const myActivitiesPath = (tab: 'joined' | 'hosted' = 'joined'): string =>
  `/activities?tab=${tab}`;

/** Map legacy discovery query params onto explore search params. */
export const discoveryToExploreSearch = (search: string): string => {
  const incoming = new URLSearchParams(search);
  const next = new URLSearchParams();
  next.set('panel', 'venues');

  const activity = incoming.get('activity');
  if (activity === 'hiking' || activity === 'camping' || activity === 'event') {
    next.set('activity', activity);
  }

  const region = incoming.get('region');
  if (region) next.set('region', region);

  const q = incoming.get('q');
  if (q) next.set('q', q);

  if (incoming.get('addLocation') === '1') {
    next.set('addLocation', '1');
  }

  return next.toString();
};
