import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

/**
 * List feed cards carry server `viewerAccess` (level + `mapPeekActions`).
 * Map peek also merges live `useActivityJoinContext` — list rows should read wire
 * when client context is not loaded for that card yet.
 */
export const inferJoinUiStateFromDiscoveryCard = (
  card: DiscoveryCardModel,
  clientJoinUi?: JoinRequestUiState
): JoinRequestUiState | undefined => {
  if (clientJoinUi) return clientJoinUi;
  if (card.source !== 'activity') return undefined;

  const level = card.viewerAccess?.level;
  const pendingWire = card.viewerAccess?.mapPeekActions?.find(
    (action) => action.id === 'pending_join'
  );

  if (pendingWire || level === 'join_request') {
    const status = pendingWire?.joinRequestStatus ?? 'pending';
    return {
      kind: 'pending',
      requestId: 'wire',
      status: status === 'waitlisted' ? 'waitlisted' : 'pending',
    };
  }

  if (level === 'participant' || level === 'activity_group_member') {
    return { kind: 'confirmed', requestId: 'wire' };
  }

  return undefined;
};