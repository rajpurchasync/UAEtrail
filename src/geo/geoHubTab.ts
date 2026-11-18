import { AREA_DETAIL_TAB_QUERY } from '../area/areaDetailTab';

export const GEO_HUB_TAB_QUERY = AREA_DETAIL_TAB_QUERY;

export const GEO_HUB_TABS = ['overview', 'places', 'facilities', 'explore'] as const;
export type GeoHubTabId = (typeof GEO_HUB_TABS)[number];

export const GEO_HUB_TAB_LABELS: Record<GeoHubTabId, string> = {
  overview: 'Overview',
  places: 'Places',
  facilities: 'Facilities',
  explore: 'Explore',
};

/** `?tab=` on geo hubs. Legacy `activities` maps to Explore. */
export const parseGeoHubTabParam = (value: string | null | undefined): GeoHubTabId => {
  if (value === 'places' || value === 'facilities' || value === 'explore') return value;
  if (value === 'activities') return 'explore';
  return 'overview';
};

export const geoHubTabsForNode = (input: {
  childCount: number;
  facilityCount: number;
}): readonly GeoHubTabId[] => {
  const tabs: GeoHubTabId[] = ['overview'];
  if (input.childCount > 0) tabs.push('places');
  if (input.facilityCount > 0) tabs.push('facilities');
  tabs.push('explore');
  return tabs;
};

export const geoHubTabsForChildren = (childCount: number): readonly GeoHubTabId[] =>
  geoHubTabsForNode({ childCount, facilityCount: 0 });
