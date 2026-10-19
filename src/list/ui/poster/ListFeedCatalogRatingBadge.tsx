import { Star } from 'lucide-react';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';

/** Compact rating for catalog poster header (neutral, above image). */
export const ListFeedCatalogRatingBadge = ({ card }: { card: DiscoveryCardModel }) => {
  if (!card.reviewCount) {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-neutral-500">
        <Star className="h-3.5 w-3.5 text-amber-300" aria-hidden />
        <span className="whitespace-nowrap">No reviews</span>
      </span>
    );
  }

  return (
    <span
      className="flex shrink-0 items-center gap-1 text-xs font-bold text-neutral-800"
      aria-label={`${card.averageRating?.toFixed(1)} out of 5, ${card.reviewCount} reviews`}
    >
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
      <span className="tabular-nums">{card.averageRating?.toFixed(1)}</span>
      <span className="font-semibold text-neutral-500">({card.reviewCount})</span>
    </span>
  );
};
