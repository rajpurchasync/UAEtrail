/**
 * Explore list/map URL params — no compose or list imports (safe for `discoveryRuntime`).
 */

export type ExplorePanel = 'activities' | 'venues' | 'shops';

/** Map overlay filter — controls which pins appear on the map. */
export type MapFilterKey = 'all' | 'hiking' | 'camping' | 'facilities' | 'rideshare' | 'others' | 'shops';

const MAP_FILTERS = new Set<MapFilterKey>([
  'all',
  'hiking',
  'camping',
  'facilities',
  'rideshare',
  'others',
  'shops',
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

const EXPLORE_PANELS = new Set<ExplorePanel>(['activities', 'venues', 'shops']);

const EXPLORE_PANEL_ALIASES: Record<string, ExplorePanel> = {
  locations: 'venues',
};

export const parseMapFilter = (value: string | null): MapFilterKey => {
  if (value && MAP_FILTERS.has(value as MapFilterKey)) return value as MapFilterKey;
  if (value && INBOUND_MAP_FILTER[value]) return INBOUND_MAP_FILTER[value];
  return 'all';
};

export const parseExplorePanel = (value: string | null): ExplorePanel => {
  if (value && EXPLORE_PANELS.has(value as ExplorePanel)) return value as ExplorePanel;
  if (value && EXPLORE_PANEL_ALIASES[value]) return EXPLORE_PANEL_ALIASES[value];
  return 'activities';
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