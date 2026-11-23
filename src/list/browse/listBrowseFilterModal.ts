import type { ExploreActivityDatePreset, PlaceMapTopicKey } from '../../explore/discoveryRuntime';
import type { BrowsePriceFilter } from './browseListFilters';
import type { BrowseTripTopicKey } from './browseListTripTopics';
import { LIST_BROWSE_AUDIENCE_OPTIONS } from './browseAudienceFilter';

export const LIST_BROWSE_TRIP_TYPE_OPTIONS: ReadonlyArray<{ key: BrowseTripTopicKey; label: string }> = [
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'rideshare', label: 'Rideshare' },
  { key: 'others', label: 'Others' },
];

export const LIST_BROWSE_PLACE_TYPE_OPTIONS: ReadonlyArray<{ key: PlaceMapTopicKey; label: string }> = [
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'others', label: 'Others' },
];

/** Date section in the filter modal (quick row uses Anyday). */
export const LIST_BROWSE_DATE_FILTER_OPTIONS: ReadonlyArray<{
  value: ExploreActivityDatePreset;
  label: string;
}> = [
  { value: 'anyday', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'This week' },
  { value: 'nextweek', label: 'Next week' },
  { value: 'month', label: 'This month' },
  { value: 'nextmonth', label: 'Next month' },
  { value: 'thisyear', label: 'This year' },
  { value: 'nextyear', label: 'Next year' },
];

export const LIST_BROWSE_PRICE_MODAL_OPTIONS: ReadonlyArray<{ key: BrowsePriceFilter; label: string }> = [
  { key: 'all', label: 'Any' },
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Paid' },
];

export { LIST_BROWSE_AUDIENCE_OPTIONS };