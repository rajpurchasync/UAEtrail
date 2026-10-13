import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getActivityJoinRequests, listActivities } from '../hooks/tenantActivityClientApi';
import { getActiveTenantId, setActiveTenantId } from '../api/tenant';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { useAuth } from '../context/AuthContext';

const consoleHubKey = (tenantId: string) => ['console-hub', tenantId] as const;

async function fetchConsoleHub(tenantId: string) {
  const [activities, requests] = await Promise.all([
    listActivities(tenantId),
    getActivityJoinRequests(tenantId),
  ]);
  return {
    activities,
    requests,
    pendingJoinRequests: requests.filter((request) => request.status === 'pending').length,
  };
}

/** `/host/*` console: activities + join queue for active tenant. */
export const useConsoleHubData = () => {
  const { user } = useAuth();
  const hostStatus = useMemberStatus({ enabled: Boolean(user) });
  const storedTenantId = getActiveTenantId();
  const tenantId = hostStatus.tenantId ?? (storedTenantId || null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (hostStatus.tenantId && hostStatus.tenantId !== getActiveTenantId()) {
      setActiveTenantId(hostStatus.tenantId);
    }
  }, [hostStatus.tenantId]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: tenantId ? consoleHubKey(tenantId) : ['console-hub', 'none'],
    queryFn: () => fetchConsoleHub(tenantId!),
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
      await queryClient.invalidateQueries({ queryKey: consoleHubKey(tenantId) });
    }
    await refetch();
  }, [queryClient, refetch, tenantId]);

  const requests = data?.requests ?? [];

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === 'pending'),
    [requests]
  );

  const loading = hostStatus.loading || (Boolean(tenantId) && isLoading);

  return {
    tenantId,
    setTenantId: setActiveTenantId,
    activities,
    requests,
    pendingRequests,
    pendingJoinRequests: data?.pendingJoinRequests ?? 0,
    publishedCount,
    draftCount,
    upcomingActivitiesCount,
    pastActivitiesCount,
    upcomingActivities,
    loading,
    error: error instanceof Error ? error.message : error ? 'Failed to load console data' : null,
    reload,
  };
};