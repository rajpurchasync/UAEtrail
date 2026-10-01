import type { ExplorePanel, MapFilterKey } from '../routing';

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
  | 'trails'
  | 'spots'
  | 'shops'
  | 'camping'
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
  { key: 'others', label: 'Others' },
];

export const EXPLORE_MOBILE_PLACES_MENU: ReadonlyArray<{
  key: ExploreMobilePlacesMenuKey;
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'uae', label: 'UAE' },
  { key: 'trails', label: 'Trails' },
  { key: 'spots', label: 'Spots' },
  { key: 'shops', label: 'Shops' },
  { key: 'camping', label: 'Camping' },
  { key: 'others', label: 'Others' },
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
    case 'trails':
      return 'hiking';
    case 'spots':
    case 'camping':
      return 'camping';
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

export const mapFilterToMobilePlacesMenu = (filter: MapFilterKey): ExploreMobilePlacesMenuKey => {
  if (filter === 'hiking') return 'trails';
  if (filter === 'camping') return 'spots';
  if (filter === 'shops') return 'shops';
  if (filter === 'others') return 'others';
  return 'all';
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
