import {
  computeActivityMapPeekActions,
  type ActivityViewerAccessLevel,
} from '@uaetrail/shared-types';
import type { ExploreCardModel } from './exploreCardModel';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

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
  if (fromApi !== undefined) return fromApi;

  const level = levelForPeekActions(card, joinUiState);
  if (!level) return [];

  return computeActivityMapPeekActions({
    level,
    activityPublished: card.activity?.status === 'published',
  });
};

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
