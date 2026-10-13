import { useQuery } from '@tanstack/react-query';
import { entityFollowsQueryKey } from './clientQueryKeys';
import { fetchMeEntityFollows } from './entityFollowApi';

export const useEntityFollows = (enabled: boolean) => {
  const query = useQuery({
    queryKey: entityFollowsQueryKey,
    queryFn: () => fetchMeEntityFollows(),
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
