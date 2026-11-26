import type { ActivityMapPeekAction, ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { isFacilityMapSource, isPlaceMapSource } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { inferJoinUiStateFromDiscoveryCard } from '../../activity/inferJoinUiStateFromDiscoveryCard';
import { resolveActivityPeekEngagement } from '../../activity/activityPeekEngagement';
import { resolveActivityPeekTwoSlot } from '../../activity/activityEngagementCtas';
import {
  activityMapPeekActionLabel,
  type ActivityMapPeekActionLabelContext,
} from '../../discovery/discoveryPortExploreCardChrome';
import { discoveryCardHasMapCoords } from '../../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { ACTIVITY_CTA_MESSAGE_HOST, ACTIVITY_PEEK_MANAGE_LABEL } from '../../content/activityParticipationCopy';
import {
  PLACE_PEEK_FOOTER_DETAILS,
  PLACE_PEEK_FOOTER_PLAN_TRIP,
} from '../../content/placePeekCopy';
import {
  LIST_FEED_CTA_GET_DIRECTIONS,
  LIST_FEED_CTA_VIEW_DETAILS,
} from './listFeedCtaCopy';

export type ListFeedFooterButton =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'action'; label: string; actionId: ActivityMapPeekActionId }
  | { kind: 'disabled'; label: string }
  | { kind: 'guest_gate'; label: string }
  | { kind: 'directions'; label: string; lat: number; lng: number }
  | { kind: 'plan_trip'; label: string };

export type ListFeedFooterModel = {
  primary: ListFeedFooterButton;
  secondary: ListFeedFooterButton | null;
  usesJoinFlow: boolean;
};

const detailButton = (card: DiscoveryCardModel): ListFeedFooterButton => ({
  kind: 'link',
  label:
    card.secondaryCta ??
    (isPlaceMapSource(card.source) ? PLACE_PEEK_FOOTER_DETAILS : LIST_FEED_CTA_VIEW_DETAILS),
  href: card.path,
});

const peekActionLabelContext = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): ActivityMapPeekActionLabelContext => ({
  surface: 'peek',
  viewerLevel: card.viewerAccess?.level ?? null,
  joinPhase:
    joinUiState?.kind === 'confirmed'
      ? 'confirmed'
      : joinUiState?.kind === 'pending'
        ? 'pending'
        : 'open',
});

const peekActionLabel = (
  action: ActivityMapPeekAction,
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): string => {
  if (action.id === 'request_join') return card.primaryCta;
  if (action.id === 'message_host') return ACTIVITY_CTA_MESSAGE_HOST;
  return activityMapPeekActionLabel(action.id, action, peekActionLabelContext(card, joinUiState));
};

const peekActionToFooterButton = (
  action: ActivityMapPeekAction,
  card: DiscoveryCardModel,
  isGuest: boolean,
  joinUiState?: JoinRequestUiState
): ListFeedFooterButton => {
  if (action.id === 'pending_join') {
    return {
      kind: 'disabled',
      label: activityMapPeekActionLabel(
        action.id,
        action,
        peekActionLabelContext(card, joinUiState)
      ),
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
      return { kind: 'guest_gate', label: peekActionLabel(action, card, joinUiState) };
    }
    return {
      kind: 'action',
      label: peekActionLabel(action, card, joinUiState),
      actionId: action.id,
    };
  }
  if (action.id === 'view_detail') {
    return detailButton(card);
  }
  if (isGuest) {
    return { kind: 'guest_gate', label: peekActionLabel(action, card, joinUiState) };
  }
  return {
    kind: 'action',
    label: peekActionLabel(action, card, joinUiState),
    actionId: action.id,
  };
};

/** Peek parity — `view_detail` is `text` on the wire, not `secondary`; list still pairs Details with join primary. */
const resolveListFeedPeekSecondary = (
  mapPeekActions: ActivityMapPeekAction[],
  card: DiscoveryCardModel,
  isGuest: boolean,
  primaryId: ActivityMapPeekActionId,
  joinUiState?: JoinRequestUiState,
  secondaryWire?: ActivityMapPeekAction | null
): ListFeedFooterButton | null => {
  if (primaryId === 'view_detail') return null;
  if (secondaryWire) return peekActionToFooterButton(secondaryWire, card, isGuest, joinUiState);
  const withdraw = mapPeekActions.find((action) => action.id === 'withdraw_join');
  if (withdraw && (primaryId === 'pending_join' || joinUiState?.kind === 'pending')) {
    return peekActionToFooterButton(withdraw, card, isGuest, joinUiState);
  }
  const viewDetail = mapPeekActions.find((action) => action.id === 'view_detail');
  if (viewDetail) return peekActionToFooterButton(viewDetail, card, isGuest, joinUiState);
  if (
    primaryId === 'request_join' ||
    primaryId === 'pending_join' ||
    primaryId === 'message_host' ||
    primaryId === 'open_crew_chat'
  ) {
    return detailButton(card);
  }
  return null;
};

