import { AREA_DETAIL_TAB_QUERY } from '../area/areaDetailTab';

export const GEO_HUB_TAB_QUERY = AREA_DETAIL_TAB_QUERY;

export const GEO_HUB_TABS = ['overview', 'places', 'explore'] as const;
export type GeoHubTabId = (typeof GEO_HUB_TABS)[number];

export const GEO_HUB_TAB_LABELS: Record<GeoHubTabId, string> = {
  overview: 'Overview',
  places: 'Places',
  explore: 'Explore',
};

/** `?tab=` on geo hubs. Legacy `activities` maps to Explore. */
export const parseGeoHubTabParam = (value: string | null | undefined): GeoHubTabId => {
  if (value === 'places' || value === 'explore') return value;
  if (value === 'activities') return 'explore';
  return 'overview';
};

export const geoHubTabsForChildren = (childCount: number): readonly GeoHubTabId[] =>
  childCount > 0 ? GEO_HUB_TABS : GEO_HUB_TABS.filter((id) => id !== 'places');
