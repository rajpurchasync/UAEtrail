import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { ReviewDTO } from '@uaetrail/shared-types';
import { api } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { MembershipTierBadge } from '../ui/MembershipTierBadge';

interface ReviewSectionProps {
  targetType: 'location' | 'tenant';
  targetId: string;
  reviews: ReviewDTO[];
  onReviewSubmitted: (review: ReviewDTO) => void;
  accent?: 'emerald' | 'amber';
}

export const ReviewSection = ({
  targetType,
  targetId,
  reviews,
  onReviewSubmitted,
  accent = 'emerald',
}: ReviewSectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const existingReview = user ? reviews.find((r) => r.userId === user.id) : undefined;
  const btnClass =
    accent === 'amber'
      ? 'bg-amber-600 hover:bg-amber-700'
      : 'bg-emerald-600 hover:bg-emerald-700';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin', { state: { from: window.location.pathname + '#reviews' } });
      return;
    }
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createReview({
        targetType,
        targetId,
        rating,
        comment: comment.trim(),
      });
      onReviewSubmitted(res.data);
      setComment('');
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      setError(msg.includes('unique') || msg.includes('already') ? 'You already reviewed this.' : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="scroll-mt-24">
      <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Reviews</h2>

      {user && !existingReview && !success && (
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
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="What did you like? Any tips for others? (min 10 characters)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-emerald-700">Earn +25 Trail Points for your review.</p>
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
          <Link to="/signin" className="text-emerald-700 font-medium hover:underline">
            Sign in
          </Link>{' '}
          to leave a review.
        </p>
      )}

      {(existingReview || success) && (
        <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mb-4">
          Thanks — your review has been submitted.
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600">No reviews yet. Be the first to share your experience.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
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
              <div className="text-sm text-gray-500 mt-2">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
