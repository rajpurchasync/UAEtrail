import { useQuery } from '@tanstack/react-query';
import { fetchMyJoinedActivities } from './planUpcomingApi';
import { myJoinedActivitiesQueryKey } from './clientQueryKeys';

/** Member outings list (`GET /me/activities`) — plan rails and wishlist match filtering (R8.2). */
export const useMyJoinedActivities = (enabled = true, refreshKey = 0) => {
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [...myJoinedActivitiesQueryKey, refreshKey],
    queryFn: () => fetchMyJoinedActivities(),
    enabled,
  });

  return {
    activities: data ?? [],
    loading: enabled && (isLoading || isFetching),
    error: isError ? 'Could not load your outings.' : null,
    refetch,
  };
};
