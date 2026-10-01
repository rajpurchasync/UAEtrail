import { useCallback, useEffect, useState } from 'react';
import type { ParticipantIntentJoinRequestViewDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { AppButton } from '../mobile/AppButton';

type ParticipantIntentJoinRequestsSectionProps = {
  intentId: string;
};

export const ParticipantIntentJoinRequestsSection = ({
  intentId,
}: ParticipantIntentJoinRequestsSectionProps) => {
  const [requests, setRequests] = useState<ParticipantIntentJoinRequestViewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listParticipantIntentJoinRequests(intentId);
      setRequests(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load join requests.');
    } finally {
      setLoading(false);
    }
  }, [intentId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const pending = requests.filter((entry) => entry.status === 'pending');
  const decided = requests.filter((entry) => entry.status !== 'pending');

  const handleDecision = async (requestId: string, decision: 'approve' | 'reject') => {
    setBusyId(requestId);
    setError(null);
    try {
      if (decision === 'approve') {
        await api.approveParticipantIntentJoinRequest(intentId, requestId);
      } else {
        await api.rejectParticipantIntentJoinRequest(intentId, requestId);
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this request.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading join requests…</p>;
  }

  if (pending.length === 0 && decided.length === 0) {
    return (
      <p className="rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
        When someone requests to join, you&apos;ll see them here to approve or decline.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Join requests</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {pending.map((request) => (
        <div
          key={request.id}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-3 space-y-2"
        >
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {request.requester?.displayName ?? 'Member'}
            </p>
            {request.note ? (
              <p className="mt-1 text-xs text-neutral-600 line-clamp-3">{request.note}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <AppButton
              type="button"
              className="flex-1"
              disabled={busyId === request.id}
              onClick={() => void handleDecision(request.id, 'approve')}
            >
              Approve
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={busyId === request.id}
              onClick={() => void handleDecision(request.id, 'reject')}
            >
              Decline
            </AppButton>
          </div>
        </div>
      ))}
      {decided.length > 0 ? (
        <ul className="space-y-1 text-xs text-neutral-500">
          {decided.slice(0, 5).map((request) => (
            <li key={request.id}>
              {request.requester?.displayName ?? 'Member'} — {request.status}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
