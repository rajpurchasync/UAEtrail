import type { ActivityDetailKind } from '../activityDetailKind';

/** Plan §4 section order for the consumer activity template. Empty nodes still hide themselves. */
export type ActivityConsumerSectionId =
  | 'linkage'
  | 'guest'
  | 'essentials'
  | 'where'
  | 'details'
  | 'plan'
  | 'packing'
  | 'instructions'
  | 'host'
  | 'weather'
  | 'reviews'
  | 'safety';

const HIKING: ActivityConsumerSectionId[] = [
  'linkage',
  'host',
  'details',
  'where',
  'packing',
  'instructions',
  'weather',
  'reviews',
  'safety',
];

const CAMPING: ActivityConsumerSectionId[] = [
  'linkage',
  'host',
  'details',
  'where',
  'packing',
  'instructions',
  'weather',
  'reviews',
  'safety',
];

const EVENT: ActivityConsumerSectionId[] = [
  'linkage',
  'host',
  'details',
  'where',
  'packing',
  'instructions',
  'weather',
  'reviews',
  'safety',
];

const RIDESHARE: ActivityConsumerSectionId[] = [
  'linkage',
  'essentials',
  'host',
  'details',
  'where',
  'packing',
  'instructions',
  'weather',
  'reviews',
  'safety',
];

export const ACTIVITY_CONSUMER_SECTION_ORDER: Record<ActivityDetailKind, ActivityConsumerSectionId[]> = {
  hiking: HIKING,
  camping: CAMPING,
  event: EVENT,
  rideshare: RIDESHARE,
  other: EVENT,
};
