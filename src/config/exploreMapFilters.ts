import type { MapFilterKey } from '../config/routingCatalog';

export const MAP_FILTER_PILLS: ReadonlyArray<{ key: MapFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'facilities', label: 'Facilities' },
  { key: 'shops', label: 'Shopping' },
  { key: 'rideshare', label: 'Rideshare' },
  { key: 'others', label: 'Other' },
];

/** Places browse/map pills — hiking, camping, amenities, shopping (not outings). */
export const PLACES_MAP_FILTER_LABELS: Partial<Record<MapFilterKey, string>> = {
  all: 'All',
  hiking: 'Trail',
  camping: 'Camping',
  facilities: 'Facilities',
  shops: 'Shopping',
  others: 'Other',
};

export const placesMapFilterLabel = (filter: MapFilterKey): string =>
  PLACES_MAP_FILTER_LABELS[filter] ?? 'All';

export const mapFilterLabel = (filter: MapFilterKey): string =>
  MAP_FILTER_PILLS.find((pill) => pill.key === filter)?.label ?? 'All';
