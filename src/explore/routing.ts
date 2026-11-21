import {
  exploreAreaQueryParam,
  exploreAvailabilityMapItemPath,
  formatExploreEventDateLabel,
  resolveSeekingExploreMapItemId,
} from '@uaetrail/shared-types';
import type { HostComposeKind } from './compose';
import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from '../config/platform';
import { PLAN_PATH } from '../constants';
import { planHostedSchedulePath } from '../plan/planRouting';
import {
  addFacilityCompose,
  formatComposeQuery,
  hostCompose,
  type ExploreCompose,
} from './compose';
import {
  parseExploreActivityDatePreset,
  serializeExploreActivityDatePreset,
} from './exploreActivityDateFilter';
import { serializeExplorePinKindFilter, type ExplorePinKindFilter } from './explorePinKindFilter';
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
export type MapFilterKey = 'all' | 'hiking' | 'camping' | 'facilities' | 'rideshare' | 'others' | 'shops';

/** Side-panel activity list filter. */
export type ActivityListFilterKey = 'all' | 'hiking' | 'camping' | 'event' | 'rideshare';

/** Side-panel venue list filter. */
export type VenueListFilterKey = 'all' | 'hiking' | 'camping' | 'facilities' | 'shop' | 'event';

const MAP_FILTERS = new Set<MapFilterKey>([
  'all',
  'hiking',
  'camping',
  'facilities',
  'rideshare',
  'others',
  'shops',
]);

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
  'facilities',
  'shop',
  'event',
]);

const INBOUND_MAP_FILTER: Record<string, MapFilterKey> = {
  shop: 'shops',
  shops: 'shops',
  facility: 'facilities',
  facilities: 'facilities',
  activities: 'all',
  venues: 'all',
  looking: 'all',
  event: 'others',
  events: 'others',
};

const INBOUND_ACTIVITY_FROM_FILTER: Record<string, ActivityListFilterKey> = {
  hiking: 'hiking',
  camping: 'camping',
  event: 'event',
  events: 'event',
  others: 'event',
  carpool: 'rideshare',
};

const EXPLORE_PANELS = new Set<ExplorePanel>(['activities', 'venues', 'shops']);

/** Open a specific explore map item (peek card), e.g. `activity:uuid`. */
export const EXPLORE_PIN_QUERY_KEY = 'pin';
/** When `1`, activity peek shows join-invite banner (with `pin=activity:…`). */
export const EXPLORE_JOIN_INVITE_QUERY_KEY = 'invite';
/** Buddy user id — prefill post-publish invite after Host an outing from Social. */
export const PLAN_WITH_QUERY_KEY = 'planWith';
/** When `1`, map/list show only the signed-in member's activities + wishlist pins. */
export const MY_PLAN_MAP_QUERY_KEY = 'myPlan';
/** Legacy explore query — parse only; do not write in new URLs. */
const LEGACY_MY_PLAN_MAP_QUERY_KEY = 'myTrips';

export const parseExploreMyPlanMapMode = (searchParams: Pick<URLSearchParams, 'get'>): boolean =>
  searchParams.get(MY_PLAN_MAP_QUERY_KEY) === '1' ||
  searchParams.get(LEGACY_MY_PLAN_MAP_QUERY_KEY) === '1';

export const parsePlanWithUserId = (searchParams: Pick<URLSearchParams, 'get'>): string | null =>
  searchParams.get(PLAN_WITH_QUERY_KEY)?.trim() || null;

export const parseExploreJoinInvitePeek = (searchParams: Pick<URLSearchParams, 'get'>): boolean =>
  searchParams.get(EXPLORE_JOIN_INVITE_QUERY_KEY) === '1';

export const parseExplorePinMapItemId = (searchParams: Pick<URLSearchParams, 'get'>): string | null =>
  searchParams.get(EXPLORE_PIN_QUERY_KEY)?.trim() || null;

/** Deep link from Profile wishlist or notifications → map peek. */
export const exploreSavedPinPath = (mapItemId: string): string =>
  explorePath({ pin: mapItemId, panel: 'activities', list: true });

/** Map `pin` id — `availability:` fixed slot preferred; else published activity when present. */
export const resolveCrewExploreMapItemId = (input: {
  availabilityMapItemId?: string | null;
  activityId?: string | null;
}): string | null =>
  resolveSeekingExploreMapItemId({
    intentId: '',
    activityId: input.activityId ?? null,
    availabilityMapItemId: input.availabilityMapItemId ?? null,
  });

