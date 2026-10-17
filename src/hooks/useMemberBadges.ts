import { useQuery } from '@tanstack/react-query';
import { fetchMemberBadges } from './memberProfileApi';
import { memberBadgesQueryKey } from './clientQueryKeys';

export const useMemberBadges = (userId: string | undefined) => {
  const query = useQuery({
    queryKey: userId ? memberBadgesQueryKey(userId) : ['me', 'badges', ''],
    queryFn: () => fetchMemberBadges(),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  return {
    badges: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.isError ? 'Could not load badges' : null,
    refetch: query.refetch,
  };
};
