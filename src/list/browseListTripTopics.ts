import type { MapFilterKey } from '../config/routingCatalog';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

/** Trip topic row — same axis as explore map `filter=` (hiking · camping · rideshare). */
export const BROWSE_TRIP_TOPIC_FILTERS: ReadonlyArray<{ key: MapFilterKey; label: string }> = [
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'rideshare', label: 'Rideshare' },
];

export type BrowseTripTopicKey = (typeof BROWSE_TRIP_TOPIC_FILTERS)[number]['key'];

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
  tripTopic: MapFilterKey,
  tripLookingOnly: boolean
): BrowseTripPlanTypeKey => {
  if (tripLookingOnly) return 'looking';
  if (tripTopic === 'hiking' || tripTopic === 'camping' || tripTopic === 'rideshare') return tripTopic;
  return 'all';
};

export const browseTripPlanTypeToState = (
  key: BrowseTripPlanTypeKey
): { tripTopic: MapFilterKey; tripLookingOnly: boolean } => {
  if (key === 'looking') return { tripTopic: 'all', tripLookingOnly: true };
  if (key === 'all') return { tripTopic: 'all', tripLookingOnly: false };
  return { tripTopic: key, tripLookingOnly: false };
};

export const browseTripTopicIsActive = (
  tripTopic: MapFilterKey,
  key: BrowseTripTopicKey
): boolean => tripTopic === key;

export const toggleBrowseTripTopic = (
  tripTopic: MapFilterKey,
  key: BrowseTripTopicKey
): MapFilterKey => (tripTopic === key ? 'all' : key);

export const browseListShowsTripTopicRow = (categories: readonly BrowseMainCategoryKey[]): boolean =>
  categories.length === 0 || categories.includes('trips');
