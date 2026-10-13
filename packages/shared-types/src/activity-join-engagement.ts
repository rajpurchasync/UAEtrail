export type ActivityJoinEngagementKind = 'open' | 'pending' | 'confirmed';

type ActivityRequestEngagementWire = {
  status: string;
  canWithdraw: boolean;
};

/** Wire join state for presentation + tab footers (mirrors FE `resolveJoinRequestUiState`). */
export const resolveActivityJoinEngagementKind = (input: {
  hasParticipation?: boolean;
  myRequest?: ActivityRequestEngagementWire | null;
}): ActivityJoinEngagementKind => {
  if (input.hasParticipation) return 'confirmed';

  if (!input.myRequest?.canWithdraw) return 'open';

  if (input.myRequest.status === 'approved') return 'confirmed';

  if (input.myRequest.status === 'pending' || input.myRequest.status === 'waitlisted') {
    return 'pending';
  }

  return 'open';
};
