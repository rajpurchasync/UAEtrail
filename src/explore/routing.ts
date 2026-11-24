import {
  exploreDestinationQueryParam,
  exploreAvailabilityMapItemPath,
  formatExploreEventDateLabel,
  resolveCrewExploreMapItemId as resolveCrewExploreMapItemIdFromWire,
} from '@uaetrail/shared-types';
import type { HostComposeKind } from './compose';
import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from '../config/platform';
import { PLAN_PATH } from '../constants';
import { planHostedSchedulePath } from '../plan/planRouting';
import {
  placeFacilityCompose,
  formatComposeQuery,
  activityCompose,
  type ExploreCompose,
} from './compose';
import {
  parseExploreActivityDatePreset,
  serializeExploreActivityDatePreset,
  serializeExploreMapActivityDatePreset,
} from './exploreActivityDateFilter';
import { serializeExplorePinKindFilter, type ExplorePinKindFilter } from './explorePinKindFilter';
import {
  serializeExploreOthersSubtype,
  type ExploreOthersSubtypeKey,
} from './exploreOthersSubtype';
import {
  serializeExploreOutingTopic,
  type ExploreOutingTopicKey,
} from './exploreOutingTopic';

export type { ExplorePanel, MapFilterKey } from './discoveryUrlParams';
import {
  parseExplorePanel,
  parseMapFilter,
  parseVenueRegionsParam,
  type ExplorePanel,
  type MapFilterKey,
} from './discoveryUrlParams';

export { parseExplorePanel, parseMapFilter, parseVenueRegionsParam };

/** Side-panel activity list filter. */
export type ActivityListFilterKey = 'all' | 'hiking' | 'camping' | 'event' | 'rideshare';

/** Side-panel venue list filter. */
export type VenueListFilterKey = 'all' | 'hiking' | 'camping' | 'facilities' | 'shop' | 'event';

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

const INBOUND_ACTIVITY_FROM_FILTER: Record<string, ActivityListFilterKey> = {
  hiking: 'hiking',
  camping: 'camping',
  event: 'event',
  events: 'event',
  others: 'event',
  carpool: 'rideshare',
};

/** Open a specific explore map item (peek card), e.g. `activity:uuid`. */
export const EXPLORE_PIN_QUERY_KEY = 'pin';
/** When `1`, activity peek shows join-invite banner (with `pin=activity:…`). */
export const EXPLORE_JOIN_INVITE_QUERY_KEY = 'invite';
/** Friend user id — prefill post-publish invite after Host an outing from Social. */
export const PLAN_WITH_QUERY_KEY = 'planWith';
/** Find crew — availability slot id for host compose prefill (`planWith` required). */
export const AVAILABILITY_SLOT_QUERY_KEY = 'availabilitySlot';

export const parseAvailabilitySlotId = (searchParams: Pick<URLSearchParams, 'get'>): string | null =>
  searchParams.get(AVAILABILITY_SLOT_QUERY_KEY)?.trim() || null;
/** When `1`, map/list show only the signed-in member's activities + wishlist pins. */
export const MY_PLAN_MAP_QUERY_KEY = 'myPlan';

