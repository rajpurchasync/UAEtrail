import { useQuery } from '@tanstack/react-query';
import { catalogFreshQueryOptions, loadCachedCatalog } from '../lib/catalogSnapshot';
import { fetchMyJoinedActivitiesConditional } from './planUpcomingApi';
import { myJoinedActivitiesQueryKey } from './clientQueryKeys';
import type { MyActivityDTO } from '@uaetrail/shared-types';

/** Member outings list (`GET /me/activities`) — plan rails and wishlist match filtering (R8.2). */
export const useMyJoinedActivities = (enabled = true, refreshKey = 0) => {
  const queryKey = [...myJoinedActivitiesQueryKey, refreshKey];
  const { data, isPending, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => loadCachedCatalog(queryKey, (etag) => fetchMyJoinedActivitiesConditional(etag)),
    enabled,
    ...catalogFreshQueryOptions<MyActivityDTO[]>(queryKey),
  });

  return {
    activities: data ?? [],
    loading: enabled && isPending && data === undefined,
    error: isError ? 'Could not load your outings.' : null,
    refetch,
  };
};
