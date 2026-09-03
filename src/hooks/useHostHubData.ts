import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/services';
import { getActiveTenantId } from '../api/tenant';

const hostHubKey = (tenantId: string) => ['host-hub', tenantId] as const;

async function fetchHostHub(tenantId: string) {
  const [activitiesResponse, requestsResponse] = await Promise.all([
    api.listHostActivities(tenantId),
    api.getHostRequests(tenantId),
  ]);
  return {
    activities: activitiesResponse.data,
    pendingJoinRequests: requestsResponse.data.filter((request) => request.status === 'pending').length,
  };
}

export const useHostHubData = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: tenantId ? hostHubKey(tenantId) : ['host-hub', 'none'],
    queryFn: () => fetchHostHub(tenantId!),
    enabled: Boolean(tenantId),
  });

  const activities = data?.activities ?? [];

  const draftCount = useMemo(
    () => activities.filter((item) => item.status === 'draft').length,
    [activities]
  );

  const publishedCount = useMemo(
    () => activities.filter((item) => item.status === 'published').length,
    [activities]
  );

  const upcomingActivitiesCount = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return activities.filter((e) => new Date(e.date) >= today).length;
  }, [activities]);

  const pastActivitiesCount = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return activities.filter((e) => new Date(e.date) < today).length;
  }, [activities]);

  const upcomingActivities = useMemo(
    () =>
      activities
        .filter((e) => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3),
    [activities]
  );

  const reload = useCallback(async () => {
    if (tenantId) {
      await queryClient.invalidateQueries({ queryKey: hostHubKey(tenantId) });
    }
    await refetch();
  }, [queryClient, refetch, tenantId]);

  return {
    tenantId,
    setTenantId,
    activities,
    pendingJoinRequests: data?.pendingJoinRequests ?? 0,
    publishedCount,
    draftCount,
    upcomingActivitiesCount,
    pastActivitiesCount,
    upcomingActivities,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? 'Failed to load host data' : null,
    reload,
  };
};

/** @deprecated Use useHostHubData */
export const useOrganizerHubData = useHostHubData;
