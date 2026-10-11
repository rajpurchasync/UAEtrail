import type { JoinRequestUiState } from '../utils/joinRequestUi';
import { pendingApprovalLabel } from '../utils/joinRequestUi';

export type ActivityDetailHeroStatusChip = {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'muted';
};

/** v3.2 hero strip — join state + capacity (mobile tabs only). */
export const resolveActivityDetailHeroStatusChips = (input: {
  joinUiState: JoinRequestUiState;
  slotsAvailable: number;
  slotsTotal: number;
  previewMode: boolean;
  isHostUser: boolean;
}): ActivityDetailHeroStatusChip[] => {
  if (input.previewMode || input.isHostUser) return [];

  const chips: ActivityDetailHeroStatusChip[] = [];

  if (input.joinUiState.kind === 'confirmed') {
    chips.push({ label: 'Joined', tone: 'success' });
  } else if (input.joinUiState.kind === 'pending') {
    chips.push({
      label: pendingApprovalLabel(input.joinUiState.status),
      tone: 'warning',
    });
  }

  const left = input.slotsAvailable;
  const total = input.slotsTotal;
  if (total > 0) {
    if (left <= 0) {
      chips.push({ label: 'Full', tone: 'muted' });
    } else {
      chips.push({
        label: `${left} spot${left === 1 ? '' : 's'} left`,
        tone: 'neutral',
      });
    }
  }

  return chips;
};
