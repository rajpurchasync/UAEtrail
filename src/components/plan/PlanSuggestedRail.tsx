import { Link } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { planWishlistMatchFocusId } from '../../plan/planWishlistReturnCapture';
import { usePlanWishlistSuggestions } from '../../hooks/usePlanWishlistSuggestions';
import { planSavedPath } from '../../plan/planLens';
import { PlanWishlistDetailLink } from './PlanWishlistDetailLink';
import { PlanWishlistRowIcon } from './PlanWishlistRowIcon';

type PlanSuggestedRailProps = {
  refreshKey?: number;
};

/** Saved wishlist items that match live map outings — links out to Explore / entity detail. */
export const PlanSuggestedRail = ({ refreshKey = 0 }: PlanSuggestedRailProps) => {
  const { suggestions, wishlistCount, loading, error } = usePlanWishlistSuggestions(true, refreshKey);

  if (loading) return null;
  if (error || suggestions.length === 0) return null;

  return (
    <section className="space-y-2" aria-label="Suggested from saved">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold tracking-tight text-neutral-900">From your saved list</h2>
        {wishlistCount > suggestions.length ? (
          <Link to={planSavedPath()} className="text-xs font-semibold text-emerald-700 hover:underline">
            All saved
          </Link>
        ) : null}
      </div>
      <p className="text-xs text-neutral-500">Outings on the map that match what you saved.</p>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none snap-x snap-mandatory">
        {suggestions.map((row) => (
          <PlanWishlistDetailLink
            key={row.wishlistItemId}
            to={row.href}
            navFocus={planWishlistMatchFocusId(row.wishlistItemId)}
            className="glass-card-interactive w-[min(82vw,280px)] shrink-0 snap-start p-4"
          >
            <div className="flex items-start gap-2.5">
              <PlanWishlistRowIcon emoji={row.kindEmoji} />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
                  Saved match
                </span>
                <p className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-900">
                  {row.title}
                </p>
              </div>
            </div>
            {row.subtitle ? (
              <p className="mt-1 line-clamp-1 text-xs text-neutral-500">{row.subtitle}</p>
            ) : null}
          </PlanWishlistDetailLink>
        ))}
        <Link
          to={EXPLORE_MAP_PATH}
          className="flex w-[min(52vw,200px)] shrink-0 snap-start items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-6 text-center text-sm font-semibold text-emerald-800 hover:bg-white"
        >
          Explore more
        </Link>
      </div>
    </section>
  );
};
