import type { ActivityListFilterKey, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreMapFilterPillKey } from '../exploreBrowseTaxonomy';
import {
  CAMPING_ACTIVITY_EMOJI,
  CAMPING_VENUE_EMOJI,
  HIKING_ACTIVITY_EMOJI,
  RIDESHARE_EMOJI,
  SEEKING_EMOJI,
  SHOP_MAP_EMOJI,
} from '../exploreCopy';
import { LocationSpotGlyph, OtherPlaceGlyph, TrailMapGlyph } from './exploreActionGlyphs';

type ExploreFilterKey = MapFilterKey | ActivityListFilterKey | VenueListFilterKey | 'others' | 'shops' | 'spots' | 'trails';

export type ExploreFilterEmojiContext = 'activity' | 'venue';

interface ExploreFilterIconProps {
  filter: ExploreFilterKey;
  /** Venue tab / venue list → trail feet & camp spot; activities → boot & camp outing. */
  context?: ExploreFilterEmojiContext;
  className?: string;
}

const EmojiIcon = ({ emoji, className }: { emoji: string; className: string }) => (
  <span className={`font-emoji shrink-0 ${className}`} aria-hidden>
    {emoji}
  </span>
);

const glyphFor = (filter: ExploreFilterKey, context: ExploreFilterEmojiContext, className: string) => {
  if (filter === 'all') return null;
  if (filter === 'others' || filter === 'event') return <OtherPlaceGlyph className={className} />;
  if (filter === 'trails') return <TrailMapGlyph className={className} />;
  if (filter === 'spots') return <LocationSpotGlyph className={className} />;
  if (filter === 'shops' || filter === 'shop') return <EmojiIcon emoji={SHOP_MAP_EMOJI} className={className} />;
  if (filter === 'hiking') {
    return context === 'venue' ? (
      <TrailMapGlyph className={className} />
    ) : (
      <EmojiIcon emoji={HIKING_ACTIVITY_EMOJI} className={className} />
    );
  }
  if (filter === 'camping') {
    return (
      <EmojiIcon
        emoji={context === 'venue' ? CAMPING_VENUE_EMOJI : CAMPING_ACTIVITY_EMOJI}
        className={className}
      />
    );
  }
  if (filter === 'rideshare') return <EmojiIcon emoji={RIDESHARE_EMOJI} className={className} />;
  return null;
};

/** Map chrome pills — Activities / Spots / Shops. */
export const ExploreMapFilterPillIcon = ({
  pill,
  className = 'text-base leading-none',
}: {
  pill: ExploreMapFilterPillKey;
  className?: string;
}) => {
  if (pill === 'looking') return <EmojiIcon emoji={SEEKING_EMOJI} className={className} />;
  if (pill === 'spots') return <LocationSpotGlyph className={className} />;
  if (pill === 'shops') return <EmojiIcon emoji={SHOP_MAP_EMOJI} className={className} />;
  return <EmojiIcon emoji={HIKING_ACTIVITY_EMOJI} className={className} />;
};

/** Filter mark for explore map and list pills. Others stays the colored-dot glyph. */
export const ExploreFilterIcon = ({
  filter,
  context = 'activity',
  className = 'text-base leading-none',
}: ExploreFilterIconProps) => glyphFor(filter, context, className);
