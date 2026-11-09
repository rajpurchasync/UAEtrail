import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useSafeAsyncEffect, type IsActiveGuard } from '../../hooks/useSafeAsyncEffect';
import { afterHostJoinDecisionClientRefresh } from '../../hooks/activityJoinClientEffects';
import type { ActivityRequestView } from '../../hooks/publishingJoinQueueClientApi';
import {
  decideActivityJoinRequest,
  getActivityJoinRequests,
} from '../../hooks/publishingJoinQueueClientApi';
import { getActiveTenantId } from '../../api/tenant';
import { ConsoleShell } from '../../console/ConsoleShell';
import { ActivityJoinRequestCard } from '../../console/ActivityJoinRequestCard';
import { TenantSwitcher } from '../../components/ui';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import { GlassCard } from '../../components/mobile/GlassCard';
import { ActivityJoinRequestDeclineDialog } from '../../console/ActivityJoinRequestDeclineDialog';

type RequestFilter = 'pending' | 'all';

export const JoinRequests = () => {
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [requests, setRequests] = useState<ActivityRequestView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestFilter>('pending');
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [declineRequest, setDeclineRequest] = useState<ActivityRequestView | null>(null);

  const loadRequests = useCallback(async (activeTenantId: string, isActive: IsActiveGuard = () => true) => {
    if (!activeTenantId) return;
    try {
      const rows = await getActivityJoinRequests(activeTenantId);
      if (isActive()) {
        setRequests(rows);
      }
    } catch (err) {
      if (isActive()) {
        setError(err instanceof Error ? err.message : 'Failed to load requests');
      }
    }
  }, []);

  useSafeAsyncEffect(
    async (isActive) => {
      await loadRequests(tenantId, isActive);
    },
    [tenantId, loadRequests]
  );

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === 'pending').length,
    [requests]
  );

  const filtered = useMemo(() => {
    if (filter === 'pending') {
      return requests.filter((request) => request.status === 'pending');
    }
    return requests;
  }, [filter, requests]);

  const submitDecline = async (hostNote: string) => {
    if (!tenantId || !declineRequest) return;
    setBusyRequestId(declineRequest.id);
    try {
      await decideActivityJoinRequest(
        tenantId,
        declineRequest.id,
        'rejected',
        hostNote
      );
      const activityId = declineRequest.activity?.id;
      if (activityId) {
        await afterHostJoinDecisionClientRefresh(queryClient, {
          activityId,
          status: 'rejected',
        });
      }
      setDeclineRequest(null);
      await loadRequests(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request');
    } finally {
      setBusyRequestId(null);
    }
  };

  const quickDecide = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!tenantId) return;
    setBusyRequestId(requestId);
    try {
      await decideActivityJoinRequest(tenantId, requestId, status);
      const row = requests.find((request) => request.id === requestId);
      const activityId = row?.activity?.id;
      if (activityId) {
        await afterHostJoinDecisionClientRefresh(queryClient, { activityId, status });
      }
      await loadRequests(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request');
    } finally {
      setBusyRequestId(null);
    }
  };

  return (
    <ConsoleShell title="Join Requests">
      <div className="space-y-4">
        <TenantSwitcher onChange={setTenantId} />
        {error && (
          <GlassCard padding className="border-red-200/50 bg-red-50/50">
            <p className="text-sm text-red-600">{error}</p>
          </GlassCard>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Join requests</h2>
            {pendingCount > 0 && (
              <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
                {pendingCount} waiting for your response
              </p>
            )}
          </div>
          <AppSegmented
            segments={[
              { key: 'pending', label: `Pending (${pendingCount})` },
              { key: 'all', label: 'All' },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        {filtered.length === 0 ? (
          <GlassCard padding>
            <p className="text-sm text-neutral-600">
              {filter === 'pending' ? 'No pending join requests.' : 'No join requests yet.'}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {filtered.map((request) => (
              <ActivityJoinRequestCard
                key={request.id}
                request={request}
                busy={busyRequestId === request.id}
                showActions={request.status === 'pending'}
                onApprove={() => void quickDecide(request.id, 'approved')}
                onReject={() => setDeclineRequest(request)}
              />
            ))}
          </div>
        )}
      </div>

      <ActivityJoinRequestDeclineDialog
        open={Boolean(declineRequest)}
        request={declineRequest}
        submitting={Boolean(declineRequest && busyRequestId === declineRequest.id)}
        onClose={() => setDeclineRequest(null)}
        onConfirm={submitDecline}
      />
    </ConsoleShell>
  );
};
