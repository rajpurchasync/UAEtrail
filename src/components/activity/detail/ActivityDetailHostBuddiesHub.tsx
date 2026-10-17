import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { afterHostJoinDecisionClientRefresh } from '../../../hooks/activityJoinClientEffects';
import type { ActivityRequestView } from '../../../api/types';
import { decideActivityJoinRequest } from '../../../hooks/tenantActivityClientApi';
import { ActivityJoinRequestCard } from '../../../console/ActivityJoinRequestCard';
import { ActivityJoinRequestDeclineDialog } from '../../../console/ActivityJoinRequestDeclineDialog';
import { ActivityParticipantsPanel } from '../ActivityParticipantsPanel';

type ActivityDetailHostBuddiesHubProps = {
  tenantId: string;
  activityId: string;
  activityTitle: string;
  joinRequests: ActivityRequestView[];
  requestsLoading: boolean;
  onRequestsChanged: () => void | Promise<void>;
  onError?: (message: string) => void;
};

/** Host primary manage surface on Buddies tab (v3.2 — no fifth Manage tab). */
export const ActivityDetailHostBuddiesHub = ({
  tenantId,
  activityId,
  activityTitle,
  joinRequests,
  requestsLoading,
  onRequestsChanged,
  onError,
}: ActivityDetailHostBuddiesHubProps) => {
  const queryClient = useQueryClient();
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [declineRequest, setDeclineRequest] = useState<ActivityRequestView | null>(null);

  const decideRequest = useCallback(
    async (requestId: string, status: 'approved' | 'rejected', hostNote?: string) => {
      if (!tenantId) return;
      setBusyRequestId(requestId);
      try {
        await decideActivityJoinRequest(tenantId, requestId, status, hostNote);
        await afterHostJoinDecisionClientRefresh(queryClient, { activityId, status });
        if (status === 'rejected') setDeclineRequest(null);
        await onRequestsChanged();
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Could not update request.');
      } finally {
        setBusyRequestId(null);
      }
    },
    [activityId, queryClient, tenantId, onRequestsChanged, onError]
  );

  return (
    <div className="space-y-5">
      <ActivityParticipantsPanel
        tenantId={tenantId}
        activityId={activityId}
        activityTitle={activityTitle}
        onError={onError}
      />
      <section className="space-y-2 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-neutral-800">
          Pending requests
          {joinRequests.length > 0 ? ` (${joinRequests.length})` : ''}
        </h3>
        {requestsLoading ? (
          <p className="text-sm text-neutral-500">Loading requests…</p>
        ) : joinRequests.length === 0 ? (
          <p className="text-sm text-neutral-500">No pending requests for this outing.</p>
        ) : (
          joinRequests.map((request) => (
            <ActivityJoinRequestCard
              key={request.id}
              request={request}
              busy={busyRequestId === request.id}
              onApprove={() => void decideRequest(request.id, 'approved')}
              onReject={() => setDeclineRequest(request)}
            />
          ))
        )}
      </section>
      <ActivityJoinRequestDeclineDialog
        open={Boolean(declineRequest)}
        request={declineRequest}
        submitting={busyRequestId === declineRequest?.id}
        onClose={() => setDeclineRequest(null)}
        onConfirm={(hostNote) => {
          if (!declineRequest) return;
          void decideRequest(declineRequest.id, 'rejected', hostNote);
        }}
      />
    </div>
  );
};
