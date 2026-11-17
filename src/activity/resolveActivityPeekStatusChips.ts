import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  ACTIVITY_STATUS_JOIN_REQUESTED,
  ACTIVITY_STATUS_JOINED,
} from '../content/activityParticipationCopy';
import type { JoinRequestUiState } from '../utils/joinRequestUi';
import {
  activityPeekPendingJoinStatus,
  activityPeekViewerIsJoined,
} from './activityPeekEngagement';

export type ActivityPeekStatusChip = {
  label: string;
  tone: 'joined' | 'pending' | 'waitlist';
};

/** Map peek body + list catalogue — same Joined / Pending chips (not footer CTAs). */
export const resolveActivityPeekStatusChips = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): ActivityPeekStatusChip[] => {
  if (card.source !== 'activity') return [];

  const chips: ActivityPeekStatusChip[] = [];

  const pendingStatus = activityPeekPendingJoinStatus(card, joinUiState);
  if (pendingStatus) {
    chips.push({
      label: pendingStatus === 'waitlisted' ? 'On waitlist' : ACTIVITY_STATUS_JOIN_REQUESTED,
      tone: pendingStatus === 'waitlisted' ? 'waitlist' : 'pending',
    });
  }

  if (activityPeekViewerIsJoined(card, joinUiState)) {
    chips.push({ label: ACTIVITY_STATUS_JOINED, tone: 'joined' });
  }

  return chips;
};