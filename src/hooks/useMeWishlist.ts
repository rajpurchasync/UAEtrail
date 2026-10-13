import { useQuery } from '@tanstack/react-query';
import { fetchMeWishlist } from './wishlistClientApi';
import { meWishlistQueryKey } from './clientQueryKeys';

/** Member saved list (`GET /me/wishlist`) — invalidated from explore save toggle (R8.2 / R8.3). */
export const useMeWishlist = (enabled = true, refreshKey = 0) => {
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [...meWishlistQueryKey, refreshKey],
    queryFn: () => fetchMeWishlist(),
    enabled,
  });

  return {
    items: data ?? [],
    loading: enabled && (isLoading || isFetching),
    error: isError ? 'Could not load saved items.' : null,
    refetch,
  };
};
