import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import {
  activityMapPeekShowsJoinFlow,
  resolveActivityMapPeekActions,
} from '../explore/activityMapPeekActions';
import { activityMapPeekActionLabel } from '../explore/exploreMapPeekActionCopy';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

export type ListFeedFooterButton =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'action'; label: string; actionId: ActivityMapPeekActionId }
  | { kind: 'disabled'; label: string }
  | { kind: 'guest_gate'; label: string };

export type ListFeedFooterModel = {
  primary: ListFeedFooterButton;
  secondary: ListFeedFooterButton | null;
  usesJoinFlow: boolean;
};

/** Join / gate primary on poster image — details open via full-card tap. */
export const shouldShowListFeedImageCta = (model: ListFeedFooterModel): boolean => {
  const kind = model.primary.kind;
  return kind === 'action' || kind === 'guest_gate' || kind === 'disabled';
};

const detailButton = (card: ExploreCardModel): ListFeedFooterButton => ({
  kind: 'link',
  label: card.secondaryCta ?? 'View details',
  href: card.path,
});

export const resolveListFeedFooterModel = (
  card: ExploreCardModel,
  options: {
    isGuest: boolean;
    joinUiState?: JoinRequestUiState;
  }
): ListFeedFooterModel => {
  const { isGuest, joinUiState } = options;

  if (isGuest && (card.source === 'activity' || card.source === 'demand') && card.showJoinActions) {
    return {
      primary: { kind: 'guest_gate', label: card.primaryCta },
      secondary: null,
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
    const actions = resolveActivityMapPeekActions(card, joinUiState);
    const primaryAction = actions.find((a) => a.prominence === 'primary');

    if (primaryAction?.id === 'pending_join') {
      return {
        primary: {
          kind: 'disabled',
          label: activityMapPeekActionLabel(primaryAction.id, primaryAction),
        },
        secondary: null,
        usesJoinFlow: false,
      };
    }

    if (primaryAction && primaryAction.id !== 'view_detail') {
      return {
        primary: {
          kind: 'action',
          label:
            primaryAction.id === 'request_join' ? card.primaryCta : activityMapPeekActionLabel(primaryAction.id, primaryAction),
          actionId: primaryAction.id,
        },
        secondary: null,
        usesJoinFlow: activityMapPeekShowsJoinFlow(card, joinUiState),
      };
    }
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
