import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ParticipantIntentJoinRequestDTO } from '@uaetrail/shared-types';
import { fetchMyParticipantIntentJoinRequest } from './participantIntentClientApi';
import type { JoinRequestUiState } from '../utils/joinRequestUi';
import { participantIntentJoinRequestQueryKey } from './clientQueryKeys';

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
  const queryClient = useQueryClient();
  const active = enabled && Boolean(intentId) && Boolean(userId);

  const query = useQuery({
    queryKey:
      intentId && userId
        ? participantIntentJoinRequestQueryKey(intentId, userId)
        : ['participant-intent-join-request', '', ''],
    queryFn: () => fetchMyParticipantIntentJoinRequest(intentId!),
    enabled: active,
    staleTime: 15_000,
  });

  const reload = useCallback(async () => {
    if (!intentId || !userId) return;
    await queryClient.invalidateQueries({
      queryKey: participantIntentJoinRequestQueryKey(intentId, userId),
    });
    await query.refetch();
  }, [intentId, userId, query, queryClient]);

  const request = active ? (query.data ?? null) : null;
  const uiState = resolveParticipantIntentJoinUiState(request);

  return { request, uiState, loading: active && query.isLoading, reload };
};