const fallbackJoinFooterFromCardLabels = (
  card: DiscoveryCardModel,
  isGuest: boolean
): ListFeedFooterModel => ({
  primary: isGuest
    ? { kind: 'guest_gate', label: card.primaryCta }
    : { kind: 'action', label: card.primaryCta, actionId: 'request_join' },
  secondary: detailButton(card),
  usesJoinFlow: true,
});

const resolveActivityJoinFooter = (
  card: DiscoveryCardModel,
  options: { isGuest: boolean; joinUiState?: JoinRequestUiState }
): ListFeedFooterModel | null => {
  const { isGuest, joinUiState } = options;
  const engagement = resolveActivityPeekEngagement(card, joinUiState);
  const twoSlot = resolveActivityPeekTwoSlot(engagement.mapPeekActions);
  const primaryAction =
    twoSlot.primary ?? engagement.mapPeekActions.find((action) => action.prominence === 'primary');

  if (!primaryAction) {
    return engagement.showsFallbackJoinFlow ? fallbackJoinFooterFromCardLabels(card, isGuest) : null;
  }

  return {
    primary: peekActionToFooterButton(primaryAction, card, isGuest, joinUiState),
    secondary: resolveListFeedPeekSecondary(
      engagement.mapPeekActions,
      card,
      isGuest,
      primaryAction.id,
      joinUiState,
      twoSlot.secondary
    ),
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
  if (isPlaceMapSource(card.source) || isFacilityMapSource(card.source)) {
    const secondaryDirections: ListFeedFooterButton | null = discoveryCardHasMapCoords(card)
      ? {
          kind: 'directions',
          label: LIST_FEED_CTA_GET_DIRECTIONS,
          lat: card.mapLatitude!,
          lng: card.mapLongitude!,
        }
      : null;
    return {
      primary: { kind: 'plan_trip', label: PLACE_PEEK_FOOTER_PLAN_TRIP },
      secondary: secondaryDirections,
      usesJoinFlow: false,
    };
  }

  if (card.source === 'activity') {
    const effectiveJoinUi = inferJoinUiStateFromDiscoveryCard(card, options.joinUiState);
    const fromPeek = resolveActivityJoinFooter(card, {
      isGuest: options.isGuest,
      joinUiState: effectiveJoinUi,
    });
    if (fromPeek) return fromPeek;
  }

  return {
    primary: { kind: 'link', label: card.primaryCta, href: card.path },
    secondary: card.secondaryCta ? detailButton(card) : null,
    usesJoinFlow: false,
  };
};

const hostMapPeekLabelContext = (): ActivityMapPeekActionLabelContext => ({
  surface: 'peek',
  viewerLevel: 'host',
  joinPhase: 'open',
});

const listFeedButtonFromMapPeekAction = (action: ActivityMapPeekAction): ListFeedFooterButton => ({
  kind: 'action',
  label: activityMapPeekActionLabel(action.id, action, hostMapPeekLabelContext()),
  actionId: action.id,
});

/** Manage console / hosting hub — wire-only footer (no discovery card). */
export const resolveListFeedFooterFromMapPeekWire = (
  mapPeekActions: ActivityMapPeekAction[]
): ListFeedFooterModel => {
  const twoSlot = resolveActivityPeekTwoSlot(mapPeekActions);
  const primaryAction =
    twoSlot.primary ?? mapPeekActions.find((action) => action.prominence === 'primary');

  if (!primaryAction) {
    return {
      primary: {
        kind: 'action',
        label: ACTIVITY_PEEK_MANAGE_LABEL,
        actionId: 'manage_activity',
      },
      secondary: null,
      usesJoinFlow: false,
    };
  }

  return {
    primary: listFeedButtonFromMapPeekAction(primaryAction),
    secondary: twoSlot.secondary ? listFeedButtonFromMapPeekAction(twoSlot.secondary) : null,
    usesJoinFlow: false,
  };
};
