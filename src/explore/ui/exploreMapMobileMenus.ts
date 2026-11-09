import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';

export type ExploreMobileActivityMenuKey =
  | 'all'
  | 'anyday'
  | 'hiking'
  | 'camping'
  | 'rideshare'
  | 'others';

export type ExploreMobilePlacesMenuKey =
  | 'all'
  | 'uae'
  | 'hiking'
  | 'camping'
  | 'facilities'
  | 'shops'
  | 'others';

export const EXPLORE_MOBILE_ACTIVITY_MENU: ReadonlyArray<{
  key: ExploreMobileActivityMenuKey;
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'anyday', label: 'Anyday' },
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'rideshare', label: 'Rideshare' },
  { key: 'others', label: 'Other' },
];

export const EXPLORE_MOBILE_PLACES_MENU: ReadonlyArray<{
  key: ExploreMobilePlacesMenuKey;
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'hiking', label: 'Trail' },
  { key: 'camping', label: 'Camping' },
  { key: 'facilities', label: 'Facilities' },
  { key: 'shops', label: 'Shopping' },
  { key: 'others', label: 'Other' },
  { key: 'uae', label: 'UAE' },
];

/** Mobile map quick filter row (no “All”). */
export const EXPLORE_MOBILE_ACTIVITY_QUICK_FILTERS: readonly ExploreMobileActivityMenuKey[] = [
  'hiking',
  'camping',
  'rideshare',
  'others',
];

export const EXPLORE_MOBILE_PLACES_QUICK_FILTERS: readonly ExploreMobilePlacesMenuKey[] = [
  'hiking',
  'camping',
  'facilities',
  'shops',
];

/** Same `mapFilter` axis as list panel + desktop browse (Activities / Places tabs). */
export const mobileActivityMenuToMapFilter = (
  key: ExploreMobileActivityMenuKey
): MapFilterKey | null => {
  if (key === 'anyday') return null;
  return key;
};

export const mobilePlacesMenuToMapFilter = (
  key: ExploreMobilePlacesMenuKey
): MapFilterKey | null => {
  switch (key) {
    case 'all':
      return 'all';
    case 'hiking':
      return 'hiking';
    case 'camping':
      return 'camping';
    case 'facilities':
      return 'facilities';
    case 'shops':
      return 'shops';
    case 'others':
      return 'others';
    case 'uae':
      return null;
    default:
      return 'all';
  }
};

export const inferMobilePlacesMenuKey = (
  mapFilter: MapFilterKey,
  venueFilter: VenueListFilterKey
): ExploreMobilePlacesMenuKey => {
  if (venueFilter === 'facilities' || mapFilter === 'facilities') return 'facilities';
  if (venueFilter === 'event' || mapFilter === 'others') return 'others';
  if (mapFilter === 'hiking' || venueFilter === 'hiking') return 'hiking';
  if (mapFilter === 'shops' || venueFilter === 'shop') return 'shops';
  if (mapFilter === 'camping' || venueFilter === 'camping') return 'camping';
  return 'all';
};

export const mobilePlacesMenuToVenueFilter = (
  key: ExploreMobilePlacesMenuKey
): VenueListFilterKey | null => {
  switch (key) {
    case 'all':
      return 'all';
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
    case 'uae':
      return null;
    default:
      return 'all';
  }
};

export const mapFilterToMobileActivityMenu = (filter: MapFilterKey): ExploreMobileActivityMenuKey => {
  if (filter === 'hiking' || filter === 'camping' || filter === 'rideshare' || filter === 'others') {
    return filter;
  }
  return 'all';
};

export const browsePanelForMobileLayer = (layer: 'activity' | 'places'): ExplorePanel =>
  layer === 'places' ? 'venues' : 'activities';

/** Mobile map chrome — which pill row is expanded on first paint (matches browse panel). */
export const defaultMobileMapExpandedLayer = (
  panel: ExplorePanel
): 'activity' | 'places' | null => {
  if (panel === 'venues' || panel === 'shops') return 'places';
  return 'activity';
};
