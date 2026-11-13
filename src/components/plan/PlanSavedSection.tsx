import { useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useMeWishlist } from '../../hooks/useMeWishlist';
import { AppButton } from '../mobile/AppButton';
import { planWishlistSavedFocusId } from '../../plan/planWishlistReturnCapture';
import { isPlanWantToGoVenue } from '../../plan/planHubSummaryCounts';
import { PLAN_WANT_TO_GO_LABEL } from '../../plan/planAdd';
import {
  resolveWishlistItemPath,
  wishlistItemPinEmoji,
  wishlistItemTitle,
} from '../../member-plan/wishlistSavedItem';
import { PlanWishlistDetailLink } from './PlanWishlistDetailLink';
import { PlanWishlistRowIcon } from './PlanWishlistRowIcon';

type PlanSavedSectionProps = {
  /** Non-zero after user taps Want to go in plan summary — scroll once loading finishes. */
  summaryScrollRequest?: number;
  onSummaryScrollReady?: () => void;
  onAdd?: () => void;
};

export const PlanSavedSection = ({
  summaryScrollRequest = 0,
  onSummaryScrollReady,
  onAdd,
}: PlanSavedSectionProps) => {
  const { items, loading, error, refetch } = useMeWishlist();
  const venues = useMemo(() => items.filter(isPlanWantToGoVenue), [items]);

  useEffect(() => {
    if (!summaryScrollRequest || !onSummaryScrollReady) return;
    if (loading) return;
    onSummaryScrollReady();
  }, [summaryScrollRequest, loading, onSummaryScrollReady]);

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading…</p>;
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

  return (
    <div className="space-y-3">
      {venues.length > 0 ? (
        <ul className="space-y-2">
          {venues.map((item) => {
            const to = resolveWishlistItemPath(item);
            if (!to) return null;
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
      ) : null}
      {onAdd ? (
        <AppButton
          type="button"
          variant="tint"
          fullWidth
          className="!min-h-[44px]"
          onClick={onAdd}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" aria-hidden />
            {PLAN_WANT_TO_GO_LABEL}
          </span>
        </AppButton>
      ) : null}
    </div>
  );
};
