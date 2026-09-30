import type { ExploreMapItemDTO, OutingTopic } from '@uaetrail/shared-types';
import type { ExploreBuddySubtypeKey } from './exploreBuddySubtype';
import type { MapFilterKey } from './routing';

export type ExploreOutingTopicKey = 'all' | OutingTopic;

const OUTING_TOPIC_KEYS = new Set<string>([
  'climbing',
  'trail_run',
  'road_run',
  'swim',
  'workshop',
  'community',
]);

export const OUTING_TOPIC_PILLS: ReadonlyArray<{ key: ExploreOutingTopicKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'climbing', label: 'Climb' },
  { key: 'trail_run', label: 'Run' },
  { key: 'workshop', label: 'Workshop' },
  { key: 'community', label: 'Social' },
];

export const parseExploreOutingTopic = (
  value: string | null,
  mapFilter: MapFilterKey,
  buddySubtype: ExploreBuddySubtypeKey
): ExploreOutingTopicKey => {
  if (mapFilter !== 'others' || buddySubtype !== 'activities') return 'all';
  if (value && OUTING_TOPIC_KEYS.has(value)) return value as OutingTopic;
  return 'all';
};

export const serializeExploreOutingTopic = (
  topic: ExploreOutingTopicKey,
  mapFilter: MapFilterKey,
  buddySubtype: ExploreBuddySubtypeKey
): string | null => {
  if (mapFilter !== 'others' || buddySubtype !== 'activities' || topic === 'all') return null;
  return topic;
};

export const matchesOutingTopicFilter = (
  item: ExploreMapItemDTO,
  topic: ExploreOutingTopicKey
): boolean => {
  if (topic === 'all') return true;
  if (item.outingCategory !== 'activities') return false;
  return item.outingTopic === topic;
};
