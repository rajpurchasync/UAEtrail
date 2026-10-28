import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMeWishlist } from '../../hooks/useMeWishlist';
import { explorePath, explorePlacesPath } from '../../explore/routing';
import { planWishlistSavedFocusId } from '../../plan/planWishlistReturnCapture';
import {
  resolveWishlistItemPath,
  wishlistItemPinEmoji,
  wishlistItemTitle,
} from '../../member-plan/wishlistSavedItem';
import { PlanWishlistDetailLink } from './PlanWishlistDetailLink';
import { PlanWishlistRowIcon } from './PlanWishlistRowIcon';

type PlanSavedSectionProps = {
  /** Non-zero after user taps Saved in plan summary — scroll once loading finishes. */
  summaryScrollRequest?: number;
  onSummaryScrollReady?: () => void;
};

export const PlanSavedSection = ({
  summaryScrollRequest = 0,
  onSummaryScrollReady,
}: PlanSavedSectionProps) => {
  const { items, loading, error, refetch } = useMeWishlist();

  useEffect(() => {
    if (!summaryScrollRequest || !onSummaryScrollReady) return;
    if (loading) return;
    onSummaryScrollReady();
  }, [summaryScrollRequest, loading, onSummaryScrollReady]);

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading saved…</p>;
  }

  if (error) {
    return (
      <div className="glass-card p-4 text-center text-sm text-neutral-600">
        {error}
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 font-semibold text-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-card space-y-3 p-6 text-center text-sm text-neutral-600">
        <p>Save outings and places from the map to compare and get alerts.</p>
        <Link to={explorePlacesPath()} className="inline-block font-semibold text-emerald-700">
          Explore the map
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const to = resolveWishlistItemPath(item) ?? explorePath();
        const title = wishlistItemTitle(item);
        return (
          <li key={item.id}>
            <PlanWishlistDetailLink
              to={to}
              navFocus={planWishlistSavedFocusId(item.id)}
              className="glass-card-interactive flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-900"
            >
              <PlanWishlistRowIcon emoji={wishlistItemPinEmoji(item)} />
              <span className="min-w-0 flex-1 truncate">{title}</span>
            </PlanWishlistDetailLink>
          </li>
        );
      })}
    </ul>
  );
};
