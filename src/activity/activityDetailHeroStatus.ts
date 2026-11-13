import type { JoinRequestUiState } from '../utils/joinRequestUi';
import { ACTIVITY_STATUS_JOIN_REQUESTED } from '../content/activityParticipationCopy';
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

  const chips: ActivityDetailHeroStatusChip[] = [...joinStateChips(input.joinUiState)];

  const left = input.slotsAvailable;
  const total = input.slotsTotal;
  if (total > 0 && left <= 0) {
    chips.push({ label: 'Full', tone: 'muted' });
  }

  return chips;
};

const joinStateChips = (joinUiState: JoinRequestUiState): ActivityDetailHeroStatusChip[] => {
  if (joinUiState.kind === 'confirmed') {
    return [{ label: 'Joined', tone: 'success' }];
  }
  if (joinUiState.kind === 'pending') {
    return [
      {
        label:
          joinUiState.status === 'waitlisted' ? 'On waitlist' : ACTIVITY_STATUS_JOIN_REQUESTED,
        tone: 'warning',
      },
    ];
  }
  return [];
};

/** Consumer detail — join/host status only; published plan facts use L1 discovery card. */
export const resolveActivityDetailMarketingStatusChips = (input: {
  joinUiState: JoinRequestUiState;
  slotsAvailable: number;
  slotsTotal: number;
  previewMode: boolean;
  isHostUser: boolean;
  pendingJoinInviteCount?: number;
  confirmedParticipantCount?: number;
}): ActivityDetailHeroStatusChip[] =>
  resolveActivityDetailHeroStatusChips(input);
