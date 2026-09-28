import {
  CAMPING_ACTIVITY_EMOJI,
  CAMPING_VENUE_EMOJI,
  HIKING_ACTIVITY_EMOJI,
  HIKING_VENUE_EMOJI,
  MAP_FILTER_EMOJI,
  MAP_LAYER_FILTER_EMOJI,
} from '../exploreCopy';
import type { ActivityListFilterKey, MapFilterKey, VenueListFilterKey } from '../routing';

type ExploreFilterKey = MapFilterKey | ActivityListFilterKey | VenueListFilterKey | 'others' | 'shops';

export type ExploreFilterEmojiContext = 'activity' | 'venue';

const resolveFilterEmoji = (
  filter: ExploreFilterKey,
  context: ExploreFilterEmojiContext = 'activity'
): string | null => {
  if (filter === 'all') return null;
  if (filter === 'others') return MAP_LAYER_FILTER_EMOJI.others;
  if (filter === 'shops') return MAP_LAYER_FILTER_EMOJI.shops;
  if (filter === 'shop') return MAP_FILTER_EMOJI.shop;
  if (filter === 'hiking') {
    return context === 'venue' ? HIKING_VENUE_EMOJI : HIKING_ACTIVITY_EMOJI;
  }
  if (filter === 'camping') {
    return context === 'venue' ? CAMPING_VENUE_EMOJI : CAMPING_ACTIVITY_EMOJI;
  }
  if (filter === 'carpool') return MAP_FILTER_EMOJI.carpool;
  if (filter === 'event') return MAP_FILTER_EMOJI.event;
  return null;
};

interface ExploreFilterIconProps {
  filter: ExploreFilterKey;
  /** Venue tab / venue list → mountain & tent spot emojis; activities → boots & camp outing. */
  context?: ExploreFilterEmojiContext;
  className?: string;
}

/** Emoji chip for explore map/list filter pills — matches map pin emoji set. */
export const ExploreFilterIcon = ({
  filter,
  context = 'activity',
  className = 'text-base leading-none',
}: ExploreFilterIconProps) => {
  const emoji = resolveFilterEmoji(filter, context);
  if (!emoji) return null;
  return (
    <span className={`font-emoji shrink-0 ${className}`} aria-hidden>
      {emoji}
    </span>
  );
};
