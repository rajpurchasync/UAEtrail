import { EXPLORE_MAP_PATH, PROFILE_REVIEWS_PATH, signInPath } from '../config/routingCatalog';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ChevronRight, Loader2, Star } from 'lucide-react';
import type { MyReviewDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { useAuth } from '../context/AuthContext';

import { PRODUCT_EXPLORE_CTA } from '../content/productNorthStar';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { EmojiPickerButton } from '../components/ui/EmojiPickerButton';

const targetTypeLabel = (review: MyReviewDTO): string =>
  review.targetType === 'location' ? 'Place' : 'Shop or host';

const MyReviewCard = ({
  review,
  onSaved,
}: {
  review: MyReviewDTO;
  onSaved: (updated: MyReviewDTO) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) return;
    setRating(review.rating);
    setComment(review.comment);
  }, [review, editing]);

  const save = async () => {
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await api.updateMyReview(review.id, { rating, comment: comment.trim() });
      onSaved(res.data);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard padding className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            {targetTypeLabel(review)}
          </p>
          <Link
            to={review.targetPath}
            className="mt-0.5 block truncate text-base font-bold text-neutral-900 hover:text-emerald-700"
          >
            {review.targetLabel}
          </Link>
        </div>
        <div className="flex shrink-0 gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-4 w-4 ${n <= (editing ? rating : review.rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}`}
            />
          ))}
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
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
                  className={`h-6 w-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 font-emoji"
            />
            <EmojiPickerButton
              onPick={(emoji) => setComment((current) => current + emoji)}
              disabled={saving}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
                setRating(review.rating);
                setComment(review.comment);
              }}
              disabled={saving}
              className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">{review.comment}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-neutral-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Edit
              </button>
              <Link
                to={review.targetPath}
                className="inline-flex items-center gap-0.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
              >
                View
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
};

/** All reviews the signed-in member has written — view and edit. */
export const ProfileReviews = () => {
  const { user, initializing } = useAuth();
  const [reviews, setReviews] = useState<MyReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    const res = await api.getMyReviews(1, 100);
    setReviews(res.data);
  }, [user]);

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    load()
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load reviews'))
      .finally(() => setLoading(false));
  }, [user, initializing, load]);

  if (!initializing && !user) {
    return <Navigate to={signInPath({ redirect: PROFILE_REVIEWS_PATH })} replace />;
  }

  return (
    <ConsumerShell
      layout="stack"
      title="Reviews"
      showJourney={false}
      back={{ fallbackTo: '/profile', label: 'Profile' }}
    >
      <PullToRefresh onRefresh={load}>
        <div className="space-y-3 pb-nav-safe animate-fade-up">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          )}

          {error && (
            <GlassCard padding className="border-red-200/50 bg-red-50/50">
              <p className="text-sm text-red-600">{error}</p>
            </GlassCard>
          )}

          {!loading && !error && reviews.length === 0 && (
            <GlassCard padding className="text-center">
              <p className="text-sm text-neutral-600">You haven&apos;t rated any places or shops yet.</p>
              <Link to={EXPLORE_MAP_PATH} className="mt-3 inline-block text-sm font-semibold text-emerald-700">
                {PRODUCT_EXPLORE_CTA}
              </Link>
            </GlassCard>
          )}

          {!loading &&
            reviews.map((review) => (
              <MyReviewCard
                key={review.id}
                review={review}
                onSaved={(updated) =>
                  setReviews((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
                }
              />
            ))}
        </div>
      </PullToRefresh>
    </ConsumerShell>
  );
};
