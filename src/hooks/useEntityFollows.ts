import { useQuery } from '@tanstack/react-query';
import { api } from '../api/index';

export const useEntityFollows = (enabled: boolean) => {
  const query = useQuery({
    queryKey: ['me', 'entity-follows'],
    queryFn: async () => {
      const res = await api.getMeEntityFollows();
      return res.data;
    },
    enabled,
    staleTime: 60_000,
  });

  return {
    follows: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.isError ? 'Could not load follows.' : null,
    reload: () => void query.refetch(),
  };
};
