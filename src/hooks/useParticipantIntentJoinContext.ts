import { useCallback, useState } from 'react';
import type { ParticipantIntentJoinRequestDTO } from '@uaetrail/shared-types';
import { fetchMyParticipantIntentJoinRequest } from './participantIntentClientApi';
import type { JoinRequestUiState } from '../utils/joinRequestUi';
import { useSafeAsyncEffect, type IsActiveGuard } from './useSafeAsyncEffect';

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

  const reload = useCallback(
    async (isActive: IsActiveGuard = () => true) => {
      if (!intentId || !userId) {
        if (isActive()) {
          setRequest(null);
        }
        return;
      }
      if (isActive()) {
        setLoading(true);
      }
      try {
        const row = await fetchMyParticipantIntentJoinRequest(intentId);
        if (isActive()) {
          setRequest(row);
        }
      } catch {
        if (isActive()) {
          setRequest(null);
        }
      } finally {
        if (isActive()) {
          setLoading(false);
        }
      }
    },
    [intentId, userId]
  );

  useSafeAsyncEffect(
    async (isActive) => {
      if (!enabled || !intentId || !userId) {
        setRequest(null);
        setLoading(false);
        return;
      }
      await reload(isActive);
    },
    [enabled, intentId, userId, reload]
  );

  const uiState = resolveParticipantIntentJoinUiState(request);

  return { request, uiState, loading, reload };
};
