import { exploreDemandMapItemPath } from '@uaetrail/shared-types';
import type { OrganizeComposeKind } from './compose';
import { EXPLORE_MAP_PATH } from '../config/platform';
import { TRIPS_PATH } from '../constants';
import { tripsPlansPath } from '../trips/tripsRouting';
import type { ContributeVenueKind } from './contributeTypes';
import { formatComposeQuery, type ExploreCompose } from './compose';
import {
  parseExploreActivityDatePreset,
  serializeExploreActivityDatePreset,
} from './exploreActivityDateFilter';
import {
  serializeExploreBuddySubtype,
  type ExploreBuddySubtypeKey,
} from './exploreBuddySubtype';
import {
  serializeExploreOutingTopic,
  type ExploreOutingTopicKey,
} from './exploreOutingTopic';

export type ExplorePanel = 'activities' | 'venues' | 'shops';

/** Map overlay filter — controls which pins appear on the map. */
export type MapFilterKey = 'all' | 'hiking' | 'camping' | 'rideshare' | 'others' | 'shops';

/** Side-panel activity list filter. */
export type ActivityListFilterKey = 'all' | 'hiking' | 'camping' | 'event' | 'rideshare';

/** Side-panel venue list filter. */
export type VenueListFilterKey = 'all' | 'hiking' | 'camping' | 'shop' | 'event';

const MAP_FILTERS = new Set<MapFilterKey>(['all', 'hiking', 'camping', 'rideshare', 'others', 'shops']);

const ACTIVITY_LIST_FILTER_SET = new Set<ActivityListFilterKey>([
  'all',
  'hiking',
  'camping',
  'event',
  'rideshare',
]);