export const exploreCrewMapPinPath = (input: {
  availabilityMapItemId?: string | null;
  activityId?: string | null;
}): string => {
  const pin = resolveCrewExploreMapItemId(input);
  if (pin?.startsWith('availability:')) return exploreAvailabilityMapItemPath(pin);
  return pin ? exploreSavedPinPath(pin) : explorePath({ list: true, panel: 'activities' });
};

/** Share link for map items — opens explore peek (guests and members). */
export const exploreMapItemSharePath = (mapItemId: string): string =>
  explorePath({ pin: mapItemId.trim() });

/** Prefill the hosting wizard from a prior outing (new id on publish). */
export const HOST_FROM_ACTIVITY_QUERY_KEY = 'hostFrom';

export const parseHostFromActivityId = (
  searchParams: Pick<URLSearchParams, 'get'>
): string | null => searchParams.get(HOST_FROM_ACTIVITY_QUERY_KEY)?.trim() || null;

export const clearHostFromActivityParams = (params: URLSearchParams): void => {
  params.delete(HOST_FROM_ACTIVITY_QUERY_KEY);
};

/** Prefill Add → Facility with `parentPlaceId` (trail / camp catalog row). */
export const FACILITY_ON_PLACE_QUERY_KEY = 'facilityOnPlace';

export const parseFacilityOnPlaceId = (
  searchParams: Pick<URLSearchParams, 'get'>
): string | null => searchParams.get(FACILITY_ON_PLACE_QUERY_KEY)?.trim() || null;

export const clearFacilityOnPlaceParams = (params: URLSearchParams): void => {
  params.delete(FACILITY_ON_PLACE_QUERY_KEY);
};

/** Deep link: add toilet / water / … along a trail (`parentPlaceId` on submit). */
export const exploreAddFacilityOnPlacePath = (placeId: string, facilityKind = 'toilet'): string =>
  explorePath({
    compose: addFacilityCompose(facilityKind),
    facilityOnPlace: placeId,
    panel: 'venues',
    pinKind: 'places',
  });

/** Deep link: host again from a past outing via FAB wizard (not server duplicate). */
export const exploreHostFromActivityPath = (
  activityId: string,
  kind: HostComposeKind
): string =>
  explorePath({
    compose: hostCompose(kind),
    hostFrom: activityId,
  });

export const exploreHostFromActivityReturnPath = (
  activityId: string,
  currentSearch: URLSearchParams,
  pathname: string = EXPLORE_MAP_PATH
): string => {
  const params = new URLSearchParams(currentSearch);
  params.set(HOST_FROM_ACTIVITY_QUERY_KEY, activityId);
  if (!params.has('list')) params.set('list', '1');
  return `${pathname}?${params.toString()}`;
};

export const parseMapFilter = (value: string | null): MapFilterKey => {
  if (value && MAP_FILTERS.has(value as MapFilterKey)) return value as MapFilterKey;
  if (value && INBOUND_MAP_FILTER[value]) return INBOUND_MAP_FILTER[value];
  return 'all';
};

