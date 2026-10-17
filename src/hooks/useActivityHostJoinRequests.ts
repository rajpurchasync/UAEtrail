import { useQuery } from '@tanstack/react-query';
import type { ActivityRequestView } from '../api/types';
import { getActivityJoinRequests } from './tenantActivityClientApi';
import { activityHostJoinRequestsQueryKey } from './clientQueryKeys';

export const useActivityHostJoinRequests = ({
  tenantId,
  activityId,
  enabled,
}: {
  tenantId: string | null | undefined;
  activityId: string | undefined;
  enabled: boolean;
}) => {
  const query = useQuery({
    queryKey:
      tenantId && activityId
        ? activityHostJoinRequestsQueryKey(tenantId, activityId)
        : ['activity-host-join-requests', '', ''],
    queryFn: async (): Promise<ActivityRequestView[]> => {
      const requests = await getActivityJoinRequests(tenantId!, { activityId: activityId! });
      return requests.filter((request) => request.status === 'pending');
    },
    enabled: enabled && Boolean(tenantId && activityId),
    staleTime: 15_000,
  });

  return {
    joinRequests: query.data ?? [],
    loading: query.isLoading,
    refetch: query.refetch,
  };
};
