import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { MapFilterKey } from './routing';

/** Drill-down within Activities map filter `others` (outing family). */
export type ExploreOthersSubtypeKey = 'all' | 'events' | 'activities';

const OTHERS_SUBTYPE_KEYS = new Set<ExploreOthersSubtypeKey>(['all', 'events', 'activities']);

export const parseExploreOthersSubtype = (
  value: string | null,
  mapFilter: MapFilterKey
): ExploreOthersSubtypeKey => {
  if (mapFilter !== 'others') return 'all';
  if (value && OTHERS_SUBTYPE_KEYS.has(value as ExploreOthersSubtypeKey) && value !== 'all') {
    return value as ExploreOthersSubtypeKey;
  }
  return 'all';
};

export const serializeExploreOthersSubtype = (
  subtype: ExploreOthersSubtypeKey,
  mapFilter: MapFilterKey
): string | null => {
  if (mapFilter !== 'others' || subtype === 'all') return null;
  return subtype;
};

export const OTHERS_SUBTYPE_PILLS: ReadonlyArray<{ key: ExploreOthersSubtypeKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'events', label: 'Events' },
  { key: 'activities', label: 'Activities' },
];

const resolveOthersMapCategory = (item: ExploreMapItemDTO): 'events' | 'activities' | null => {
  if (item.outingCategory === 'events' || item.outingCategory === 'activities') {
    return item.outingCategory;
  }
  if (item.kind === 'event') return 'events';
  if (item.activity?.activityType === 'event') return 'events';
  return null;
};

export const isOthersMapCategoryItem = (item: ExploreMapItemDTO): boolean =>
  resolveOthersMapCategory(item) != null;

export const matchesOthersMapSubtype = (
  item: ExploreMapItemDTO,
  subtype: ExploreOthersSubtypeKey
): boolean => {
  const category = resolveOthersMapCategory(item);
  if (!category) return false;
  if (subtype === 'all') return true;
  return category === subtype;
};