import type { OutdoorMapEntryDTO, OutdoorMapFilterCategory } from '@uaetrail/shared-types';

export const OUTDOOR_MAP_FILTERS: { id: OutdoorMapFilterCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'wishlist', label: 'Want to go' },
  { id: 'joined', label: 'Joined' },
  { id: 'hosted', label: 'Hosted' },
  { id: 'self', label: 'Gone' },
];

export const parseOutdoorMapFilter = (raw: string | null): OutdoorMapFilterCategory => {
  const id = raw?.toLowerCase();
  if (id === 'gone' || id === 'been') return 'self';
  if (id === 'want' || id === 'want_to_go') return 'wishlist';
  if (id && OUTDOOR_MAP_FILTERS.some((f) => f.id === id)) return id as OutdoorMapFilterCategory;
  return 'all';
};

export const filterOutdoorEntries = (
  entries: OutdoorMapEntryDTO[],
  filter: OutdoorMapFilterCategory
): OutdoorMapEntryDTO[] => {
  if (filter === 'all') return entries;
  return entries.filter((e) => e.categories.includes(filter));
};

export const countOutdoorEntries = (
  entries: OutdoorMapEntryDTO[],
  filter: OutdoorMapFilterCategory
): number => filterOutdoorEntries(entries, filter).length;

export const mappableOutdoorEntries = (entries: OutdoorMapEntryDTO[]): OutdoorMapEntryDTO[] =>
  entries.filter((e) => e.latitude != null && e.longitude != null);
