import { useQuery } from '@tanstack/react-query';
import { fetchMyActivityJoinRequests } from './planUpcomingApi';
import { myActivityJoinRequestsQueryKey } from './clientQueryKeys';

/** Pending / approved join requests (`GET /me/requests`) — plan joined strip + calendar (R8.2). */
export const useMyActivityJoinRequests = (enabled = true, refreshKey = 0) => {
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [...myActivityJoinRequestsQueryKey, refreshKey],
    queryFn: () => fetchMyActivityJoinRequests(),
    enabled,
  });

  return {
    requests: data ?? [],
    loading: enabled && (isLoading || isFetching),
    error: isError ? 'Could not load your join requests.' : null,
    refetch,
  };
};
