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

  const pendingWire = card.viewerAccess?.mapPeekActions?.find(
    (action) => action.id === 'pending_join'
  );
  // Bare `join_request` (invite / guide, no pending_join wire) is not pending —
  // peek already shows request_join. Do not invent a pending UI state.
  if (pendingWire) {
    const status = pendingWire.joinRequestStatus === 'waitlisted' ? 'waitlisted' : 'pending';
    return {
      kind: 'pending',
      requestId: 'wire',
      status,
    };
  }

  const level = card.viewerAccess?.level;
  if (level === 'participant' || level === 'activity_group_member') {
    return { kind: 'confirmed', requestId: 'wire' };
  }

  return undefined;
};