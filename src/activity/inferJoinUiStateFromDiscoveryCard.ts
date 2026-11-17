import { projectJoinRequestUiFromMapPeekWire } from '@uaetrail/shared-types';
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

  return (
    projectJoinRequestUiFromMapPeekWire({
      level: card.viewerAccess?.level,
      mapPeekActions: card.viewerAccess?.mapPeekActions,
    }) ?? undefined
  );
};