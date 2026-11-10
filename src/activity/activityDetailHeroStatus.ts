import type { JoinRequestUiState } from '../utils/joinRequestUi';
import { ACTIVITY_STATUS_JOIN_REQUESTED } from '../content/activityParticipationCopy';
import { HOSTING_LABEL } from '../content/workspaceVocabulary';

export type ActivityDetailHeroStatusChip = {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'muted';
};

/** Hero strip — viewer relationship only (hosting / joined / join requested / full). */
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
    return [{ label: HOSTING_LABEL, tone: 'success' }];
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
