import { useQuery } from '@tanstack/react-query';
import { fetchPublicActivityDetail } from './publicActivityClientApi';
import { activityDetailQueryKey } from './clientQueryKeys';
import { useAuth } from '../context/AuthContext';

export { fetchPublicActivityDetail, type PublicActivityDetailPayload } from './publicActivityClientApi';

export const usePublicActivityDetail = (activityId: string | undefined) => {
  const { user, initializing } = useAuth();
  const viewerScope = user?.id ?? 'guest';
  const viewerIdForFetch = user?.id ?? (initializing ? undefined : null);
  const query = useQuery({
    queryKey: activityId ? activityDetailQueryKey(activityId, viewerScope) : ['activity', '', viewerScope],
    queryFn: () => fetchPublicActivityDetail(activityId!, viewerIdForFetch),
    enabled: Boolean(activityId) && !initializing,
  });

  return {
    activity: query.data?.activity ?? null,
    viewerAccess: query.data?.viewerAccess ?? null,
    wirePresentation: query.data?.presentation ?? null,
    participation: query.data?.participation ?? null,
    myRequest: query.data?.myRequest ?? null,
    loading: query.isLoading || initializing,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};
