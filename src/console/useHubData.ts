import { useCallback, useEffect, useMemo } from 'react';
import { isPublishedActivityStatus } from '@uaetrail/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { getActiveTenantId, setActiveTenantId } from '../api/tenant';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { useAuth } from '../context/AuthContext';
import {
  invalidatePublishingWorkspaceQueries,
  usePublishingJoinQueue,
  usePublishingTenantActivities,
} from '../hooks/publishingWorkspaceQueries';

type ConsoleHubOptions = {
  /** When false, only join queue loads (Host Hub lists use scoped `/publishing/activities` filters). */
  fetchActivities?: boolean;
};

/** Publishing workspace hub: join queue (+ optional full activity list) for active tenant. */
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

  const activitiesQuery = usePublishingTenantActivities(tenantId, enabled && fetchActivities);
  const joinQueueQuery = usePublishingJoinQueue(tenantId, enabled);

  const activities = useMemo(
    () => (fetchActivities ? activitiesQuery.data ?? [] : []),
    [activitiesQuery.data, fetchActivities]
  );

  const draftCount = useMemo(
    () => activities.filter((item) => item.status === 'draft').length,
    [activities]
  );

  const publishedCount = useMemo(
    () => activities.filter((item) => isPublishedActivityStatus(item.status)).length,
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
    invalidatePublishingWorkspaceQueries(queryClient, tenantId);
    await Promise.all([
      joinQueueQuery.refetch(),
      fetchActivities ? activitiesQuery.refetch() : Promise.resolve(),
    ]);
  }, [activitiesQuery, fetchActivities, joinQueueQuery, queryClient, tenantId]);

  const requests = useMemo(() => joinQueueQuery.data ?? [], [joinQueueQuery.data]);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === 'pending'),
    [requests]
  );

  const queryLoading =
    joinQueueQuery.isLoading || (fetchActivities && activitiesQuery.isLoading);
  const loading = hostStatus.loading || (Boolean(tenantId) && queryLoading);

  const queryError = joinQueueQuery.error ?? (fetchActivities ? activitiesQuery.error : null);

  return {
    tenantId,
    setTenantId: setActiveTenantId,
    activities,
    requests,
    pendingRequests,
    pendingJoinRequests: pendingRequests.length,
    publishedCount,
    draftCount,
    upcomingActivitiesCount,
    pastActivitiesCount,
    upcomingActivities,
    loading,
    error:
      queryError instanceof Error
        ? queryError.message
        : queryError
          ? 'Failed to load console data'
          : null,
    reload,
  };
};
