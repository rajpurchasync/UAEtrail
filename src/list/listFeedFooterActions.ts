import type { ActivityMapPeekAction, ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { resolveActivityPeekEngagement } from '../activity/activityPeekEngagement';
import { activityMapPeekActionLabel } from '../explore/exploreMapPeekActionCopy';
import { discoveryCardHasMapCoords } from '../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../utils/joinRequestUi';
import { ACTIVITY_CTA_MESSAGE_HOST } from '../content/activityParticipationCopy';
import {
  LIST_FEED_CTA_GET_DIRECTIONS,
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

const detailButton = (card: DiscoveryCardModel): ListFeedFooterButton => ({
  kind: 'link',
  label: card.secondaryCta ?? LIST_FEED_CTA_VIEW_DETAILS,
  href: card.path,
});

const peekActionLabel = (action: ActivityMapPeekAction, card: DiscoveryCardModel): string => {
  if (action.id === 'request_join') return card.primaryCta;
  if (action.id === 'message_host') return ACTIVITY_CTA_MESSAGE_HOST;
  return activityMapPeekActionLabel(action.id, action);
};

const peekActionToFooterButton = (
  action: ActivityMapPeekAction,
  card: DiscoveryCardModel,
  isGuest: boolean
): ListFeedFooterButton => {
  if (action.id === 'pending_join') {
    return {
      kind: 'disabled',
      label: activityMapPeekActionLabel(action.id, action),
    };
  }
  if (
    action.id === 'request_join' ||
    action.id === 'message_host' ||
    action.id === 'share_activity' ||
    action.id === 'manage_activity' ||
    action.id === 'withdraw_join' ||
    action.id === 'offer_rideshare' ||
    action.id === 'open_crew_chat' ||
    action.id === 'invite_crew' ||
    action.id === 'link_rideshare'
  ) {
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
  card: DiscoveryCardModel,
  options: { isGuest: boolean; joinUiState?: JoinRequestUiState }
): ListFeedFooterModel | null => {
  const { isGuest, joinUiState } = options;
  const engagement = resolveActivityPeekEngagement(card, joinUiState);
  const primaryAction = engagement.mapPeekActions.find((action) => action.prominence === 'primary');
  const secondaryAction = engagement.mapPeekActions.find((action) => action.prominence === 'secondary');

  if (!primaryAction) return null;

  return {
    primary: peekActionToFooterButton(primaryAction, card, isGuest),
    secondary: secondaryAction ? peekActionToFooterButton(secondaryAction, card, isGuest) : null,
    usesJoinFlow: engagement.showsFallbackJoinFlow,
  };
};

export const resolveListFeedFooterModel = (
  card: DiscoveryCardModel,
  options: {
    isGuest: boolean;
    joinUiState?: JoinRequestUiState;
  }
): ListFeedFooterModel => {
  if (isGeographyMapSource(card.source) && discoveryCardHasMapCoords(card)) {
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

  if (card.source === 'activity') {
    const fromPeek = resolveActivityJoinFooter(card, options);
    if (fromPeek) return fromPeek;
  }

  return {
    primary: { kind: 'link', label: card.primaryCta, href: card.path },
    secondary: card.secondaryCta ? detailButton(card) : null,
    usesJoinFlow: false,
  };
};
