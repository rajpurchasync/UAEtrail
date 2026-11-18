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
import { FacilityGlyph, HikingVenueGlyph, LocationSpotGlyph, OtherPlaceGlyph } from './exploreActionGlyphs';

type ExploreFilterKey =
  | MapFilterKey
  | ActivityListFilterKey
  | VenueListFilterKey
  | 'others'
  | 'shops'
  | 'spots'
  | 'trails'
  | 'facilities';

export type ExploreFilterEmojiContext = 'activity' | 'venue';

interface ExploreFilterIconProps {
  filter: ExploreFilterKey;
  /** Venue tab / venue list → trail feet & camp spot; activities → boot & camp outing. */
  context?: ExploreFilterEmojiContext;
  className?: string;
  /** e.g. `explore-filter-mark--chip` for mobile map float pills */
  markClassName?: string;
}

/** Vertical lift inside `.explore-filter-mark` — offsets low-sitting emoji glyphs. */
export type ExploreMarkEmojiLift = 'default' | 'camp' | 'people';

const liftClassName = (lift: ExploreMarkEmojiLift): string => {
  if (lift === 'camp') return 'explore-mark-emoji--camp';
  if (lift === 'people') return 'explore-mark-emoji--people';
  return '';
};

/**
 * Map / list filter chrome — fixed mark box + optically centered emoji (see `index.css` `.explore-filter-mark`).
 */
export const ExploreMarkEmoji = ({
  emoji,
  markClassName = '',
  lift = 'default',
}: {
  emoji: string;
  markClassName?: string;
  lift?: ExploreMarkEmojiLift;
}) => {
  const markClass = ['explore-filter-mark', markClassName].filter(Boolean).join(' ');
  const emojiClass = ['font-emoji explore-mark-emoji leading-none', liftClassName(lift)].filter(Boolean).join(' ');
  return (
    <span className={markClass} aria-hidden>
      <span className={emojiClass}>{emoji}</span>
    </span>
  );
};

const EmojiIcon = ({
  emoji,
  className,
  lift = 'default',
}: {
  emoji: string;
  className: string;
  lift?: ExploreMarkEmojiLift;
}) => (
  <span className={`font-emoji explore-mark-emoji leading-none ${liftClassName(lift)} ${className}`} aria-hidden>
    {emoji}
  </span>
);

const glyphFor = (filter: ExploreFilterKey, context: ExploreFilterEmojiContext, className: string) => {
  if (filter === 'all') return null;
  if (filter === 'others' || filter === 'event') return <OtherPlaceGlyph className={className} />;
  if (filter === 'trails') return <HikingVenueGlyph className={className} />;
  if (filter === 'spots') return <LocationSpotGlyph className={className} />;
  if (filter === 'shops' || filter === 'shop') return <EmojiIcon emoji={SHOP_MAP_EMOJI} className={className} />;
  if (filter === 'facilities') return <FacilityGlyph className={className} />;
  if (filter === 'hiking') {
    return context === 'venue' ? (
      <HikingVenueGlyph className={className} />
    ) : (
      <EmojiIcon emoji={HIKING_ACTIVITY_EMOJI} className={className} />
    );
  }
  if (filter === 'camping') {
    return (
      <EmojiIcon
        emoji={context === 'venue' ? CAMPING_VENUE_EMOJI : CAMPING_ACTIVITY_EMOJI}
        className={className}
        lift="camp"
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
  className = '',
  markClassName = '',
}: ExploreFilterIconProps) => {
  const mark = glyphFor(filter, context, className);
  if (!mark) return null;
  const markClass = ['explore-filter-mark', markClassName].filter(Boolean).join(' ');
  return (
    <span className={markClass} aria-hidden>
      {mark}
    </span>
  );
};
