import type { MyActivityRequestDTO, ActivityParticipationDTO } from '@uaetrail/shared-types';

export type JoinRequestUiState =
  | { kind: 'open' }
  | { kind: 'pending'; requestId: string; status: 'pending' | 'waitlisted' }
  | { kind: 'confirmed'; requestId: string };

export const resolveJoinRequestUiState = (input: {
  myRequest?: MyActivityRequestDTO | null;
  participation?: ActivityParticipationDTO | null;
}): JoinRequestUiState => {
  if (input.participation && input.myRequest?.id) {
    return { kind: 'confirmed', requestId: input.myRequest.id };
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
  status === 'waitlisted' ? 'On waitlist' : 'Waiting for host';

/** Human-friendly label for join request status badges. */
export const requestStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Waiting for host';
    case 'waitlisted':
      return 'On waitlist';
    case 'approved':
      return 'Confirmed';
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
