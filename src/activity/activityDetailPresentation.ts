import {
  resolveParticipationMode,
  type ActivityParticipationMode,
  type ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

export type ActivityPresentationInput = {
  viewerAccess: ActivityViewerAccessDTO | null;
  joinUiState: JoinRequestUiState;
  participationMode?: ActivityParticipationMode | null;
  requirements?: string[] | null;
  activityPublished: boolean;
  isHostUser: boolean;
  isConfirmedParticipant: boolean;
};

/** Activity detail engagement flags — join/crew from API `viewerAccess` only. */
export const resolveActivityDetailPresentation = (input: ActivityPresentationInput) => {
  const participationMode = resolveParticipationMode(input.participationMode, input.requirements);
  const canAccessCrewSurfaces = input.viewerAccess?.canAccessCrewSurfaces ?? false;

  const showParticipantFooterShortcuts =
    canAccessCrewSurfaces && input.isConfirmedParticipant && !input.isHostUser;

  const showCrewWelcomeAfterInstantJoin =
    participationMode === 'rsvp' && canAccessCrewSurfaces;

  const showCrewLockedHint =
    !canAccessCrewSurfaces &&
    !input.isHostUser &&
    (input.joinUiState.kind === 'open' ||
      input.joinUiState.kind === 'pending' ||
      input.viewerAccess?.level === 'public');

  return {
    participationMode,
    canAccessCrewSurfaces,
    showParticipantFooterShortcuts,
    showCrewWelcomeAfterInstantJoin,
    showCrewLockedHint,
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
