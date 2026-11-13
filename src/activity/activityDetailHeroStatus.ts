import type { ActivityPartyMemberDTO } from '@uaetrail/shared-types';
import type { JoinRequestUiState } from '../utils/joinRequestUi';
import { resolveViewerParticipationStatus } from '../content/activityParticipationStatus';
import { HOSTING_LABEL } from '../content/workspaceVocabulary';

export type ActivityDetailHeroStatusChip = {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'muted';
};

const toneForParticipation = (
  kind: NonNullable<ReturnType<typeof resolveViewerParticipationStatus>>['kind']
): ActivityDetailHeroStatusChip['tone'] => {
  if (kind === 'joined' || kind === 'joined_with_family') return 'success';
  if (kind === 'joined_family_pending' || kind === 'family_joining_pending') return 'warning';
  return 'warning';
};

type PartyStatusInput = {
  adults?: number | null;
  kids?: number | null;
  partyMembers?: ActivityPartyMemberDTO[] | null;
  partyApprovalPending?: boolean | null;
};

/** Hero strip — viewer relationship only (hosting / joined / pending / family / full). */
export const resolveActivityDetailHeroStatusChips = (input: {
  joinUiState: JoinRequestUiState;
  slotsAvailable: number;
  slotsTotal: number;
  previewMode: boolean;
  isHostUser: boolean;
  pendingJoinInviteCount?: number;
  confirmedParticipantCount?: number;
} & PartyStatusInput): ActivityDetailHeroStatusChip[] => {
  if (input.previewMode) return [];

  if (input.isHostUser) {
    return [{ label: HOSTING_LABEL, tone: 'success' }];
  }

  const chips: ActivityDetailHeroStatusChip[] = [
    ...joinStateChips(input.joinUiState, {
      adults: input.adults,
      kids: input.kids,
      partyMembers: input.partyMembers,
      partyApprovalPending: input.partyApprovalPending,
    }),
  ];

  const left = input.slotsAvailable;
  const total = input.slotsTotal;
  if (total > 0 && left <= 0) {
    chips.push({ label: 'Full', tone: 'muted' });
  }

  return chips;
};

const joinStateChips = (
  joinUiState: JoinRequestUiState,
  party: PartyStatusInput
): ActivityDetailHeroStatusChip[] => {
  if (joinUiState.kind === 'open') return [];
  const status = resolveViewerParticipationStatus({
    joinKind: joinUiState.kind,
    adults: party.adults,
    kids: party.kids,
    partyMembers: party.partyMembers,
    partyApprovalPending: party.partyApprovalPending,
    waitlisted: joinUiState.kind === 'pending' && joinUiState.status === 'waitlisted',
  });
  if (!status) return [];
  return [{ label: status.label, tone: toneForParticipation(status.kind) }];
};

/** Consumer detail — join/host status only; published plan facts use L1 discovery card. */
export const resolveActivityDetailMarketingStatusChips = (
  input: Parameters<typeof resolveActivityDetailHeroStatusChips>[0]
): ActivityDetailHeroStatusChip[] => resolveActivityDetailHeroStatusChips(input);
