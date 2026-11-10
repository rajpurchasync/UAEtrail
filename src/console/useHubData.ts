import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getActivityJoinRequests } from '../hooks/publishingJoinQueueClientApi';
import { listActivities } from '../hooks/tenantActivityClientApi';
import { getActiveTenantId, setActiveTenantId } from '../api/tenant';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { useAuth } from '../context/AuthContext';
import { CATALOG_FRESH_MS } from '../lib/catalogSnapshot';

const consoleHubKey = (tenantId: string, fetchActivities: boolean) =>
  ['console-hub', tenantId, fetchActivities ? 'full' : 'queue'] as const;

async function fetchConsoleHub(tenantId: string, fetchActivities: boolean) {
  const requests = await getActivityJoinRequests(tenantId);
  const activities = fetchActivities ? await listActivities(tenantId) : [];
  return {
    activities,
    requests,
    pendingJoinRequests: requests.filter((request) => request.status === 'pending').length,
  };
}

type ConsoleHubOptions = {
  /** When false, only join queue loads (plan desktop hosting hub lists use scoped `/publishing/activities` filters). */
  fetchActivities?: boolean;
};

/** Publishing workspace hub: activities + join queue for active tenant. */
export const useConsoleHubData = (enabled = true, options?: ConsoleHubOptions) => {
  const fetchActivities = options?.fetchActivities !== false;
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
    queryKey: tenantId ? consoleHubKey(tenantId, fetchActivities) : ['console-hub', 'none'],
    queryFn: () => fetchConsoleHub(tenantId!, fetchActivities),
    enabled: enabled && Boolean(tenantId),
    staleTime: CATALOG_FRESH_MS,
  });

  const activities = useMemo(() => data?.activities ?? [], [data?.activities]);

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
      await queryClient.invalidateQueries({ queryKey: ['console-hub', tenantId] });
    }
    await refetch();
  }, [queryClient, refetch, tenantId]);

  const requests = useMemo(() => data?.requests ?? [], [data?.requests]);

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