import {
  mapItemMatchesOutingTopic,
  parseOutingTopic,
  type ExploreMapItemDTO,
  type OutingTopic,
} from '@uaetrail/shared-types';
import type { ExploreBuddySubtypeKey } from './exploreBuddySubtype';
import type { MapFilterKey } from './routing';

export type ExploreOutingTopicKey = 'all' | OutingTopic;

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
  const parsed = parseOutingTopic(value);
  if (parsed) return parsed;
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
  return mapItemMatchesOutingTopic(item, topic);
};
