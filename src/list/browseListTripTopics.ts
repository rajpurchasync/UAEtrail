import type { MapFilterKey } from '../config/routingCatalog';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

/** Trip topic row — same axis as explore map `filter=` (hiking · camping · rideshare). */
export const BROWSE_TRIP_TOPIC_FILTERS: ReadonlyArray<{ key: MapFilterKey; label: string }> = [
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'rideshare', label: 'Rideshare' },
  { key: 'others', label: 'Other' },
];

export type BrowseTripTopicKey = (typeof BROWSE_TRIP_TOPIC_FILTERS)[number]['key'];

export const isBrowseTripTopicKey = (key: string): key is BrowseTripTopicKey =>
  BROWSE_TRIP_TOPIC_FILTERS.some((t) => t.key === key);

/** Trips category type dropdown — topics plus demand-only “looking for”. */
export type BrowseTripPlanTypeKey = 'all' | BrowseTripTopicKey | 'looking';

export const BROWSE_TRIP_PLAN_TYPE_OPTIONS: ReadonlyArray<{
  key: BrowseTripPlanTypeKey;
  label: string;
  filterKey?: MapFilterKey | 'looking';
}> = [
  { key: 'all', label: 'All types' },
  { key: 'hiking', label: 'Hiking', filterKey: 'hiking' },
  { key: 'camping', label: 'Camping', filterKey: 'camping' },
  { key: 'rideshare', label: 'Rideshare', filterKey: 'rideshare' },
  { key: 'looking', label: 'Looking for', filterKey: 'looking' },
];

export const resolveBrowseTripPlanType = (
  tripTopics: readonly BrowseTripTopicKey[],
  tripLookingOnly: boolean
): BrowseTripPlanTypeKey => {
  if (tripLookingOnly) return 'looking';
  if (tripTopics.length === 1) return tripTopics[0];
  return 'all';
};

export const browseTripPlanTypeToState = (
  key: BrowseTripPlanTypeKey
): { tripTopics: BrowseTripTopicKey[]; tripLookingOnly: boolean } => {
  if (key === 'looking') return { tripTopics: [], tripLookingOnly: true };
  if (key === 'all') return { tripTopics: [], tripLookingOnly: false };
  return { tripTopics: [key], tripLookingOnly: false };
};

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
