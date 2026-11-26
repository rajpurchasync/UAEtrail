import type { PlaceMapTopicKey, TripMapTopicKey } from '../../discovery/discoverySessionExploreRuntime';

/** List explorer quick pill copy (map keeps dropdown + emoji scopes). */
export const LIST_QUICK_FILTER_REGION_LABEL = 'State';

export const LIST_QUICK_TRIP_TOPIC_PILLS: ReadonlyArray<{ key: TripMapTopicKey; label: string }> = [
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'rideshare', label: 'Rideshare' },
  { key: 'others', label: 'Others' },
];

export const LIST_QUICK_VENUE_TOPIC_PILLS: ReadonlyArray<{ key: PlaceMapTopicKey; label: string }> = [
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'others', label: 'Others' },
];