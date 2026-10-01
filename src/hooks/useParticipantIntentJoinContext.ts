import { useCallback, useEffect, useState } from 'react';
import type { ParticipantIntentJoinRequestDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

export const resolveParticipantIntentJoinUiState = (
  request: ParticipantIntentJoinRequestDTO | null | undefined
): JoinRequestUiState => {
  if (!request) return { kind: 'open' };
  if (request.status === 'approved') {
    return { kind: 'confirmed', requestId: request.id };
  }
  if (request.status === 'pending') {
    return { kind: 'pending', requestId: request.id, status: 'pending' };
  }
  return { kind: 'open' };
};

export type UseParticipantIntentJoinContextOptions = {
  intentId: string | null | undefined;
  enabled?: boolean;
  userId?: string | null;
};

export const useParticipantIntentJoinContext = ({
  intentId,
  enabled = true,
  userId,
}: UseParticipantIntentJoinContextOptions) => {
  const [request, setRequest] = useState<ParticipantIntentJoinRequestDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!intentId || !userId) {
      setRequest(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getMyParticipantIntentJoinRequest(intentId);
      setRequest(res.data);
    } catch {
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [intentId, userId]);

  useEffect(() => {
    if (!enabled || !intentId || !userId) {
      setRequest(null);
      setLoading(false);
      return;
    }
    void reload();
  }, [enabled, intentId, userId, reload]);

  const uiState = resolveParticipantIntentJoinUiState(request);

  return { request, uiState, loading, reload };
};
