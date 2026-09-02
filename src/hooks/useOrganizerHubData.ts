import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/services';
import { getActiveTenantId } from '../api/tenant';

const organizerHubKey = (tenantId: string) => ['organizer-hub', tenantId] as const;

async function fetchOrganizerHub(tenantId: string) {
  const [eventsResponse, requestsResponse] = await Promise.all([
    api.listHostActivities(tenantId),
    api.getOrganizerRequests(tenantId),
  ]);
  return {
    events: eventsResponse.data,
    pendingJoinRequests: requestsResponse.data.filter((request) => request.status === 'pending').length,
  };
}

export const useOrganizerHubData = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: tenantId ? organizerHubKey(tenantId) : ['organizer-hub', 'none'],
    queryFn: () => fetchOrganizerHub(tenantId!),
    enabled: Boolean(tenantId),
  });

  const events = data?.events ?? [];

  const draftCount = useMemo(
    () => events.filter((item) => item.status === 'draft').length,
    [events]
  );

  const publishedCount = useMemo(
    () => events.filter((item) => item.status === 'published').length,
    [events]
  );

  const upcomingEventsCount = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return events.filter((e) => new Date(e.date) >= today).length;
  }, [events]);

  const pastEventsCount = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return events.filter((e) => new Date(e.date) < today).length;
  }, [events]);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3),
    [events]
  );

  const reload = useCallback(async () => {
    if (tenantId) {
      await queryClient.invalidateQueries({ queryKey: organizerHubKey(tenantId) });
    }
    await refetch();
  }, [queryClient, refetch, tenantId]);

  return {
    tenantId,
    setTenantId,
    events,
    pendingJoinRequests: data?.pendingJoinRequests ?? 0,
    publishedCount,
    draftCount,
    upcomingEventsCount,
    pastEventsCount,
    upcomingEvents,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? 'Failed to load organizer data' : null,
    reload,
  };
};
