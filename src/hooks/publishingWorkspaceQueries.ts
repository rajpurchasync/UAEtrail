import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { CATALOG_FRESH_MS } from '../lib/catalogSnapshot';
import { getActivityJoinRequests } from './publishingJoinQueueClientApi';
import { getActivityHistory, listActivities } from './tenantActivityClientApi';

export const publishingTenantActivitiesQueryKey = (tenantId: string) =>
  ['publishing', 'activities', tenantId] as const;

export const publishingJoinQueueQueryKey = (tenantId: string) =>
  ['publishing', 'join-queue', tenantId] as const;

export const publishingActivityHistoryQueryKey = (tenantId: string) =>
  ['publishing', 'activity-history', tenantId] as const;

export const planHostedActivitiesQueryRoot = (tenantId: string) =>
  ['plan-hosted-activities', tenantId] as const;

export const invalidatePublishingWorkspaceQueries = (
  queryClient: QueryClient,
  tenantId: string | null | undefined
): void => {
  if (!tenantId) return;
  void queryClient.invalidateQueries({ queryKey: publishingTenantActivitiesQueryKey(tenantId) });
  void queryClient.invalidateQueries({ queryKey: publishingJoinQueueQueryKey(tenantId) });
  void queryClient.invalidateQueries({ queryKey: publishingActivityHistoryQueryKey(tenantId) });
  void queryClient.invalidateQueries({ queryKey: planHostedActivitiesQueryRoot(tenantId) });
  void queryClient.invalidateQueries({ queryKey: ['plan-hosted-copy', tenantId] });
  void queryClient.invalidateQueries({ queryKey: ['plan-hosted-past-preview', tenantId] });
  void queryClient.invalidateQueries({ queryKey: ['console-hub', tenantId] });
};

/** Full tenant activity list — cached; prefer scoped plan-hosted queries on Host Hub. */
export const usePublishingTenantActivities = (tenantId: string | null, enabled = true) =>
  useQuery({
    queryKey: tenantId
      ? publishingTenantActivitiesQueryKey(tenantId)
      : ['publishing', 'activities', 'none'],
    queryFn: () => listActivities(tenantId!),
    enabled: enabled && Boolean(tenantId),
    staleTime: CATALOG_FRESH_MS,
  });

/** Join approvals queue — shared by Host Hub, Overview, Join requests, Activities. */
export const usePublishingJoinQueue = (tenantId: string | null, enabled = true) =>
  useQuery({
    queryKey: tenantId
      ? publishingJoinQueueQueryKey(tenantId)
      : ['publishing', 'join-queue', 'none'],
    queryFn: () => getActivityJoinRequests(tenantId!),
    enabled: enabled && Boolean(tenantId),
    staleTime: CATALOG_FRESH_MS,
  });

/** Past check-in history — only load when History page is open. */
export const usePublishingActivityHistory = (tenantId: string | null, enabled = true) =>
  useQuery({
    queryKey: tenantId
      ? publishingActivityHistoryQueryKey(tenantId)
      : ['publishing', 'activity-history', 'none'],
    queryFn: () => getActivityHistory(tenantId!),
    enabled: enabled && Boolean(tenantId),
    staleTime: CATALOG_FRESH_MS,
  });

/** Invalidate workspace caches after host mutations (suspend, delete, publish, …). */
export const useInvalidatePublishingWorkspace = (tenantId: string | null) => {
  const queryClient = useQueryClient();
  return useCallback(() => {
    invalidatePublishingWorkspaceQueries(queryClient, tenantId);
  }, [queryClient, tenantId]);
};
