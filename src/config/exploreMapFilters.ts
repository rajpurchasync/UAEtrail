import type { MapFilterKey } from '../config/routingCatalog';

export const MAP_FILTER_PILLS: ReadonlyArray<{ key: MapFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'rideshare', label: 'Rideshare' },
  { key: 'others', label: 'Others' },
  { key: 'shops', label: 'Shops' },
];

/** Places browse/map pills — trails, camp spots, shops (not outings or event venues). */
export const PLACES_MAP_FILTER_LABELS: Partial<Record<MapFilterKey, string>> = {
  all: 'All',
  hiking: 'Trails',
  camping: 'Spots',
  shops: 'Shops',
};

export const placesMapFilterLabel = (filter: MapFilterKey): string =>
  PLACES_MAP_FILTER_LABELS[filter] ?? 'All';

export const mapFilterLabel = (filter: MapFilterKey): string =>
  MAP_FILTER_PILLS.find((pill) => pill.key === filter)?.label ?? 'All';
