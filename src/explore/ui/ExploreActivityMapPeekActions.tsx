import type { ActivityMapPeekAction, ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { EXPLORE_PEEK_CTA } from '../../config/exploreTheme';
import { LIST_FEED_CTA_MESSAGE_ORGANIZER } from '../../list/listFeedCtaCopy';
import { activityMapPeekActionLabel } from '../exploreMapPeekActionCopy';
import { canLinkRideshareToActivity } from '../linkActivityRideshareOffer';
import { exploreCardActivityJoinIsFull, type ExploreCardModel } from '../exploreCardModel';
import { ExplorePeekDetailLink } from './ExplorePeekDetailLink';

type ExploreActivityMapPeekActionsProps = {
  card: ExploreCardModel;
  actions: ActivityMapPeekAction[];
  linkRideshareTenantId: string | null;
  onAction: (id: ActivityMapPeekActionId) => void;
  onGuestGatedAction?: () => void;
  joinStateLoading?: boolean;
  onBeforeDetailNavigate?: () => void;
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
  if (action.id === 'message_host') return LIST_FEED_CTA_MESSAGE_ORGANIZER;
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
}: ExploreActivityMapPeekActionsProps) => {
  const gate = onGuestGatedAction;
  const activity = card.activity;
  const joinFull = exploreCardActivityJoinIsFull(card);
  const joinPrimaryClass = joinFull
    ? 'w-full rounded-2xl bg-neutral-200 py-3.5 text-base font-bold text-neutral-500 cursor-not-allowed'
    : 'w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white';

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
            ) : primaryAction.id === 'request_join' && joinFull ? (
              <button type="button" disabled className={`${dualPrimaryClass} bg-neutral-200 text-neutral-500`}>
                {actionLabel(primaryAction, card)}
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
          {primaryAction.id === 'pending_join' ? (
            <p className="text-center text-xs text-neutral-500">
              To withdraw your request, open full details — comment required for the host.
            </p>
          ) : null}
        </div>
      ) : null}

      {visible.map((action) => {
        if (paired.has(action)) return null;

        if (action.id === 'view_detail') {
          const className = prominenceClass(action.prominence);
          const label = activityMapPeekActionLabel(action.id, action);
          return (
            <ExplorePeekDetailLink
              key={action.id}
              card={card}
              label={label}
              className={className}
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
              <p className="text-center text-xs text-neutral-500">
                To withdraw your request, open full details — comment required for the host.
              </p>
            </div>
          );
        }

        const joinLabel = actionLabel(action, card);

        const isRequestJoin = action.id === 'request_join';

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => runGated(action.id)}
            disabled={isRequestJoin && joinFull}
            className={
              isRequestJoin ? joinPrimaryClass : prominenceClass(action.prominence)
            }
          >
            {joinLabel}
          </button>
        );
      })}
    </div>
  );
};
