import { useEffect, useMemo, useState } from 'react';
import type { MyActivityDTO, WishlistItemDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { socialApi } from '../api/domains/social';
import { useExploreMap } from './useExploreMap';
import { planWishlistExploreMatches } from '../plan/planWishlistExploreMatches';

export const usePlanWishlistSuggestions = (enabled: boolean, refreshKey = 0) => {
  const explore = useExploreMap({ enabled });
  const [wishlist, setWishlist] = useState<WishlistItemDTO[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    setWishlistLoading(true);
    setError(null);
    Promise.all([
      socialApi.getMeWishlist(),
      api.getMeActivities().catch(() => ({ data: [] as MyActivityDTO[] })),
    ])
      .then(([wishlistRes, activitiesRes]) => {
        setWishlist(wishlistRes.data ?? []);
        setJoinedIds(new Set(activitiesRes.data.map((a) => a.id)));
      })
      .catch(() => setError('Could not load saved matches.'))
      .finally(() => setWishlistLoading(false));
  }, [enabled, refreshKey]);

  const suggestions = useMemo(
    () => planWishlistExploreMatches(wishlist, explore.data ?? [], joinedIds),
    [wishlist, explore.data, joinedIds]
  );

  const loading = enabled && (wishlistLoading || explore.isLoading);

  return { suggestions, wishlistCount: wishlist.length, loading, error };
};
