import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import { ReviewDTO } from '@uaetrail/shared-types';
import { submitEntityReview } from '../../hooks/entityReviewsClientApi';
import { useAuth } from '../../context/AuthContext';
import { MembershipTierBadge } from '../ui/MembershipTierBadge';
import { ReportContentButton } from './ReportContentDialog';
import { EmojiPickerButton } from './EmojiPickerButton';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { myReviewElementId, scrollToReviewAnchor, myReviewHash } from './DetailReviewChrome';

interface ReviewSectionProps {
  targetType: 'location' | 'tenant' | 'place' | 'activity';
  targetId: string;
  reviews: ReviewDTO[];
  onReviewSubmitted: (review: ReviewDTO) => void;
  accent?: 'emerald' | 'amber' | 'violet' | 'sky';
  /** Activity reviews — host must check the member in first. Defaults to true for places/hosts. */
  canWriteReview?: boolean;
  /** Tap header to expand/collapse (e.g. activity detail). */
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const reviewWireTargetType = (
  targetType: ReviewSectionProps['targetType']
): 'location' | 'tenant' | 'activity' => {
  if (targetType === 'place') return 'location';
  return targetType;
};

export const ReviewSection = ({
  targetType,
  targetId,
  reviews,
  onReviewSubmitted,
  accent = 'emerald',
  canWriteReview = true,
  collapsible = false,
  defaultExpanded = true,
}: ReviewSectionProps) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const navigate = useNavigate();
  const location = useLocation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const insertEmoji = (emoji: string) => {
    const el = commentRef.current;
    if (!el) {
      setComment((current) => current + emoji);
      return;
    }
    const start = el.selectionStart ?? comment.length;
    const end = el.selectionEnd ?? comment.length;
    const next = `${comment.slice(0, start)}${emoji}${comment.slice(end)}`;
    setComment(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const existingReview = user ? reviews.find((r) => r.userId === user.id) : undefined;
  const btnClass =
    accent === 'amber'
      ? 'bg-amber-600 hover:bg-amber-700'
      : accent === 'violet'
        ? 'bg-violet-600 hover:bg-violet-700'
        : accent === 'sky'
          ? 'bg-sky-600 hover:bg-sky-700'
          : 'bg-emerald-600 hover:bg-emerald-700';
  const signInRedirect = buildSignInRedirect(location, {
    focusSelector: '#reviews',
    hash: '#reviews'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(signInRedirect.href, { state: { from: signInRedirect.from } });
      return;
    }
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const wireTarget = reviewWireTargetType(targetType);
      const review = await submitEntityReview(
        wireTarget === 'activity'
          ? { kind: 'activity', activityId: targetId }
          : wireTarget === 'tenant'
            ? { kind: 'tenant', organisationId: targetId }
            : { kind: 'place', placeId: targetId },
        { rating, comment: comment.trim() }
      );
      onReviewSubmitted(review);
      setComment('');
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      setError(msg.includes('unique') || msg.includes('already') ? 'You already reviewed this.' : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const reviewCountLabel = reviews.length > 0 ? ` (${reviews.length})` : '';

  const header = collapsible ? (
    <button
      type="button"
      onClick={() => setExpanded((open) => !open)}
      aria-expanded={expanded}
      className="mb-4 flex w-full items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 text-left shadow-sm active:bg-gray-50"
    >
      <span className="text-lg md:text-xl font-bold text-gray-900">
        Reviews{reviewCountLabel}
      </span>
      {expanded ? (
        <ChevronUp className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />
      ) : (
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />
      )}
    </button>
  ) : (
    <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Reviews{reviewCountLabel}</h2>
  );

  return (
    <section
      id="reviews"
      className="scroll-mt-24 scroll-mb-28 pb-2 md:scroll-mb-0"
      tabIndex={-1}
    >
      {header}

      {collapsible && !expanded ? null : (
        <>
      {user && !existingReview && !success && !canWriteReview && targetType === 'activity' ? (
        <p className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
          Reviews open after your host checks you in on the outing.
        </p>
      ) : null}

      {user && !existingReview && !success && canWriteReview && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5 mb-6 space-y-3">
          <p className="text-sm font-medium text-gray-900">Share your experience</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-0.5"
                aria-label={`Rate ${n} stars`}
              >
                <Star
                  className={`w-6 h-6 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <textarea
              ref={commentRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="What did you like? Any tips for others? (min 10 characters)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 font-emoji"
            />
            <EmojiPickerButton onPick={insertEmoji} disabled={submitting} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 text-white text-sm font-semibold rounded-xl disabled:opacity-60 ${btnClass}`}
          >
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      )}

      {!user && (
        <p className="text-sm text-gray-600 mb-4">
          <Link to={signInRedirect.href} state={{ from: signInRedirect.from }} className="text-emerald-700 font-medium hover:underline">
            Sign in
          </Link>{' '}
          to leave a review.
        </p>
      )}

      {existingReview && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2">
          <p className="text-sm font-medium text-emerald-800">You&apos;ve rated this — thanks for sharing.</p>
          <button
            type="button"
            onClick={() => scrollToReviewAnchor(myReviewHash(existingReview.id))}
            className="text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
          >
            View my rating
          </button>
        </div>
      )}

      {success && !existingReview && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Thanks — your review has been submitted.
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600">No reviews yet. Be the first to share your experience.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isMine = user?.id === review.userId;
            return (
            <div
              key={review.id}
              id={myReviewElementId(review.id)}
              tabIndex={isMine ? -1 : undefined}
              className={`bg-white rounded-lg shadow-sm p-6 scroll-mt-28 ${isMine ? 'ring-2 ring-emerald-500/40' : ''}`}
            >
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold text-gray-900">{review.userName}</div>
                  {review.userMembershipTier && (
                    <MembershipTierBadge
                      tierKey={review.userMembershipTier.key}
                      name={review.userMembershipTier.name}
                      emoji={review.userMembershipTier.emoji}
                    />
                  )}
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-600">{review.comment}</p>
              <div className="flex items-center justify-between mt-2 gap-2">
                <div className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
                {user && review.userId !== user.id && (
                  <ReportContentButton targetType="review" targetId={review.id} label="Report" />
                )}
              </div>
            </div>
          );
          })}
        </div>
      )}
        </>
      )}
    </section>
  );
};
