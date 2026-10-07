import { Star } from 'lucide-react';
import type { ExploreCardModel } from '../../../explore/exploreCardModel';
import { LIST_FEED } from '../../listFeedTheme';

/** On-photo star rating for place / shop catalog posters. */
export const ListPosterRatingLine = ({ card }: { card: ExploreCardModel }) => {
  const shadow = LIST_FEED.overlayTextShadow;
  const base = `flex items-center justify-center gap-1 text-[12px] font-semibold ${shadow}`;

  if (!card.reviewCount) {
    return (
      <p className={`${base} text-white/85`}>
        <Star className="h-3.5 w-3.5 text-amber-200/90" aria-hidden />
        No reviews yet
      </p>
    );
  }

  return (
    <p className={`${base} text-white`}>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
      {card.averageRating?.toFixed(1)} · {card.reviewCount} review{card.reviewCount === 1 ? '' : 's'}
    </p>
  );
};
