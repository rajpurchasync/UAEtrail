import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  summarizeReviewRatings,
  useTenantReviewsQuery,
} from '../../hooks/useTenantReviewsQuery';

type TenantHostRatingInlineProps = {
  tenantId: string;
  /** Rideshare drivers vs generic outing hosts. */
  variant: 'driver' | 'host';
  linkToReviews?: boolean;
};

export const TenantHostRatingInline = ({
  tenantId,
  variant,
  linkToReviews = true,
}: TenantHostRatingInlineProps) => {
  const { data, isLoading } = useTenantReviewsQuery(tenantId);
  const summary = data ? summarizeReviewRatings(data.reviews, data.total) : null;

  if (isLoading) {
    return (
      <p className="mt-0.5 h-4 w-28 animate-pulse rounded bg-neutral-200/80" aria-hidden />
    );
  }

  const roleLabel = variant === 'driver' ? 'driver' : 'host';

  if (!summary) {
    return (
      <p className="mt-0.5 text-xs font-medium text-neutral-500">
        No {roleLabel} reviews yet
      </p>
    );
  }

  const label = `${summary.averageRating.toFixed(1)} · ${summary.reviewCount} ${roleLabel} review${
    summary.reviewCount === 1 ? '' : 's'
  }`;

  const row = (
    <span className="mt-0.5 inline-flex items-center gap-1 text-sm text-neutral-600">
      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" aria-hidden />
      <span className="font-semibold tabular-nums text-neutral-900">{summary.averageRating.toFixed(1)}</span>
      <span>
        · {summary.reviewCount} {roleLabel} review{summary.reviewCount === 1 ? '' : 's'}
      </span>
    </span>
  );

  if (!linkToReviews) return row;

  return (
    <Link
      to="#reviews"
      className="mt-0.5 block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
      aria-label={`${label}. Jump to reviews`}
    >
      {row}
    </Link>
  );
};
