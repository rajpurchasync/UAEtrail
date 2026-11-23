import type { TripMapTopicKey } from '../../explore/discoveryRuntime';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

/** Trip topic row — same axis as explore map `tripTypes=` (hiking · camping · rideshare). */
export const BROWSE_TRIP_TOPIC_FILTERS: ReadonlyArray<{ key: TripMapTopicKey; label: string }> = [
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'rideshare', label: 'Rideshare' },
  { key: 'others', label: 'Others' },
];

export type BrowseTripTopicKey = (typeof BROWSE_TRIP_TOPIC_FILTERS)[number]['key'];

export const isBrowseTripTopicKey = (key: string): key is BrowseTripTopicKey =>
  BROWSE_TRIP_TOPIC_FILTERS.some((t) => t.key === key);

export const browseTripTopicIsActive = (
  tripTopics: readonly BrowseTripTopicKey[],
  key: BrowseTripTopicKey
): boolean => tripTopics.includes(key);

/** Multi-select topic pills — empty list means all trip types. */
export const toggleBrowseTripTopicInList = (
  selected: readonly BrowseTripTopicKey[],
  key: BrowseTripTopicKey
): BrowseTripTopicKey[] => {
  const set = new Set(selected);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  return BROWSE_TRIP_TOPIC_FILTERS.map((t) => t.key).filter((k) => set.has(k));
};

export const browseListShowsTripTopicRow = (categories: readonly BrowseMainCategoryKey[]): boolean =>
  categories.length === 0 || categories.includes('activities');
