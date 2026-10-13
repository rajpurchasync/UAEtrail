import { useQuery } from '@tanstack/react-query';
import { fetchPublicActivityDetail } from './publicActivityClientApi';
import { activityDetailQueryKey } from './clientQueryKeys';

export { fetchPublicActivityDetail, type PublicActivityDetailPayload } from './publicActivityClientApi';

export const usePublicActivityDetail = (activityId: string | undefined) => {
  const query = useQuery({
    queryKey: activityId ? activityDetailQueryKey(activityId) : ['activity', ''],
    queryFn: () => fetchPublicActivityDetail(activityId!),
    enabled: Boolean(activityId),
  });

  return {
    activity: query.data?.activity ?? null,
    viewerAccess: query.data?.viewerAccess ?? null,
    wirePresentation: query.data?.presentation ?? null,
    participation: query.data?.participation ?? null,
    myRequest: query.data?.myRequest ?? null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};
