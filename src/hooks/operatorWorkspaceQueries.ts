import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { CATALOG_FRESH_MS } from '../lib/catalogSnapshot';
import { getActivityJoinRequests } from './operatorWorkspaceJoinQueueClientApi';
import { getActivityHistory, listActivities } from './tenantActivityClientApi';

const WS = 'operator-workspace' as const;

export const operatorWorkspaceActivitiesQueryKey = (tenantId: string) =>
  [WS, 'activities', tenantId] as const;

export const operatorWorkspaceJoinQueueQueryKey = (tenantId: string) =>
  [WS, 'join-queue', tenantId] as const;

export const operatorWorkspaceActivityHistoryQueryKey = (tenantId: string) =>
  [WS, 'activity-history', tenantId] as const;

export const planHostedActivitiesQueryRoot = (tenantId: string) =>
  ['plan-hosted-activities', tenantId] as const;

export const invalidateOperatorWorkspaceQueries = (
  queryClient: QueryClient,
  tenantId: string | null | undefined
): void => {
  if (!tenantId) return;
  void queryClient.invalidateQueries({ queryKey: operatorWorkspaceActivitiesQueryKey(tenantId) });
  void queryClient.invalidateQueries({ queryKey: operatorWorkspaceJoinQueueQueryKey(tenantId) });
  void queryClient.invalidateQueries({ queryKey: operatorWorkspaceActivityHistoryQueryKey(tenantId) });
  void queryClient.invalidateQueries({ queryKey: planHostedActivitiesQueryRoot(tenantId) });
  void queryClient.invalidateQueries({ queryKey: ['plan-hosted-copy', tenantId] });
  void queryClient.invalidateQueries({ queryKey: ['plan-hosted-past-preview', tenantId] });
  void queryClient.invalidateQueries({ queryKey: ['console-hub', tenantId] });
};

export const useOperatorWorkspaceActivities = (tenantId: string | null, enabled = true) =>
  useQuery({
    queryKey: tenantId ? operatorWorkspaceActivitiesQueryKey(tenantId) : [WS, 'activities', 'none'],
    queryFn: () => listActivities(tenantId!),
    enabled: enabled && Boolean(tenantId),
    staleTime: CATALOG_FRESH_MS,
  });

export const useOperatorWorkspaceJoinQueue = (tenantId: string | null, enabled = true) =>
  useQuery({
    queryKey: tenantId ? operatorWorkspaceJoinQueueQueryKey(tenantId) : [WS, 'join-queue', 'none'],
    queryFn: () => getActivityJoinRequests(tenantId!),
    enabled: enabled && Boolean(tenantId),
    staleTime: CATALOG_FRESH_MS,
  });

export const useOperatorWorkspaceActivityHistory = (tenantId: string | null, enabled = true) =>
  useQuery({
    queryKey: tenantId
      ? operatorWorkspaceActivityHistoryQueryKey(tenantId)
      : [WS, 'activity-history', 'none'],
    queryFn: () => getActivityHistory(tenantId!),
    enabled: enabled && Boolean(tenantId),
    staleTime: CATALOG_FRESH_MS,
  });

export const useInvalidateOperatorWorkspace = (tenantId: string | null) => {
  const queryClient = useQueryClient();
  return useCallback(() => {
    invalidateOperatorWorkspaceQueries(queryClient, tenantId);
  }, [queryClient, tenantId]);
};