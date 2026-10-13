import { useMemo } from 'react';
import { useMeWishlist } from './useMeWishlist';
import { useMyJoinedActivities } from './useMyJoinedActivities';
import { useExploreMap } from './useExploreMap';
import { planWishlistExploreMatches } from '../plan/planWishlistExploreMatches';

export const usePlanWishlistSuggestions = (enabled: boolean, refreshKey = 0) => {
  const explore = useExploreMap({ enabled });
  const { items: wishlist, loading: wishlistLoading, error: wishlistError } = useMeWishlist(
    enabled,
    refreshKey
  );
  const {
    activities,
    loading: joinedLoading,
    error: joinedError,
  } = useMyJoinedActivities(enabled, refreshKey);

  const joinedIds = useMemo(() => new Set(activities.map((a) => a.id)), [activities]);

  const suggestions = useMemo(
    () => planWishlistExploreMatches(wishlist, explore.data ?? [], joinedIds),
    [wishlist, explore.data, joinedIds]
  );

  const loading = enabled && (wishlistLoading || joinedLoading || explore.isLoading);
  const error = wishlistError ?? joinedError;

  return { suggestions, wishlistCount: wishlist.length, loading, error };
};
