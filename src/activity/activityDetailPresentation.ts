import {
  resolveActivityEngagementPolicy,
  resolveParticipationMode,
  type ActivityViewerAccessDTO,
  type MapPeekJoinRequestStatus,
  type ParticipationMode,
} from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

export type ActivityPresentationInput = {
  viewerAccess: ActivityViewerAccessDTO | null;
  joinUiState: JoinRequestUiState;
  participationMode?: ParticipationMode | null;
  requirements?: string[] | null;
  activityPublished: boolean;
  isHostUser: boolean;
  isConfirmedParticipant: boolean;
};

const joinRequestStatusFromUi = (
  joinUiState: JoinRequestUiState
): MapPeekJoinRequestStatus | null => {
  if (joinUiState.kind !== 'pending') return null;
  return joinUiState.status === 'waitlisted' ? 'waitlisted' : 'pending';
};

/** Activity detail engagement flags — from L1 policy when `viewerAccess` is present. */
export const resolveActivityDetailPresentation = (input: ActivityPresentationInput) => {
  const participationMode = resolveParticipationMode(input.participationMode, input.requirements);

  if (input.viewerAccess) {
    const { presentation } = resolveActivityEngagementPolicy({
      viewerAccess: input.viewerAccess,
      isHostUser: input.isHostUser,
      activityPublished: input.activityPublished,
      participationMode: input.participationMode,
      requirements: input.requirements,
      joinRequestStatus: joinRequestStatusFromUi(input.joinUiState),
      myParticipation: input.isConfirmedParticipant ? { onRoster: true } : null,
      myRequest: null,
    });
    const { joinEngagement: _joinEngagement, participationMode: _pm, ...flags } =
      presentation.engagement;
    return { participationMode, ...flags };
  }

  return {
    participationMode,
    canAccessCrewSurfaces: false,
    showParticipantFooterShortcuts: false,
    showCrewWelcomeAfterInstantJoin: false,
    showCrewLockedHint: false,
  };
};

/** @deprecated Use `resolveActivityDetailPresentation` — import shim during NA-5. */
export const resolveActivityPresentation = resolveActivityDetailPresentation;

export const resolveActivityPresentationFromExploreCard = (
  card: ExploreCardModel,
  options: {
    joinUiState: JoinRequestUiState;
    isHostUser: boolean;
    isConfirmedParticipant: boolean;
  }
) => {
  if (card.source !== 'activity') return null;

  return resolveActivityDetailPresentation({
    viewerAccess: card.viewerAccess ?? null,
    joinUiState: options.joinUiState,
    participationMode: card.activity?.participationMode,
    requirements: card.activity?.requirements,
    activityPublished: card.activity?.status === 'published',
    isHostUser: options.isHostUser,
    isConfirmedParticipant: options.isConfirmedParticipant,
  });
};
