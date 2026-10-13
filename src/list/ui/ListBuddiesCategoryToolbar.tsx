import { DEMAND_EMOJI } from '../../explore/exploreCopy';
import type { BuddiesDiscoverySegment } from '../buddiesDiscoverySegment';
import { BUDDIES_DISCOVERY_SEGMENTS } from '../buddiesDiscoverySegment';
import type { ListCategoryPill } from '../listCategoryFilterPills';
import { ListCategoryTopicCircleFilter } from './ListCategoryTopicCircleFilter';

const BUDDIES_SEGMENT_EMOJI: Record<BuddiesDiscoverySegment, string> = {
  going: '🧑‍🤝‍🧑',
  looking: DEMAND_EMOJI,
  followed: '⭐',
};

type ListBuddiesCategoryToolbarProps = {
  segment: BuddiesDiscoverySegment;
  onSegmentChange: (segment: BuddiesDiscoverySegment) => void;
};

/** Buddies list — segment circles aligned with Activities category filters. */
export const ListBuddiesCategoryToolbar = ({ segment, onSegmentChange }: ListBuddiesCategoryToolbarProps) => {
  const pills: ListCategoryPill[] = BUDDIES_DISCOVERY_SEGMENTS.map(({ key, label }) => ({
    id: `buddies-${key}`,
    label,
    segmentEmoji: BUDDIES_SEGMENT_EMOJI[key],
    active: segment === key,
    onToggle: () => onSegmentChange(key),
  }));

  return (
    <div className="w-full pt-1 pb-0.5">
      <ListCategoryTopicCircleFilter pills={pills} emojiContext="activity" />
    </div>
  );
};