export const parseExploreMyPlanMapMode = (searchParams: Pick<URLSearchParams, 'get'>): boolean =>
  searchParams.get(MY_PLAN_MAP_QUERY_KEY) === '1';

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
  resolveCrewExploreMapItemIdFromWire({
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
    compose: placeFacilityCompose(facilityKind),
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
    compose: activityCompose(kind),
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

export {
  EXPLORE_MAP_ACTIVITY_DATE_PRESET_OPTIONS,
  EXPLORE_MAP_DEFAULT_ACTIVITY_DATE_PRESET,
  parseExploreActivityDatePreset,
  resolveExploreMapActivityDatePreset,
  exploreActivityDatePresetLabel,
  serializeExploreActivityDatePreset,
  serializeExploreMapActivityDatePreset,
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

/**
 * Canonical explore browse query is parent (`panel`) + subfilter (`filter`) only.
 * Drops duplicate `places` / `activity` keys (do not read or promote).
 */
export const compactExploreParentFilterSearchParams = (params: URLSearchParams): boolean => {
  const places = params.get('places');
  const activity = params.get('activity');
  if (places == null && activity == null) return false;
  params.delete('places');
  params.delete('activity');
  return true;
};

export const explorePath = (options?: {
  filter?: MapFilterKey;
  activity?: ActivityListFilterKey;
  panel?: ExplorePanel;
  list?: boolean;
  /** Open visual discover browse (`browse=1`) — poster feed, not map-aligned list. */
  browse?: boolean;
  /** Selected venue states/emirates (multi-select). */
  regions?: string[];
  /** Compose menu or wizard route (`menu`, `activity:hiking` wire, …). */
  compose?: ExploreCompose | 'menu';
  q?: string;
  /** Scheduled activity day on the map (`YYYY-MM-DD`). */
  date?: string | null;
  /** Drill-down within `filter=others` on Activities (events vs activities). */
  subtype?: ExploreOthersSubtypeKey;
  /** Drill-down within `filter=others` + `subtype=activities` (climb, run, …). */
  outingTopic?: ExploreOutingTopicKey;
  /** Explore map item id to open on load (`activity:…`, `venue:…`). */
  pin?: string;
  /** Prefill hosting wizard from an existing activity id (creates a new activity on publish). */
  hostFrom?: string;
  /** Limit pins to signed-in member activities + wishlist (requires auth). */
  myPlan?: boolean;
  /** Open **Crews** browse panel (`view=people` wire). */
  crews?: boolean;
  /** Prefill compose — friend to plan with (post-publish invite). */
  planWith?: string;
  /** Activity join-invite deep link — use with `pin=activity:{id}`. */
  joinInvite?: boolean;
  /** Curated destination slug — constrains map/list rows (`exploreDestinationQueryParam`). */
  destination?: string;
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
    const serialized = serializeExploreMapActivityDatePreset(preset);
    if (serialized) params.set('date', serialized);
    else params.delete('date');
  }
  const filterKey = (options?.filter ?? 'all') as MapFilterKey;
  const othersSubtype = options?.subtype ?? 'all';
  const serializedSubtype = options?.subtype
    ? serializeExploreOthersSubtype(options.subtype, filterKey)
    : null;
  if (serializedSubtype) params.set('subtype', serializedSubtype);
  const serializedTopic = options?.outingTopic
    ? serializeExploreOutingTopic(options.outingTopic, filterKey, othersSubtype)
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
  if (options?.crews) {
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
  if (options?.destination?.trim()) {
    params.set(exploreDestinationQueryParam, options.destination.trim().toLowerCase());
  }
  if (options?.pinKind) {
    const serializedPinKind = serializeExplorePinKindFilter(options.pinKind);
    if (serializedPinKind) params.set('pinKind', serializedPinKind);
    else params.delete('pinKind');
  }
  const qs = params.toString();
  return qs ? `${EXPLORE_MAP_PATH}?${qs}` : EXPLORE_MAP_PATH;
};

/** Desktop crews list drawer on explore (list-first — no docked `view=people` rail). */
export const exploreCrewsListDrawerPath = (): string => {
  const params = new URLSearchParams();
  params.set('list', '1');
  params.set('listCat', 'people');
  return `${EXPLORE_MAP_PATH}?${params.toString()}`;
};

/** Explore map crews — prefers list drawer; legacy `view=people` when `list: false`. */
export const exploreCrewsPath = (options?: { list?: boolean }): string =>
  options?.list === false
    ? explorePath({ crews: true, list: false })
    : exploreCrewsListDrawerPath();

/** Full-screen list explorer. */
export const exploreDiscoverBrowsePath = (): string => LIST_DISCOVERY_PATH;

/** Start create flow with optional friend to plan with. */
export const explorePlanWithFriendPath = (
  actorUserId: string,
  mode: 'host' | 'availability'
): string =>
  explorePath({
    list: true,
    planWith: actorUserId,
    compose:
      mode === 'host'
        ? activityCompose('activity')
        : { surface: 'menu', composeKind: 'intent' },
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
  regions?: string[];
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
    ? explorePath({ compose: activityCompose(kind) })
    : explorePath({ compose: { surface: 'menu', composeKind: 'activity' } });

/** Host with publish access — prefill rideshare organize from a map pin (`availability:` or `activity:`). */
export const exploreOfferRideshareForAvailabilityPath = (
  mapItemId: string | null | undefined
): string => {
  const pin = mapItemId?.trim() || null;
  return explorePath({
    ...(pin ? { pin } : {}),
    compose: activityCompose('rideshare'),
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
  const regions = incoming.get('regions');
  if (regions) next.set('regions', regions);
  else if (region) next.set('regions', region);

  const q = incoming.get('q');
  if (q) next.set('q', q);

  return next.toString();
};
