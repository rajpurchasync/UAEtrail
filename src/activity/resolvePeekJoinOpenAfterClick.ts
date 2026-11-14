import type { JoinRequestUiState } from '../utils/joinRequestUi';

export type PeekJoinOpenActions = {
  openJoinModal: () => void;
  setShowWithdraw: (open: boolean) => void;
};

/**
 * Map peek + list feed — request_join opens the join modal immediately.
 * While join context is still loading, an empty context resolves to `open` (same as peek defaults).
 */
export const applyPeekJoinOpenAfterClick = (
  joinUiState: JoinRequestUiState,
  joinStateLoading: boolean,
  actions: PeekJoinOpenActions
): 'opened' | 'withdraw' | 'waiting' | 'blocked' => {
  if (joinStateLoading) {
    if (joinUiState.kind === 'open') {
      actions.openJoinModal();
      return 'opened';
    }
    return 'waiting';
  }
  if (joinUiState.kind === 'open') {
    actions.openJoinModal();
    return 'opened';
  }
  if (joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed') {
    actions.setShowWithdraw(true);
    return 'withdraw';
  }
  return 'blocked';
};