export {
  parseExploreActivityDatePreset,
  exploreActivityDatePresetLabel,
  serializeExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from './exploreActivityDateFilter';

export const formatExploreActivityDateLabel = (iso: string): string =>
  formatExploreEventDateLabel(iso) ?? iso;

export const parseActivityListFilter = (
  activityParam: string | null,
  inboundFilterParam: string | null = null
): ActivityListFilterKey => {
  if (activityParam && ACTIVITY_LIST_FILTER_SET.has(activityParam as ActivityListFilterKey)) {
    return activityParam as ActivityListFilterKey;
  }
  if (inboundFilterParam && INBOUND_ACTIVITY_FROM_FILTER[inboundFilterParam]) {
    return INBOUND_ACTIVITY_FROM_FILTER[inboundFilterParam];
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

const inferMapFilterFromLegacySubfilter = (raw: string | null): MapFilterKey | null => {
  if (!raw || raw === 'all') return null;
  if (raw === 'event' || raw === 'events') return 'others';
  if (raw === 'shop' || raw === 'shops') return 'shops';
  const parsed = parseMapFilter(raw);
  return parsed === 'all' ? null : parsed;
};

/**
 * Canonical explore browse query is parent (`panel`) + subfilter (`filter`).
 * Strips duplicate `places` / `activity` keys; promotes them to `filter` when missing.
 */
export const compactExploreParentFilterSearchParams = (params: URLSearchParams): boolean => {
  const places = params.get('places');
  const activity = params.get('activity');
  if (places == null && activity == null) return false;

  if (!params.get('filter')) {
    const panel = parseExplorePanel(params.get('panel'));
    const preferred =
      panel === 'venues' || panel === 'shops' ? places ?? activity : activity ?? places;
    const inferred = inferMapFilterFromLegacySubfilter(preferred);
    if (inferred) params.set('filter', inferred);
  }

  params.delete('places');
  params.delete('activity');
  return true;
};

/** Parse venue state/emirate filters from URL (`regions=Dubai,RAK` or inbound `region=RAK`). */
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
  /** Open visual discover browse (`browse=1`) — poster feed, not map-aligned list. */
  browse?: boolean;
  /** @deprecated Prefer `regions` for multi-select venue filters. */
  region?: string;
  /** Selected venue states/emirates (multi-select). */
  regions?: string[];
  /** Compose menu or wizard route (`menu`, `host.hiking` wire, …). */
  compose?: ExploreCompose | 'menu';
  q?: string;
  /** Scheduled activity day on the map (`YYYY-MM-DD`). */
  date?: string | null;
  /** Drill-down within `filter=others` on Activities (events vs activities). */
  subtype?: ExploreBuddySubtypeKey;
  /** Drill-down within `filter=others` + `subtype=activities` (climb, run, …). */
  outingTopic?: ExploreOutingTopicKey;
  /** Explore map item id to open on load (`activity:…`, `venue:…`). */
  pin?: string;
  /** Prefill hosting wizard from an existing activity id (creates a new activity on publish). */
  hostFrom?: string;
  /** Limit pins to signed-in member activities + wishlist (requires auth). */
  myPlan?: boolean;
  /** Open browse member people panel (`view=people`). */
  peopleBrowse?: boolean;
  /** @deprecated Use `peopleBrowse` — writes `view=people`. */
  social?: boolean;
  /** Prefill compose — buddy to plan with (post-publish invite). */
  planWith?: string;
  /** Activity join-invite deep link — use with `pin=activity:{id}`. */
  joinInvite?: boolean;
  /** Curated area slug — constrains map/list rows (`exploreAreaQueryParam`). */
  area?: string;
  /** Map pin-kind row (`activities` | `locations` | `places` | `shops`). */
  pinKind?: ExplorePinKindFilter;
  /** Prefill facility add wizard — links amenity to this place catalog id. */
  facilityOnPlace?: string;
}): string => {
  const params = new URLSearchParams();
  if (options?.filter && options.filter !== 'all') {
    params.set('filter', options.filter);
  } else if (options?.activity && options.activity !== 'all') {
    const mapped = activityFilterToMapFilter(options.activity);
    if (mapped && mapped !== 'all') params.set('filter', mapped);
  }
  if (options?.panel && options.panel !== 'activities') {
    params.set('panel', options.panel);
  }
  if (options?.browse) {
    params.set('browse', '1');
  } else if (options?.list) {
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
  if (options?.hostFrom?.trim()) {
    params.set(HOST_FROM_ACTIVITY_QUERY_KEY, options.hostFrom.trim());
  }
  if (options?.facilityOnPlace?.trim()) {
    params.set(FACILITY_ON_PLACE_QUERY_KEY, options.facilityOnPlace.trim());
  }
  if (options?.myPlan) {
    params.set(MY_PLAN_MAP_QUERY_KEY, '1');
  }
  if (options?.peopleBrowse || options?.social) {
    params.set('view', 'people');
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
  if (options?.area?.trim()) {
    params.set(exploreAreaQueryParam, options.area.trim().toLowerCase());
  }
  if (options?.pinKind) {
    const serializedPinKind = serializeExplorePinKindFilter(options.pinKind);
    if (serializedPinKind) params.set('pinKind', serializedPinKind);
    else params.delete('pinKind');
  }
  const qs = params.toString();
  return qs ? `${EXPLORE_MAP_PATH}?${qs}` : EXPLORE_MAP_PATH;
};

/** Explore map with member people browse panel open. */
export const explorePeopleBrowsePath = (options?: { list?: boolean }): string =>
  explorePath({ peopleBrowse: true, list: options?.list ?? true });

/** Full-screen list explorer. */
export const exploreDiscoverBrowsePath = (): string => LIST_DISCOVERY_PATH;

/** Start create flow with optional buddy to plan with. */
export const explorePlanWithBuddyPath = (
  buddyUserId: string,
  mode: 'host' | 'availability'
): string =>
  explorePath({
    list: true,
    planWith: buddyUserId,
    compose:
      mode === 'host'
        ? hostCompose('activity')
        : { surface: 'menu', intent: 'availability' },
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
    case 'facilities':
      return 'facilities';
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
    case 'facilities':
      return 'facilities';
    case 'shop':
      return 'shops';
    case 'event':
      return 'others';
    default:
      return undefined;
  }
};

/** Parse venue catalog filter. Canonical URL uses `?filter=`; `?places=` is inbound-only. */
export const parseVenueListFilter = (
  placesParam: string | null,
  inboundFilterParam: string | null = null,
  /** Inbound-only `?activity=` — same camping/hiking key as parent `?filter=`. */
  activityParam: string | null = null
): VenueListFilterKey => {
  if (placesParam === 'shops') return 'shop';
  if (placesParam && VENUE_LIST_FILTER_SET.has(placesParam as VenueListFilterKey)) {
    return placesParam as VenueListFilterKey;
  }
  if (inboundFilterParam) {
    const parsed = parseMapFilter(inboundFilterParam);
    if (parsed !== 'others' && parsed !== 'rideshare' && parsed !== 'all') {
      return mapFilterToVenueListFilter(parsed);
    }
  }
  if (activityParam === 'shops' || activityParam === 'shop') return 'shop';
  if (activityParam && VENUE_LIST_FILTER_SET.has(activityParam as VenueListFilterKey)) {
    return activityParam as VenueListFilterKey;
  }
  return 'all';
};

export const serializeVenueListFilter = (filter: VenueListFilterKey): string | null => {
  if (filter === 'all') return null;
  if (filter === 'shop') return 'shops';
  return filter;
};

/** Gear shops on the explore map (inbound `/shop` browse → explore shops panel). */
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
  tab === 'hosted' ? planHostedSchedulePath() : PLAN_PATH;

/** Consumer create flow — explore compose organize menu or a specific kind. */
export const exploreHostPath = (kind?: HostComposeKind): string =>
  kind
    ? explorePath({ compose: hostCompose(kind) })
    : explorePath({ compose: { surface: 'menu', intent: 'host' } });

/** Host with publish access — prefill rideshare organize from a map pin (`availability:` or `activity:`). */
export const exploreOfferRideshareForAvailabilityPath = (
  mapItemId: string | null | undefined
): string => {
  const pin = mapItemId?.trim() || null;
  return explorePath({
    ...(pin ? { pin } : {}),
    compose: hostCompose('rideshare'),
  });
};

/** Map inbound `/activities?create=` values onto explore compose organize routes. */
export const inboundCreateParamToHostPath = (createParam: string | null): string | null => {
  if (!createParam) return null;
  if (createParam === 'hiking' || createParam === 'camping' || createParam === 'event') {
    return exploreHostPath(createParam);
  }
  if (
    createParam === 'community_activity' ||
    createParam === 'COMMUNITY_ACTIVITY' ||
    createParam === 'EVENT'
  ) {
    return exploreHostPath('event');
  }
  if (createParam === 'activity') {
    return exploreHostPath('activity');
  }
  if (
    createParam === 'rideshare' ||
    createParam === 'RIDESHARE' ||
    createParam === 'carpool' ||
    createParam === 'CARPOOL'
  ) {
    return exploreHostPath('rideshare');
  }
  return null;
};

/** Map inbound discovery query params onto explore search params. */
export const discoveryToExploreSearch = (search: string): string => {
  const incoming = new URLSearchParams(search);
  const next = new URLSearchParams();
  next.set('panel', 'venues');

  const activity = incoming.get('activity') ?? incoming.get('filter');
  if (activity === 'hiking' || activity === 'camping') {
    next.set('filter', activity);
  } else if (activity === 'event' || activity === 'events' || activity === 'others') {
    next.set('filter', 'others');
  }

  const region = incoming.get('region');
  if (region) next.set('region', region);

  const q = incoming.get('q');
  if (q) next.set('q', q);

  return next.toString();
};
