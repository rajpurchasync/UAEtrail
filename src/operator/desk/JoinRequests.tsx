import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { afterHostJoinDecisionClientRefresh } from '../../hooks/activityJoinClientEffects';
import {
  decideActivityJoinRequest,
  type ActivityRequestView,
} from '../../hooks/operatorWorkspaceJoinQueueClientApi';
import {
  useInvalidateOperatorWorkspace,
  useOperatorWorkspaceJoinQueue,
} from '../../hooks/operatorWorkspaceQueries';
import { getActiveTenantId } from '../../api/tenant';
import { ConsoleShell } from './ConsoleShell';
import { ActivityJoinRequestCard } from './ActivityJoinRequestCard';
import { TenantSwitcher } from '../../components/ui';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import { GlassCard } from '../../components/mobile/GlassCard';
import { ActivityJoinRequestDeclineDialog } from './ActivityJoinRequestDeclineDialog';
import { LoadingRing } from '../../components/ui/loadingPrimitives';
import { resolveJoinRequestActivity } from '../../utils/joinRequestActivity';

type RequestFilter = 'pending' | 'all';

export const JoinRequests = () => {
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [filter, setFilter] = useState<RequestFilter>('pending');
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [declineRequest, setDeclineRequest] = useState<ActivityRequestView | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const joinQueueQuery = useOperatorWorkspaceJoinQueue(tenantId, Boolean(tenantId));
  const invalidateWorkspace = useInvalidateOperatorWorkspace(tenantId);

  const requests = useMemo(() => joinQueueQuery.data ?? [], [joinQueueQuery.data]);
  const loading = Boolean(tenantId) && joinQueueQuery.isLoading && !joinQueueQuery.data;
  const error =
    actionError ??
    (joinQueueQuery.error instanceof Error
      ? joinQueueQuery.error.message
      : joinQueueQuery.error
        ? 'Failed to load requests'
        : null);

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

  const refreshQueue = async () => {
    invalidateWorkspace();
    await joinQueueQuery.refetch();
  };

  const submitDecline = async (hostNote: string) => {
    if (!tenantId || !declineRequest) return;
    setBusyRequestId(declineRequest.id);
    setActionError(null);
    try {
      await decideActivityJoinRequest(tenantId, declineRequest.id, 'rejected', hostNote);
      const activityId = resolveJoinRequestActivity(declineRequest)?.id;
      if (activityId) {
        await afterHostJoinDecisionClientRefresh(queryClient, {
          activityId,
          status: 'rejected',
        });
      }
      setDeclineRequest(null);
      await refreshQueue();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to process request');
    } finally {
      setBusyRequestId(null);
    }
  };

  const quickDecide = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!tenantId) return;
    setBusyRequestId(requestId);
    setActionError(null);
    try {
      await decideActivityJoinRequest(tenantId, requestId, status);
      const row = requests.find((request) => request.id === requestId);
      const activityId = row ? resolveJoinRequestActivity(row)?.id : undefined;
      if (activityId) {
        await afterHostJoinDecisionClientRefresh(queryClient, { activityId, status });
      }
      await refreshQueue();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to process request');
    } finally {
      setBusyRequestId(null);
    }
  };

  return (
    <ConsoleShell title="Join Requests">
      <div className="space-y-4 pb-20">
        <TenantSwitcher onChange={setTenantId} />
        {error ? (
          <GlassCard padding className="border-red-200/50 bg-red-50/50">
            <p className="text-sm text-red-600">{error}</p>
          </GlassCard>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Join requests</h2>
            {pendingCount > 0 ? (
              <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
                {pendingCount} waiting for your response
              </p>
            ) : null}
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

        {loading ? (
          <div className="flex justify-center py-10" role="status" aria-label="Loading">
            <LoadingRing size="md" />
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard padding>
            <p className="text-sm text-neutral-600">
              {filter === 'pending' ? 'No pending join requests.' : 'No join requests yet.'}
            </p>
          </GlassCard>
        ) : (
          <div className="app-zebra space-y-2">
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
