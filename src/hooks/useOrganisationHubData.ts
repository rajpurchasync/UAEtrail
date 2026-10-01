import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/index';
import { getActiveTenantId, setActiveTenantId } from '../api/tenant';
import { useOrganisationGate } from './useOrganisationGate';
import { useAuth } from '../context/AuthContext';

const organisationHubKey = (tenantId: string) => ['organisation-hub', tenantId] as const;

async function fetchOrganisationHub(tenantId: string) {
  const [activitiesResponse, requestsResponse] = await Promise.all([
    api.listOrganisationActivities(tenantId),
    api.getOrganisationJoinRequests(tenantId),
  ]);
  const requests = requestsResponse.data;
  return {
    activities: activitiesResponse.data,
    requests,
    pendingJoinRequests: requests.filter((request) => request.status === 'pending').length,
  };
}

/** Organisation console hub data for the active tenant (`/host/*` routes). */
export const useOrganisationHubData = () => {
  const { user } = useAuth();
  const gate = useOrganisationGate({ enabled: Boolean(user) });
  const storedTenantId = getActiveTenantId();
  const tenantId = gate.tenantId ?? (storedTenantId || null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (gate.tenantId && gate.tenantId !== getActiveTenantId()) {
      setActiveTenantId(gate.tenantId);
    }
  }, [gate.tenantId]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: tenantId ? organisationHubKey(tenantId) : ['organisation-hub', 'none'],
    queryFn: () => fetchOrganisationHub(tenantId!),
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
      await queryClient.invalidateQueries({ queryKey: organisationHubKey(tenantId) });
    }
    await refetch();
  }, [queryClient, refetch, tenantId]);

  const requests = data?.requests ?? [];

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === 'pending'),
    [requests]
  );

  const loading = gate.loading || (Boolean(tenantId) && isLoading);

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
    error: error instanceof Error ? error.message : error ? 'Failed to load host data' : null,
    reload,
  };
};

/** @deprecated Use useOrganisationHubData */
export const useHostHubData = useOrganisationHubData;
