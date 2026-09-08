import { useEffect, useMemo, useState } from 'react';
import { api, ActivityRequestView } from '../api/services';
import { getActiveTenantId } from '../api/tenant';
import { HostShell } from '../components/host/HostShell';
import { HostJoinRequestCard } from '../components/host/HostJoinRequestCard';
import { TenantSwitcher } from '../components/ui';
import { AppSegmented } from '../components/mobile/AppSegmented';
import { GlassCard } from '../components/mobile/GlassCard';
import { Dialog } from '../components/ui/Dialog';
import { AppButton } from '../components/mobile/AppButton';

type RequestFilter = 'pending' | 'all';

export const HostRequests = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [requests, setRequests] = useState<ActivityRequestView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestFilter>('pending');
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    request: ActivityRequestView;
    action: 'approved' | 'rejected';
  } | null>(null);
  const [hostNote, setHostNote] = useState('');

  const loadRequests = async (activeTenantId: string) => {
    if (!activeTenantId) return;
    try {
      const res = await api.getHostRequests(activeTenantId);
      setRequests(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    }
  };

  useEffect(() => {
    void loadRequests(tenantId);
  }, [tenantId]);

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

  const submitDecision = async () => {
    if (!tenantId || !decisionModal) return;
    setBusyRequestId(decisionModal.request.id);
    try {
      await api.decideHostRequest(
        tenantId,
        decisionModal.request.id,
        decisionModal.action,
        hostNote || undefined
      );
      setDecisionModal(null);
      setHostNote('');
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
      await api.decideHostRequest(tenantId, requestId, status);
      await loadRequests(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request');
    } finally {
      setBusyRequestId(null);
    }
  };

  return (
    <HostShell title="Join Requests">
      <div className="space-y-4">
        <TenantSwitcher onChange={setTenantId} />
        {error && (
          <GlassCard padding className="border-red-200/50 bg-red-50/50">
            <p className="text-sm text-red-600">{error}</p>
          </GlassCard>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Join requests</h2>
            {pendingCount > 0 && (
              <p className="text-sm text-amber-700 mt-0.5">{pendingCount} waiting for your response</p>
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
              <HostJoinRequestCard
                key={request.id}
                request={request}
                busy={busyRequestId === request.id}
                showActions={request.status === 'pending'}
                onApprove={() => void quickDecide(request.id, 'approved')}
                onReject={() => setDecisionModal({ request, action: 'rejected' })}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(decisionModal)}
        onClose={() => setDecisionModal(null)}
        title={decisionModal?.action === 'approved' ? 'Approve request' : 'Decline request'}
      >
        {decisionModal && (
          <>
            <div className="rounded-xl bg-neutral-50 p-3 mb-4">
              <p className="text-sm font-semibold text-neutral-900">
                {decisionModal.request.user?.displayName ?? 'Guest'}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {decisionModal.request.activity.title || decisionModal.request.activity.locationName}
              </p>
              {decisionModal.request.note && (
                <p className="text-xs text-neutral-600 mt-2 italic">&ldquo;{decisionModal.request.note}&rdquo;</p>
              )}
            </div>

            <label className="text-sm font-medium text-neutral-700 mb-1 block">
              Optional note to the guest
            </label>
            <textarea
              value={hostNote}
              onChange={(event) => setHostNote(event.target.value)}
              placeholder={
                decisionModal.action === 'approved'
                  ? 'Welcome — see you on the trail!'
                  : 'Sorry, this trip is full.'
              }
              className="w-full border rounded-xl px-3 py-2 text-sm mb-4"
              rows={3}
            />

            <div className="flex justify-end gap-2">
              <AppButton type="button" variant="secondary" onClick={() => setDecisionModal(null)}>
                Cancel
              </AppButton>
              <AppButton
                type="button"
                variant={decisionModal.action === 'approved' ? 'primary' : 'destructive'}
                disabled={Boolean(busyRequestId)}
                onClick={() => void submitDecision()}
              >
                {decisionModal.action === 'approved' ? 'Approve' : 'Decline'}
              </AppButton>
            </div>
          </>
        )}
      </Dialog>
    </HostShell>
  );
};
