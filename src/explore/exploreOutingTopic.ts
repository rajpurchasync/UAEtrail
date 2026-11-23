import {
  mapItemMatchesOutingTopic,
  parseOutingTopic,
  type ExploreMapItemDTO,
  type OutingTopic,
} from '@uaetrail/shared-types';
import type { ExploreOthersSubtypeKey } from './exploreOthersSubtype';
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
  othersSubtype: ExploreOthersSubtypeKey
): ExploreOutingTopicKey => {
  if (mapFilter !== 'others' || othersSubtype !== 'activities') return 'all';
  const parsed = parseOutingTopic(value);
  if (parsed) return parsed;
  return 'all';
};

export const serializeExploreOutingTopic = (
  topic: ExploreOutingTopicKey,
  mapFilter: MapFilterKey,
  othersSubtype: ExploreOthersSubtypeKey
): string | null => {
  if (mapFilter !== 'others' || othersSubtype !== 'activities' || topic === 'all') return null;
  return topic;
};

export const matchesOutingTopicFilter = (
  item: ExploreMapItemDTO,
  topic: ExploreOutingTopicKey
): boolean => {
  if (topic === 'all') return true;
  return mapItemMatchesOutingTopic(item, topic);
};
