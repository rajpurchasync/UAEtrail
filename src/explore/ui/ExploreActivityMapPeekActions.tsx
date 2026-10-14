import type { ActivityMapPeekAction, ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { EXPLORE_PEEK_CTA } from '../../config/exploreTheme';
import { LIST_FEED_CTA_MESSAGE_HOST } from '../../list/listFeedCtaCopy';
import { activityMapPeekActionLabel } from '../exploreMapPeekActionCopy';
import { canLinkRideshareToActivity } from '../linkActivityRideshareOffer';
import { activityDetailPath } from '../../config/routingCatalog';
import type { ExploreCardModel } from '../exploreCardModel';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { pendingApprovalLabel } from '../../utils/joinRequestUi';
import { ExplorePeekDetailLink } from './ExplorePeekDetailLink';

type ExploreActivityMapPeekActionsProps = {
  card: ExploreCardModel;
  actions: ActivityMapPeekAction[];
  linkRideshareTenantId: string | null;
  onAction: (id: ActivityMapPeekActionId) => void;
  onGuestGatedAction?: () => void;
  joinStateLoading?: boolean;
  onBeforeDetailNavigate?: () => void;
  joinUiState?: JoinRequestUiState;
};

const prominenceClass = (prominence: ActivityMapPeekAction['prominence']): string => {
  switch (prominence) {
    case 'primary':
      return EXPLORE_PEEK_CTA.primary;
    case 'secondary':
      return EXPLORE_PEEK_CTA.secondary;
    case 'link':
      return `block w-full text-center ${EXPLORE_PEEK_CTA.link}`;
    case 'text':
      return EXPLORE_PEEK_CTA.secondaryText;
    default:
      return EXPLORE_PEEK_CTA.primary;
  }
};

const dualPrimaryClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-xl bg-emerald-600 px-3 text-center text-sm font-bold text-white shadow-sm hover:bg-emerald-700';

const dualSecondaryClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-center text-sm font-bold text-neutral-800';

const actionLabel = (action: ActivityMapPeekAction, card: ExploreCardModel): string => {
  if (action.id === 'request_join') return card.primaryCta;
  if (action.id === 'message_host') return LIST_FEED_CTA_MESSAGE_HOST;
  return activityMapPeekActionLabel(action.id, action);
};

const isConsumerDualRow = (
  primary: ActivityMapPeekAction | undefined,
  secondary: ActivityMapPeekAction | undefined
): boolean =>
  Boolean(
    primary &&
      secondary?.id === 'message_host' &&
      (primary.id === 'request_join' || primary.id === 'pending_join')
  );

/** Activity map peek — render `viewerAccess.mapPeekActions` (wire ids, not roles). */
export const ExploreActivityMapPeekActions = ({
  card,
  actions,
  linkRideshareTenantId,
  onAction,
  onGuestGatedAction,
  joinStateLoading = false,
  onBeforeDetailNavigate,
  joinUiState,
}: ExploreActivityMapPeekActionsProps) => {
  const gate = onGuestGatedAction;
  const activity = card.activity;

  const pendingJoinLabel =
    joinUiState?.kind === 'pending'
      ? pendingApprovalLabel(joinUiState.status)
      : null;

  const runGated = (id: ActivityMapPeekActionId) => {
    if (gate) {
      gate();
      return;
    }
    onAction(id);
  };

  const visible = actions.filter((action) => {
    if (action.id === 'link_rideshare') {
      return (
        Boolean(linkRideshareTenantId && activity && canLinkRideshareToActivity(activity)) &&
        Boolean(card.viewerAccess?.entitlements?.canAddLinkedRide)
      );
    }
    if (action.id === 'offer_rideshare') {
      return Boolean(card.viewerAccess?.entitlements?.canOfferTransport);
    }
    return true;
  });

  if (visible.length === 0) return null;

  const primaryAction = visible.find((action) => action.prominence === 'primary');
  const secondaryAction = visible.find((action) => action.prominence === 'secondary');
  const dualRow = isConsumerDualRow(primaryAction, secondaryAction);
  const paired = new Set(
    dualRow && primaryAction && secondaryAction ? [primaryAction, secondaryAction] : []
  );

  return (
    <div className="space-y-3">
      {dualRow && primaryAction && secondaryAction ? (
        <div className="space-y-2">
          <div className="flex w-full gap-2">
            {primaryAction.id === 'pending_join' ? (
              <button
                type="button"
                disabled
                className={`${dualPrimaryClass} bg-amber-100 text-amber-900`}
              >
                {actionLabel(primaryAction, card)}
              </button>
            ) : primaryAction.id === 'request_join' && pendingJoinLabel ? (
              <button
                type="button"
                disabled
                className={`${dualPrimaryClass} bg-amber-100 text-amber-900`}
              >
                {pendingJoinLabel}
              </button>
            ) : (
              <button type="button" onClick={() => runGated(primaryAction.id)} className={dualPrimaryClass}>
                {actionLabel(primaryAction, card)}
              </button>
            )}
            <button
              type="button"
              onClick={() => runGated(secondaryAction.id)}
              className={dualSecondaryClass}
            >
              {actionLabel(secondaryAction, card)}
            </button>
          </div>
        </div>
      ) : null}

      {visible.map((action) => {
        if (paired.has(action)) return null;

        if (action.id === 'view_detail') {
          const className = prominenceClass(action.prominence);
          const label = activityMapPeekActionLabel(action.id, action);
          const activityId = card.activityId ?? card.activity?.id;
          const hrefOverride = activityId ? activityDetailPath(activityId) : undefined;
          return (
            <ExplorePeekDetailLink
              key={action.id}
              card={card}
              label={label}
              className={className}
              hrefOverride={hrefOverride}
              joinStateLoading={joinStateLoading}
              onGuestGatedAction={gate}
              onBeforeNavigate={onBeforeDetailNavigate}
            />
          );
        }

        if (action.id === 'pending_join') {
          return (
            <div key={action.id} className="space-y-2">
              <button
                type="button"
                disabled
                className="w-full rounded-2xl bg-amber-100 py-3.5 text-base font-bold text-amber-900 disabled:opacity-100"
              >
                {activityMapPeekActionLabel(action.id, action)}
              </button>
            </div>
          );
        }

        if (action.id === 'withdraw_join') {
          const label = activityMapPeekActionLabel(action.id, action);
          const className =
            action.prominence === 'text'
              ? EXPLORE_PEEK_CTA.secondaryText
              : prominenceClass(action.prominence);
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => runGated(action.id)}
              className={className}
            >
              {label}
            </button>
          );
        }

        if (action.id === 'request_join' && pendingJoinLabel) {
          return (
            <button
              key={action.id}
              type="button"
              disabled
              className="w-full rounded-2xl bg-amber-100 py-3.5 text-base font-bold text-amber-900 disabled:opacity-100"
            >
              {pendingJoinLabel}
            </button>
          );
        }

        const joinLabel = actionLabel(action, card);

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => runGated(action.id)}
            className={
              action.id === 'request_join'
                ? 'w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white'
                : prominenceClass(action.prominence)
            }
          >
            {joinLabel}
          </button>
        );
      })}
    </div>
  );
};
