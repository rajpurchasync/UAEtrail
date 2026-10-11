import {
  computeActivityMapPeekActions,
  mergeActivityMapPeekActionsWithEntitlements,
  type ActivityMapPeekAction,
  type ActivityViewerAccessDTO,
  type ActivityViewerAccessLevel,
} from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
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

/** Peek actions after layer-7 entitlements (strip or restore `message_host`). */
export const filterActivityMapPeekActionsForViewer = (
  actions: ActivityMapPeekAction[],
  viewerAccess?: Pick<ActivityViewerAccessDTO, 'level' | 'entitlements'> | null
): ActivityMapPeekAction[] => {
  const entitlements = viewerAccess?.entitlements;
  if (!entitlements) {
    return actions.filter((action) => action.id !== 'message_host');
  }
  return mergeActivityMapPeekActionsWithEntitlements(
    actions,
    entitlements,
    viewerAccess.level ?? 'public'
  );
};

/** Resolved wire actions for an activity map peek (API list or computed fallback). */
export const resolveActivityMapPeekActions = (
  card: ExploreCardModel,
  joinUiState?: JoinRequestUiState
): ActivityMapPeekAction[] => {
  if (card.source !== 'activity') return [];
  const fromApi = card.viewerAccess?.mapPeekActions;
  const joinRequestStatus =
    joinUiState?.kind === 'pending'
      ? joinUiState.status === 'waitlisted'
        ? 'waitlisted'
        : 'pending'
      : null;

  const resolved =
    fromApi !== undefined
      ? fromApi
      : (() => {
          const level = levelForPeekActions(card, joinUiState);
          if (!level) return [];
          return computeActivityMapPeekActions({
            level,
            activityPublished: card.activity?.status === 'published',
            joinMode: card.activity?.joinMode,
            joinRequestStatus,
          });
        })();

  return filterActivityMapPeekActionsForViewer(resolved, card.viewerAccess ?? null);
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
