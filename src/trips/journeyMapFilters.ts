import type { JourneyMapEntryDTO, JourneyMapFilterCategory } from '@uaetrail/shared-types';

export const JOURNEY_MAP_FILTERS: { id: JourneyMapFilterCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'wishlist', label: 'Want to go' },
  { id: 'joined', label: 'Joined' },
  { id: 'hosted', label: 'Hosted' },
  { id: 'self', label: 'Gone' },
];

export const parseJourneyMapFilter = (raw: string | null): JourneyMapFilterCategory => {
  const id = raw?.toLowerCase();
  if (id === 'gone' || id === 'been') return 'self';
  if (id === 'want' || id === 'want_to_go') return 'wishlist';
  if (id && JOURNEY_MAP_FILTERS.some((f) => f.id === id)) return id as JourneyMapFilterCategory;
  return 'all';
};

export const filterJourneyMapEntries = (
  entries: JourneyMapEntryDTO[],
  filter: JourneyMapFilterCategory
): JourneyMapEntryDTO[] => {
  if (filter === 'all') return entries;
  return entries.filter((e) => e.categories.includes(filter));
};

export const countJourneyMapEntries = (
  entries: JourneyMapEntryDTO[],
  filter: JourneyMapFilterCategory
): number => filterJourneyMapEntries(entries, filter).length;

export const mappableJourneyMapEntries = (entries: JourneyMapEntryDTO[]): JourneyMapEntryDTO[] =>
  entries.filter((e) => e.latitude != null && e.longitude != null);
