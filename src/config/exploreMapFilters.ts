import type { MapFilterKey } from '../utils/exploreRouting';

export const MAP_FILTER_PILLS: ReadonlyArray<{ key: MapFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'carpool', label: 'Rideshare' },
  { key: 'others', label: 'Activities' },
  { key: 'shops', label: 'Shops' },
];

export const mapFilterLabel = (filter: MapFilterKey): string =>
  MAP_FILTER_PILLS.find((pill) => pill.key === filter)?.label ?? 'All';
