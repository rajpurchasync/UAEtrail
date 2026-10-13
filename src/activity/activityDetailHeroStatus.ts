import type { JoinRequestUiState } from '../utils/joinRequestUi';
import { pendingApprovalLabel } from '../utils/joinRequestUi';
import { activityPeekPendingInviteChipLabel } from '../content/activityPeekCopy';

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
  pendingJoinInviteCount?: number;
  confirmedParticipantCount?: number;
}): ActivityDetailHeroStatusChip[] => {
  if (input.previewMode) return [];

  if (input.isHostUser) {
    const chips: ActivityDetailHeroStatusChip[] = [];
    const total = input.slotsTotal;
    const joined =
      input.confirmedParticipantCount ??
      (total > 0 ? Math.max(0, total - input.slotsAvailable) : 0);
    if (total > 0) {
      chips.push({
        label: `${joined}/${total} going`,
        tone: 'neutral',
      });
    }
    const pendingInvites = input.pendingJoinInviteCount ?? 0;
    if (pendingInvites > 0) {
      chips.push({
        label: activityPeekPendingInviteChipLabel(pendingInvites),
        tone: 'neutral',
      });
    }
    return chips;
  }

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
