import { EXPLORE_MAP_PATH } from '../config/platform';
import type { ContributeVenueKind } from '../components/explore/MobileContributeTypeSheet';

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

export const explorePath = (options?: {
  filter?: MapFilterKey;
  activity?: ActivityListFilterKey;
  panel?: ExplorePanel;
  list?: boolean;
  region?: string;
  addLocation?: boolean;
  compose?: boolean;
  /** Open contribute type sheet (`true`) or a specific contribute wizard step. */
  contribute?: boolean | ContributeVenueKind;
  /** Open the “I want to go” request wizard. */
  request?: boolean;
  /** Re-open a demand pin and continue “Host this trip” after auth/onboarding. */
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
  if (options?.region) {
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
  if (options?.hostDemand) {
    params.set('hostDemand', options.hostDemand);
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
  explorePath({ panel: 'shops', list: true, filter: 'shops' });

/** Places (trails, camps, events) on the explore map — URL panel stays `venues`. */
export const explorePlacesPath = (options?: {
  region?: string;
  addLocation?: boolean;
  q?: string;
}): string => explorePath({ panel: 'venues', list: true, ...options });

/** @deprecated Use explorePlacesPath */
export const exploreVenuesPath = explorePlacesPath;

/** @deprecated Use explorePlacesPath */
export const exploreLocationsPath = explorePlacesPath;

/** Map legacy discovery query params onto explore search params. */
export const discoveryToExploreSearch = (search: string): string => {
  const incoming = new URLSearchParams(search);
  const next = new URLSearchParams();
  next.set('panel', 'venues');
  next.set('list', '1');

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
