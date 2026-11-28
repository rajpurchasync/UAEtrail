/**
 * Host join queue (`GET/PATCH /publishing/requests`) — tenant scope + `x-tenant-id`.
 * Pair with `activityJoinClientEffects.afterHostJoinDecisionClientRefresh` after approve/reject.
 */
import type { ActivityRequestView } from '../api/types';
import { api } from '../api/index';

export type { ActivityRequestView };

export const getActivityJoinRequests = async (
  tenantId: string,
  options?: { activityId?: string }
): Promise<ActivityRequestView[]> => {
  const res = await api.getPublishingActivityJoinRequests(tenantId, options);
  return res.data;
};

export const decideActivityJoinRequest = async (
  tenantId: string,
  requestId: string,
  status: 'approved' | 'rejected',
  hostNote?: string
): Promise<void> => {
  await api.decideActivityJoinRequest(tenantId, requestId, status, hostNote);
};