const VENUE_LIST_FILTER_SET = new Set<VenueListFilterKey>([
  'all',
  'hiking',
  'camping',
  'shop',
  'event',
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
  carpool: 'rideshare',
};

const EXPLORE_PANELS = new Set<ExplorePanel>(['activities', 'venues', 'shops']);

/** Open a specific explore map item (peek card), e.g. `demand:uuid` or `venue:uuid`. */
export const EXPLORE_PIN_QUERY_KEY = 'pin';
/** When `1`, activity peek shows join-invite banner (with `pin=activity:…`). */
export const EXPLORE_JOIN_INVITE_QUERY_KEY = 'invite';
/** Buddy user id — prefill post-publish invite after Plan a trip from Social. */
export const PLAN_WITH_QUERY_KEY = 'planWith';
/** When `1`, map/list show only the signed-in member's trips + wishlist pins. */
export const MY_TRIPS_QUERY_KEY = 'myTrips';

export const parsePlanWithUserId = (searchParams: Pick<URLSearchParams, 'get'>): string | null =>
  searchParams.get(PLAN_WITH_QUERY_KEY)?.trim() || null;

export const parseExploreJoinInvitePeek = (searchParams: Pick<URLSearchParams, 'get'>): boolean =>
  searchParams.get(EXPLORE_JOIN_INVITE_QUERY_KEY) === '1';

export const parseExplorePinMapItemId = (searchParams: Pick<URLSearchParams, 'get'>): string | null =>
  searchParams.get(EXPLORE_PIN_QUERY_KEY)?.trim() || null;

/** Deep link from Profile wishlist or notifications → map peek. */
export const exploreSavedPinPath = (mapItemId: string): string =>
  explorePath({ pin: mapItemId, panel: 'activities', list: true });

/** Share link for map items — opens explore peek (guests and members). */
export const exploreMapItemSharePath = (mapItemId: string): string => {
  const id = mapItemId.trim();
  if (id.startsWith('demand:')) return exploreDemandMapItemPath(id);
  return explorePath({ pin: id });
};

/** Resume publishing an {@link Activity} for a map {@link ParticipantIntent} after auth/onboarding. */
/** Legacy deep link: selects a demand pin on load; poster links via `link-activity`, not host fulfill. */
export const FULFILL_INTENT_QUERY_KEY = 'fulfillIntent';
/** @deprecated Legacy query key — parsed for backward compatibility. */
export const LEGACY_FULFILL_INTENT_QUERY_KEY = 'hostDemand';

/** Prefill explore organize wizard from a prior activity (new id on publish). */
export const ORGANIZE_FROM_ACTIVITY_QUERY_KEY = 'organizeFrom';

export const parseOrganizeFromActivityId = (
  searchParams: Pick<URLSearchParams, 'get'>
): string | null => searchParams.get(ORGANIZE_FROM_ACTIVITY_QUERY_KEY)?.trim() || null;

export const clearOrganizeFromActivityParams = (params: URLSearchParams): void => {
  params.delete(ORGANIZE_FROM_ACTIVITY_QUERY_KEY);
};

/** Deep link: reorganize a past outing via FAB wizard (not server duplicate). */
export const exploreReorganizeActivityPath = (
  activityId: string,
  kind: OrganizeComposeKind
): string =>
  explorePath({
    compose: { intent: 'organize', kind },
    organizeFrom: activityId,
  });

export const exploreReorganizeActivityReturnPath = (
  activityId: string,
  currentSearch: URLSearchParams,
  pathname: string = EXPLORE_MAP_PATH
): string => {
  const params = new URLSearchParams(currentSearch);
  params.set(ORGANIZE_FROM_ACTIVITY_QUERY_KEY, activityId);
  if (!params.has('list')) params.set('list', '1');
  return `${pathname}?${params.toString()}`;
};

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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** @deprecated Prefer parseExploreActivityDatePreset — kept for legacy `YYYY-MM-DD` links. */
export const parseExploreActivityDate = (value: string | null): string | null => {
  if (!value || !ISO_DATE.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return value;
};

export {
  parseExploreActivityDatePreset,
  exploreActivityDatePresetLabel,
  serializeExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from './exploreActivityDateFilter';

export const formatExploreActivityDateLabel = (iso: string): string =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

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
  /** Compose menu or wizard route (`menu`, `organize:hiking`, …). */
  compose?: ExploreCompose | 'menu';
  /** @deprecated Prefer `compose` — open find wizard. */
  request?: boolean;
  /** @deprecated Prefer `compose: { intent: 'add', kind }`. */
  contribute?: boolean | ContributeVenueKind;
  /**
   * Explore map item id for a {@link ParticipantIntent} (`source=demand`) — resume Activity publish.
   * Prefer this over legacy `hostDemand`.
   */
  fulfillIntent?: string;
  /** @deprecated Use {@link explorePath} `fulfillIntent` — legacy query key. */
  hostDemand?: string;
  q?: string;
  /** Scheduled activity day on the map (`YYYY-MM-DD`). */
  date?: string | null;
  /** Drill-down within `filter=others` on Activities (events vs activities). */
  subtype?: ExploreBuddySubtypeKey;
  /** Drill-down within `filter=others` + `subtype=activities` (climb, run, …). */
  outingTopic?: ExploreOutingTopicKey;
  /** Explore map item id to open on load (`activity:…`, `demand:…`, `venue:…`). */
  pin?: string;
  /** Prefill organize wizard from an existing activity id (creates a new activity on publish). */
  organizeFrom?: string;
  /** Limit pins to signed-in member trips + wishlist (requires auth). */
  myTrips?: boolean;
  /** Open Explore Social people panel (`view=social`). */
  social?: boolean;
  /** Prefill compose — buddy to plan with (post-publish invite). */
  planWith?: string;
  /** Activity join-invite deep link — use with `pin=activity:{id}`. */
  joinInvite?: boolean;
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
  if (options?.compose) {
    const route: ExploreCompose =
      options.compose === 'menu' ? { surface: 'menu' } : options.compose;
    params.set('compose', formatComposeQuery(route));
  } else if (options?.addLocation) {
    params.set('compose', 'add');
  } else if (options?.request) {
    params.set('compose', 'find');
  } else if (options?.contribute === true) {
    params.set('compose', 'add');
  } else if (options?.contribute) {
    params.set('compose', formatComposeQuery({ intent: 'add', kind: options.contribute }));
  }
  const fulfillIntentId = options?.fulfillIntent ?? options?.hostDemand;
  if (fulfillIntentId) {
    setFulfillIntentMapItemParam(params, fulfillIntentId);
  }
  if (options?.q) {
    params.set('q', options.q);
  }
  if (options?.date === null) {
    params.delete('date');
  } else if (options?.date) {
    const preset = parseExploreActivityDatePreset(options.date);
    const serialized = serializeExploreActivityDatePreset(preset);
    if (serialized) params.set('date', serialized);
    else params.delete('date');
  }
  const filterKey = (options?.filter ?? 'all') as MapFilterKey;
  const buddySubtype = options?.subtype ?? 'all';
  const serializedSubtype = options?.subtype
    ? serializeExploreBuddySubtype(options.subtype, filterKey)
    : null;
  if (serializedSubtype) params.set('subtype', serializedSubtype);
  const serializedTopic = options?.outingTopic
    ? serializeExploreOutingTopic(options.outingTopic, filterKey, buddySubtype)
    : null;
  if (serializedTopic) params.set('outingTopic', serializedTopic);
  if (options?.pin?.trim()) {
    params.set(EXPLORE_PIN_QUERY_KEY, options.pin.trim());
  }
  if (options?.organizeFrom?.trim()) {
    params.set(ORGANIZE_FROM_ACTIVITY_QUERY_KEY, options.organizeFrom.trim());
  }
  if (options?.myTrips) {
    params.set(MY_TRIPS_QUERY_KEY, '1');
  }
  if (options?.social) {
    params.set('view', 'social');
    if (options.list !== false) {
      params.set('list', '1');
    }
  }
  if (options?.planWith?.trim()) {
    params.set('planWith', options.planWith.trim());
  }
  if (options?.joinInvite) {
    params.set(EXPLORE_JOIN_INVITE_QUERY_KEY, '1');
  }
  const qs = params.toString();
  return qs ? `${EXPLORE_MAP_PATH}?${qs}` : EXPLORE_MAP_PATH;
};

/** Explore map with Social panel open. */
export const exploreSocialPath = (options?: { list?: boolean }): string =>
  explorePath({ social: true, list: options?.list ?? true });

/** Start create flow with optional buddy to plan with. */
export const explorePlanWithBuddyPath = (
  buddyUserId: string,
  mode: 'organize' | 'find'
): string =>
  explorePath({
    list: true,
    planWith: buddyUserId,
    compose: mode === 'organize' ? { intent: 'organize', kind: 'activity' } : { intent: 'find' },
  });

/** Join me notification target — map peek with invite banner. */
export const exploreActivityInvitePathFromRouting = (activityId: string): string =>
  explorePath({ pin: `activity:${activityId}`, joinInvite: true, list: true });

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
    case 'rideshare':
      return 'rideshare';
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

/** Parse `?places=` venue catalog filter (trails, spots, shops, …). */
export const parseVenueListFilter = (
  placesParam: string | null,
  legacyFilterParam: string | null = null,
  /** When set, activity uses `?activity=` — do not infer places from legacy `?filter=`. */
  activityParam: string | null = null
): VenueListFilterKey => {
  if (placesParam === 'shops') return 'shop';
  if (placesParam && VENUE_LIST_FILTER_SET.has(placesParam as VenueListFilterKey)) {
    return placesParam as VenueListFilterKey;
  }
  if (!activityParam && legacyFilterParam) {
    const parsed = parseMapFilter(legacyFilterParam);
    if (parsed === 'others' || parsed === 'rideshare' || parsed === 'all') {
      return 'all';
    }
    return mapFilterToVenueListFilter(parsed);
  }
  return 'all';
};

export const serializeVenueListFilter = (filter: VenueListFilterKey): string | null => {
  if (filter === 'all') return null;
  if (filter === 'shop') return 'shops';
  return filter;
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

/** Places (trails, spots, shops) on the explore map — URL panel stays `venues`. */
export const explorePlacesPath = (options?: {
  region?: string;
  addLocation?: boolean;
  q?: string;
  list?: boolean;
}): string => explorePath({ panel: 'venues', ...options });

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
  tab === 'hosted' ? tripsPlansPath('hosted') : TRIPS_PATH;

/** Consumer create flow — explore compose organize menu or a specific kind. */
export const exploreOrganizePath = (kind?: OrganizeComposeKind): string =>
  kind
    ? explorePath({ compose: { intent: 'organize', kind } })
    : explorePath({ compose: { surface: 'menu', intent: 'organize' } });

/** Host with publish access — prefill rideshare organize from an own demand intent. */
export const exploreOfferRideshareForDemandPath = (intentId: string): string =>
  explorePath({
    pin: `demand:${intentId}`,
    compose: { intent: 'organize', kind: 'rideshare' },
  });

/** Map legacy `/activities?create=` values onto explore compose organize routes. */
export const legacyCreateParamToOrganizePath = (createParam: string | null): string | null => {
  if (!createParam) return null;
  if (createParam === 'hiking' || createParam === 'camping' || createParam === 'event') {
    return exploreOrganizePath(createParam);
  }
  if (
    createParam === 'community_activity' ||
    createParam === 'COMMUNITY_ACTIVITY' ||
    createParam === 'EVENT'
  ) {
    return exploreOrganizePath('event');
  }
  if (createParam === 'activity') {
    return exploreOrganizePath('activity');
  }
  if (
    createParam === 'rideshare' ||
    createParam === 'RIDESHARE' ||
    createParam === 'carpool' ||
    createParam === 'CARPOOL'
  ) {
    return exploreOrganizePath('rideshare');
  }
  return null;
};

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
