import type { ActivityMapPeekAction, ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import {
  activityMapPeekShowsJoinFlow,
  resolveActivityMapPeekActions,
} from '../explore/activityMapPeekActions';
import { activityMapPeekActionLabel } from '../explore/exploreMapPeekActionCopy';
import { exploreCardHasMapCoords } from '../explore/exploreCardModel';
import type { JoinRequestUiState } from '../utils/joinRequestUi';
import {
  LIST_FEED_CTA_GET_DIRECTIONS,
  LIST_FEED_CTA_MESSAGE_HOST,
  LIST_FEED_CTA_VIEW_DETAILS,
} from './listFeedCtaCopy';

export type ListFeedFooterButton =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'action'; label: string; actionId: ActivityMapPeekActionId }
  | { kind: 'disabled'; label: string }
  | { kind: 'guest_gate'; label: string }
  | { kind: 'directions'; label: string; lat: number; lng: number };

export type ListFeedFooterModel = {
  primary: ListFeedFooterButton;
  secondary: ListFeedFooterButton | null;
  usesJoinFlow: boolean;
};

/** Join / gate primary on poster image — details open via full-card tap. */
export const shouldShowListFeedImageCta = (model: ListFeedFooterModel): boolean => {
  const kinds = new Set([model.primary.kind, model.secondary?.kind]);
  return (
    kinds.has('action') ||
    kinds.has('guest_gate') ||
    kinds.has('disabled') ||
    kinds.has('directions') ||
    kinds.has('link')
  );
};

const detailButton = (card: ExploreCardModel): ListFeedFooterButton => ({
  kind: 'link',
  label: card.secondaryCta ?? LIST_FEED_CTA_VIEW_DETAILS,
  href: card.path,
});

const peekActionLabel = (action: ActivityMapPeekAction, card: ExploreCardModel): string => {
  if (action.id === 'request_join') return card.primaryCta;
  if (action.id === 'message_host') return LIST_FEED_CTA_MESSAGE_HOST;
  return activityMapPeekActionLabel(action.id, action);
};

const peekActionToFooterButton = (
  action: ActivityMapPeekAction,
  card: ExploreCardModel,
  isGuest: boolean
): ListFeedFooterButton => {
  if (action.id === 'pending_join') {
    return {
      kind: 'disabled',
      label: activityMapPeekActionLabel(action.id, action),
    };
  }
  if (action.id === 'request_join' || action.id === 'message_host') {
    if (isGuest) {
      return { kind: 'guest_gate', label: peekActionLabel(action, card) };
    }
    return {
      kind: 'action',
      label: peekActionLabel(action, card),
      actionId: action.id,
    };
  }
  if (action.id === 'view_detail') {
    return detailButton(card);
  }
  if (isGuest) {
    return { kind: 'guest_gate', label: peekActionLabel(action, card) };
  }
  return {
    kind: 'action',
    label: peekActionLabel(action, card),
    actionId: action.id,
  };
};

const resolveActivityJoinFooter = (
  card: ExploreCardModel,
  options: { isGuest: boolean; joinUiState?: JoinRequestUiState }
): ListFeedFooterModel | null => {
  const { isGuest, joinUiState } = options;
  const actions = resolveActivityMapPeekActions(card, joinUiState);
  const primaryAction = actions.find((action) => action.prominence === 'primary');
  const secondaryAction = actions.find((action) => action.prominence === 'secondary');

  if (!primaryAction) return null;

  return {
    primary: peekActionToFooterButton(primaryAction, card, isGuest),
    secondary: secondaryAction ? peekActionToFooterButton(secondaryAction, card, isGuest) : null,
    usesJoinFlow: activityMapPeekShowsJoinFlow(card, joinUiState),
  };
};

export const resolveListFeedFooterModel = (
  card: ExploreCardModel,
  options: {
    isGuest: boolean;
    joinUiState?: JoinRequestUiState;
  }
): ListFeedFooterModel => {
  const { isGuest, joinUiState } = options;

  if (card.source === 'venue' && exploreCardHasMapCoords(card)) {
    return {
      primary: {
        kind: 'directions',
        label: LIST_FEED_CTA_GET_DIRECTIONS,
        lat: card.mapLatitude!,
        lng: card.mapLongitude!,
      },
      secondary: detailButton(card),
      usesJoinFlow: false,
    };
  }

  if (card.showHostActivityCtas || card.showDemandOwnerActions) {
    return {
      primary: { kind: 'link', label: card.primaryCta, href: card.path },
      secondary: null,
      usesJoinFlow: false,
    };
  }

  if (card.source === 'activity' && card.showJoinActions) {
    const fromPeek = resolveActivityJoinFooter(card, options);
    if (fromPeek) return fromPeek;
  }

  if (card.showJoinActions && card.source === 'demand' && !isGuest) {
    return {
      primary: { kind: 'link', label: card.primaryCta, href: card.path },
      secondary: card.secondaryCta ? { kind: 'link', label: card.secondaryCta, href: card.path } : null,
      usesJoinFlow: false,
    };
  }

  if (card.showJoinActions && card.source === 'demand') {
    return {
      primary: { kind: 'guest_gate', label: card.primaryCta },
      secondary: card.secondaryCta ? { kind: 'link', label: card.secondaryCta, href: card.path } : null,
      usesJoinFlow: false,
    };
  }

  return {
    primary: { kind: 'link', label: card.primaryCta, href: card.path },
    secondary: card.secondaryCta ? detailButton(card) : null,
    usesJoinFlow: false,
  };
};
