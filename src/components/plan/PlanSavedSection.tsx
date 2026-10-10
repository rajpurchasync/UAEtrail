import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { socialApi } from '../../api/domains/social';
import type { WishlistItemDTO } from '@uaetrail/shared-types';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { explorePath } from '../../explore/routing';
import { resolveWishlistItemPath, wishlistItemTitle } from '../../member-plan/wishlistDemandBookmark';

export const PlanSavedSection = () => {
  const [items, setItems] = useState<WishlistItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await socialApi.getMeWishlist();
      setItems(res.data ?? []);
    } catch {
      setError('Could not load saved items.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading saved…</p>;
  }

  if (error) {
    return (
      <div className="glass-card p-4 text-center text-sm text-neutral-600">
        {error}
        <button type="button" onClick={() => void load()} className="mt-2 font-semibold text-emerald-700">
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-card space-y-3 p-6 text-center text-sm text-neutral-600">
        <p>Save outings and places from the map to compare and get alerts.</p>
        <Link to={EXPLORE_MAP_PATH} className="inline-block font-semibold text-emerald-700">
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
            <Link
              to={to}
              className="glass-card-interactive block px-4 py-3 text-sm font-medium text-neutral-900"
            >
              {title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
