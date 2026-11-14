import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  ACTIVITY_STATUS_JOIN_REQUESTED,
  ACTIVITY_STATUS_JOINED,
} from '../content/activityParticipationCopy';
import type { JoinRequestUiState } from '../utils/joinRequestUi';
import { activityPeekViewerIsJoined } from './activityPeekEngagement';

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

  if (joinUiState?.kind === 'pending') {
    chips.push({
      label:
        joinUiState.status === 'waitlisted' ? 'On waitlist' : ACTIVITY_STATUS_JOIN_REQUESTED,
      tone: joinUiState.status === 'waitlisted' ? 'waitlist' : 'pending',
    });
  } else if (card.viewerAccess?.level === 'join_request') {
    chips.push({ label: ACTIVITY_STATUS_JOIN_REQUESTED, tone: 'pending' });
  }

  if (activityPeekViewerIsJoined(card, joinUiState)) {
    chips.push({ label: ACTIVITY_STATUS_JOINED, tone: 'joined' });
  }

  return chips;
};