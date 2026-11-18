import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  ACTIVITY_STATUS_HOSTED,
  ACTIVITY_STATUS_JOIN_REQUESTED,
  ACTIVITY_STATUS_JOINED,
} from '../content/activityParticipationCopy';
import type { JoinRequestUiState } from '../utils/joinRequestUi';
import {
  activityPeekPendingJoinStatus,
  activityPeekViewerIsJoined,
} from './activityPeekEngagement';

export type ActivityPeekParticipationTone = 'host' | 'joined' | 'pending' | 'waitlist';

export type ActivityPeekParticipationWidget = {
  label: string;
  tone: ActivityPeekParticipationTone;
};

/**
 * Single participation pill for map compact peek (host takes precedence over joined).
 */
export const resolveActivityPeekParticipationWidget = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState,
  isHostUser?: boolean
): ActivityPeekParticipationWidget | null => {
  if (card.source !== 'activity') return null;

  if (isHostUser || card.viewerAccess?.level === 'host') {
    return { label: ACTIVITY_STATUS_HOSTED, tone: 'host' };
  }

  const pendingStatus = activityPeekPendingJoinStatus(card, joinUiState);
  if (pendingStatus === 'waitlisted') {
    return { label: 'On waitlist', tone: 'waitlist' };
  }
  if (pendingStatus) {
    return { label: ACTIVITY_STATUS_JOIN_REQUESTED, tone: 'pending' };
  }

  if (activityPeekViewerIsJoined(card, joinUiState)) {
    return { label: ACTIVITY_STATUS_JOINED, tone: 'joined' };
  }

  return null;
};