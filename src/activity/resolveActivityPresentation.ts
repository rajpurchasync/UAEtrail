import {
  computeActivityMapPeekActions,
  resolveParticipationMode,
  type ActivityMapPeekAction,
  type ActivityParticipationMode,
  type ActivityViewerAccessDTO,
  type ActivityViewerAccessLevel,
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

/** Single place for detail + peek engagement rules (no duplicate join/crew logic in UI). */
export const resolveActivityPresentation = (input: ActivityPresentationInput) => {
  const participationMode = resolveParticipationMode(input.participationMode, input.requirements);
  const canAccessCrewSurfaces =
    input.viewerAccess?.canAccessCrewSurfaces ??
    (input.isHostUser || input.isConfirmedParticipant);

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

export const resolveActivityPresentationFromExploreCard = (
  card: ExploreCardModel,
  options: {
    joinUiState: JoinRequestUiState;
    isHostUser: boolean;
    isConfirmedParticipant: boolean;
  }
) => {
  if (card.source !== 'activity') return null;

  return resolveActivityPresentation({
    viewerAccess: card.viewerAccess ?? null,
    joinUiState: options.joinUiState,
    participationMode: card.activity?.participationMode,
    requirements: card.activity?.requirements,
    activityPublished: card.activity?.status === 'published',
    isHostUser: options.isHostUser,
    isConfirmedParticipant: options.isConfirmedParticipant,
  });
};

const levelForPeekActions = (
  card: ExploreCardModel,
  joinUiState?: JoinRequestUiState
): ActivityViewerAccessLevel | null => {
  const level = card.viewerAccess?.level;
  if (!level) return null;
  if (joinUiState?.kind === 'confirmed' && level === 'join_request') {
    return 'participant';
  }
  return level;
};

/** Resolved wire actions for an activity map peek (API list or computed fallback). */
export const resolveActivityMapPeekActions = (
  card: ExploreCardModel,
  joinUiState?: JoinRequestUiState
): ActivityMapPeekAction[] => {
  if (card.source !== 'activity') return [];
  const fromApi = card.viewerAccess?.mapPeekActions;
  if (fromApi !== undefined && fromApi.length > 0) return fromApi;

  const level = levelForPeekActions(card, joinUiState);
  if (!level) return fromApi ?? [];

  const joinRequestStatus =
    joinUiState?.kind === 'pending'
      ? joinUiState.status === 'waitlisted'
        ? 'waitlisted'
        : 'pending'
      : null;

  return computeActivityMapPeekActions({
    level,
    activityPublished: card.activity?.status === 'published',
    joinMode: card.activity?.joinMode,
    joinRequestStatus,
  });
};

export const resolveActivityPresentationPeekActions = (
  card: ExploreCardModel,
  joinUiState?: JoinRequestUiState
): ActivityMapPeekAction[] => resolveActivityMapPeekActions(card, joinUiState);

/** Legacy join UI (`JoinRequestActions`) when the server sent no wire peek affordances. */
export const activityMapPeekShowsJoinFlow = (
  card: ExploreCardModel,
  joinUiState?: JoinRequestUiState
): boolean => {
  if (card.source !== 'activity' || !card.showJoinActions) return false;
  return resolveActivityMapPeekActions(card, joinUiState).length === 0;
};

/** Fetch join context when peek uses wire join actions or legacy join flow. */
export const activityMapPeekNeedsJoinContext = (
  card: ExploreCardModel,
  joinUiState?: JoinRequestUiState
): boolean => {
  if (card.source !== 'activity' || !card.showJoinActions) return false;
  const actions = resolveActivityMapPeekActions(card, joinUiState);
  if (actions.some((action) => action.id === 'request_join')) return true;
  return activityMapPeekShowsJoinFlow(card, joinUiState);
};

/** Host peek crew-chat affordance — used to skip join context fetch. */
export const activityMapPeekSkipsJoinContext = (
  card: ExploreCardModel,
  joinUiState?: JoinRequestUiState
): boolean =>
  resolveActivityMapPeekActions(card, joinUiState).some((action) => action.id === 'open_crew_chat');

export type ActivityPeekEngagement = {
  mapPeekActions: ActivityMapPeekAction[];
  showsLegacyJoinFlow: boolean;
  needsJoinContext: boolean;
  skipsJoinContext: boolean;
};

/** Explore map peek + list feed — one bundle for wire actions and join-context fetch rules. */
export const resolveActivityPeekEngagement = (
  card: ExploreCardModel,
  joinUiState?: JoinRequestUiState
): ActivityPeekEngagement => {
  const mapPeekActions = resolveActivityMapPeekActions(card, joinUiState);
  const showsLegacyJoinFlow = activityMapPeekShowsJoinFlow(card, joinUiState);
  return {
    mapPeekActions,
    showsLegacyJoinFlow,
    needsJoinContext: activityMapPeekNeedsJoinContext(card, joinUiState),
    skipsJoinContext: activityMapPeekSkipsJoinContext(card, joinUiState),
  };
};
