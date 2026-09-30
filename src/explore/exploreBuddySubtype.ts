import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { MapFilterKey } from './routing';

/** Drill-down within Activities map filter `others` (outing family). */
export type ExploreBuddySubtypeKey = 'all' | 'events' | 'activities';

const BUDDY_SUBTYPE_KEYS = new Set<ExploreBuddySubtypeKey>(['all', 'events', 'activities']);

export const parseExploreBuddySubtype = (
  value: string | null,
  mapFilter: MapFilterKey
): ExploreBuddySubtypeKey => {
  if (mapFilter !== 'others') return 'all';
  if (value && BUDDY_SUBTYPE_KEYS.has(value as ExploreBuddySubtypeKey) && value !== 'all') {
    return value as ExploreBuddySubtypeKey;
  }
  return 'all';
};

export const serializeExploreBuddySubtype = (
  subtype: ExploreBuddySubtypeKey,
  mapFilter: MapFilterKey
): string | null => {
  if (mapFilter !== 'others' || subtype === 'all') return null;
  return subtype;
};

export const BUDDY_SUBTYPE_PILLS: ReadonlyArray<{ key: ExploreBuddySubtypeKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'events', label: 'Events' },
  { key: 'activities', label: 'Activities' },
];

const resolveBuddyOthersCategory = (
  item: ExploreMapItemDTO
): 'events' | 'activities' | null => {
  if (item.outingCategory === 'events' || item.outingCategory === 'activities') {
    return item.outingCategory;
  }
  if (item.kind === 'event') return 'events';
  return null;
};

export const isBuddyOthersMapItem = (item: ExploreMapItemDTO): boolean =>
  resolveBuddyOthersCategory(item) != null;

export const matchesBuddyOthersSubtype = (
  item: ExploreMapItemDTO,
  subtype: ExploreBuddySubtypeKey
): boolean => {
  const category = resolveBuddyOthersCategory(item);
  if (!category) return false;
  if (subtype === 'all') return true;
  return category === subtype;
};
