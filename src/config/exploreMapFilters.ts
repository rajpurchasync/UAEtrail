import type { MapFilterKey } from '../utils/exploreRouting';

export const MAP_FILTER_PILLS: ReadonlyArray<{ key: MapFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'carpool', label: 'Rideshare' },
  { key: 'others', label: 'Others' },
  { key: 'shops', label: 'Shops' },
];

/** Mobile map chrome — primary row; rest live in “More” sheet. */
export const MOBILE_PRIMARY_MAP_FILTER_KEYS: readonly MapFilterKey[] = ['all', 'hiking', 'camping'];

export const MOBILE_MORE_MAP_FILTER_KEYS: readonly MapFilterKey[] = ['carpool', 'others', 'shops'];

export const mapFilterLabel = (filter: MapFilterKey): string =>
  MAP_FILTER_PILLS.find((pill) => pill.key === filter)?.label ?? 'All';

export const isMobileMoreMapFilter = (filter: MapFilterKey): boolean =>
  MOBILE_MORE_MAP_FILTER_KEYS.includes(filter);
