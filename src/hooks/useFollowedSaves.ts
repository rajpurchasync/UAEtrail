import { useQuery } from '@tanstack/react-query';
import { api } from '../api/index';

export const useFollowedSaves = (enabled: boolean) => {
  const query = useQuery({
    queryKey: ['me', 'favorites', 'followed-saves'],
    queryFn: async () => {
      const res = await api.getMeFavorites();
      return res.data;
    },
    enabled,
    staleTime: 60_000,
  });

  return {
    favorites: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.isError ? 'Could not load saves.' : null,
    reload: () => void query.refetch(),
  };
};
