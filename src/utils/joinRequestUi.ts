import type { MyActivityRequestDTO, ActivityParticipationDTO } from '@uaetrail/shared-types';
import {
  ACTIVITY_CTA_PENDING_APPROVAL,
  ACTIVITY_STATUS_JOINED,
  ACTIVITY_STATUS_JOIN_REQUESTED,
} from '../content/activityParticipationCopy';

export type JoinRequestUiState =
  | { kind: 'open' }
  | { kind: 'pending'; requestId: string; status: 'pending' | 'waitlisted' }
  | { kind: 'confirmed'; requestId: string };

export const resolveJoinRequestUiState = (input: {
  myRequest?: MyActivityRequestDTO | null;
  participation?: ActivityParticipationDTO | null;
}): JoinRequestUiState => {
  if (input.participation) {
    return { kind: 'confirmed', requestId: input.myRequest?.id ?? 'participation' };
  }

  if (!input.myRequest?.canWithdraw) {
    return { kind: 'open' };
  }

  if (input.myRequest.status === 'approved') {
    return { kind: 'confirmed', requestId: input.myRequest.id };
  }

  if (input.myRequest.status === 'pending' || input.myRequest.status === 'waitlisted') {
    return {
      kind: 'pending',
      requestId: input.myRequest.id,
      status: input.myRequest.status
    };
  }

  return { kind: 'open' };
};

export const pendingApprovalLabel = (status: 'pending' | 'waitlisted'): string =>
  status === 'waitlisted' ? 'On waitlist' : ACTIVITY_CTA_PENDING_APPROVAL;

/** Human-friendly label for join request status badges. */
export const requestStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return ACTIVITY_STATUS_JOIN_REQUESTED;
    case 'waitlisted':
      return 'On waitlist';
    case 'approved':
      return ACTIVITY_STATUS_JOINED;
    case 'rejected':
      return 'Not this time';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status.replace(/_/g, ' ');
  }
};

export const withdrawModalVariant = (uiState: JoinRequestUiState): 'request' | 'activity' =>
  uiState.kind === 'confirmed' ? 'activity' : 'request';

/** Tailwind badge classes for join request status chips. */
export const requestStatusClassName = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/15 text-amber-700';
    case 'waitlisted':
      return 'bg-sky-500/15 text-sky-700';
    case 'approved':
      return 'bg-emerald-500/15 text-emerald-700';
    case 'rejected':
      return 'bg-red-500/15 text-red-600';
    case 'cancelled':
      return 'bg-neutral-500/10 text-neutral-500';
    default:
      return 'bg-amber-500/15 text-amber-700';
  }
};
