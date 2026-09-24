import { Star } from 'lucide-react';
import type { ReviewDTO } from '@uaetrail/shared-types';

export const reviewSectionHash = '#reviews';

export const myReviewElementId = (reviewId: string): string => `review-${reviewId}`;

export const myReviewHash = (reviewId: string): string => `#${myReviewElementId(reviewId)}`;

export const computeAverageRating = (reviews: ReviewDTO[]): number | null => {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

export const scrollToReviewAnchor = (hash: string) => {
  const id = hash.startsWith('#') ? hash.slice(1) : hash;
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
};

interface CatalogRatingSummaryProps {
  reviews: ReviewDTO[];
  className?: string;
}

/** Aggregate stars + count for venue / shop / host detail headers. */
export const CatalogRatingSummary = ({ reviews, className = '' }: CatalogRatingSummaryProps) => {
  const average = computeAverageRating(reviews);
  if (average == null) {
    return (
      <p className={`flex items-center gap-1.5 text-sm font-medium text-gray-500 ${className}`}>
        <Star className="h-4 w-4 text-amber-300" aria-hidden />
        No reviews yet
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => scrollToReviewAnchor(reviewSectionHash)}
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 ${className}`}
      aria-label={`${average} out of 5 from ${reviews.length} reviews. Jump to reviews.`}
    >
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
      {average.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? '' : 's'}
    </button>
  );
};

interface DetailReviewFooterProps {
  userReview?: ReviewDTO;
  accent?: 'emerald' | 'amber' | 'violet';
}

/** Mobile sticky footer — Rate, or Rated + view my rating. */
export const DetailReviewFooter = ({ userReview, accent = 'amber' }: DetailReviewFooterProps) => {
  const primaryClass =
    accent === 'violet'
      ? 'bg-violet-600 hover:bg-violet-700'
      : accent === 'emerald'
        ? 'bg-emerald-600 hover:bg-emerald-700'
        : 'bg-amber-600 hover:bg-amber-700';

  return (
    <div className="flex gap-2 rounded-2xl bg-white/95 p-2 shadow-lg shadow-black/10 ring-1 ring-black/[0.06] backdrop-blur-md">
      {userReview ? (
        <>
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
            Rated
          </div>
          <button
            type="button"
            onClick={() => scrollToReviewAnchor(myReviewHash(userReview.id))}
            className="flex flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm font-semibold text-gray-900 transition hover:bg-neutral-50"
          >
            View my rating
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => scrollToReviewAnchor(reviewSectionHash)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-sm font-bold text-white transition ${primaryClass}`}
        >
          <Star className="h-4 w-4 fill-white/90 text-white" aria-hidden />
          Rate
        </button>
      )}
    </div>
  );
};
