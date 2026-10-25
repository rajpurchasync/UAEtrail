import type { ActivityMapPeekAction, ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { EXPLORE_PEEK_CTA } from '../../../../config/exploreTheme';
import {
  activityMapPeekActionLabel,
  type ActivityMapPeekActionLabelContext,
} from '../../../exploreMapPeekActionCopy';
import {
  activityPeekHasMapWireActions,
  filterActivityMapPeekFooterActions,
} from '../../../../activity/activityPeekEngagement';
import { canLinkRideshareToActivity } from '../../../linkActivityRideshareOffer';
import { activityDetailPath } from '../../../../config/routingCatalog';
import {
  discoveryCardActivityJoinIsFull,
  type DiscoveryCardModel,
} from '../../../../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../../../../utils/joinRequestUi';
import { pendingApprovalLabel } from '../../../../utils/joinRequestUi';
import { useLocation } from 'react-router-dom';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';
import { mapPeekDetailNavState } from '../../../mapPeekDetailNavState';

export type ActivityPeekEngagementActionsProps = {
  card: DiscoveryCardModel;
  actions: ActivityMapPeekAction[];
  linkRideshareTenantId: string | null;
  onAction: (id: ActivityMapPeekActionId) => void;
  onGuestGatedAction?: () => void;
  joinStateLoading?: boolean;
  onBeforeDetailNavigate?: () => void;
  joinUiState?: JoinRequestUiState;
  surface?: 'peek' | 'detail';
  onOpenParticipationManage?: () => void;
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

const detailDualPrimaryClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-center text-sm font-bold text-white shadow-sm active:bg-emerald-700';

const detailDualSecondaryClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl border border-white/70 bg-white/75 px-4 text-center text-sm font-bold text-neutral-800 shadow-sm backdrop-blur-sm active:bg-white/90';

const joinPhaseFromUi = (
  joinUiState?: JoinRequestUiState
): ActivityMapPeekActionLabelContext['joinPhase'] => {
  if (joinUiState?.kind === 'pending') return 'pending';
  if (joinUiState?.kind === 'confirmed') return 'confirmed';
  return 'open';
};

const actionLabel = (
  action: ActivityMapPeekAction,
  card: DiscoveryCardModel,
  labelContext: ActivityMapPeekActionLabelContext
): string => {
  if (action.id === 'request_join') return card.primaryCta;
  return activityMapPeekActionLabel(action.id, action, labelContext);
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

const isDetailCrewInviteRow = (
  primary: ActivityMapPeekAction | undefined,
  secondary: ActivityMapPeekAction | undefined
): boolean =>
  Boolean(primary?.id === 'open_crew_chat' && secondary?.id === 'invite_crew');

/** Renders `viewerAccess.mapPeekActions` on activity pin summary (wire ids). */
export const ActivityPeekEngagementActions = ({
  card,
  actions,
  linkRideshareTenantId,
  onAction,
  onGuestGatedAction,
  joinStateLoading = false,
  onBeforeDetailNavigate,
  joinUiState,
  surface = 'peek',
  onOpenParticipationManage,
}: ActivityPeekEngagementActionsProps) => {
  const location = useLocation();
  const isDetailBar = surface === 'detail';
  const rowClass = isDetailBar ? 'flex w-full gap-2.5' : 'flex w-full gap-2';
  const detailStackClass = isDetailBar ? 'w-full space-y-2' : 'space-y-2';
  const detailRootClass = isDetailBar ? 'w-full' : 'space-y-3';
  const primaryBtnClass = isDetailBar ? detailDualPrimaryClass : dualPrimaryClass;
  const secondaryBtnClass = isDetailBar ? detailDualSecondaryClass : dualSecondaryClass;
  const fullWidthBtnClass = (base: string) =>
    isDetailBar ? `${base} w-full rounded-2xl` : base;

  const gate = onGuestGatedAction;
  const peekDetailNavState = mapPeekDetailNavState(location, card.id);
  const activity = card.activity;
  const viewerLevel = card.viewerAccess?.level ?? null;
  const labelContext: ActivityMapPeekActionLabelContext = {
    surface,
    viewerLevel,
    joinPhase: joinPhaseFromUi(joinUiState),
  };
  const joinFull = discoveryCardActivityJoinIsFull(card);
  const joinPrimaryClass = joinFull
    ? 'w-full rounded-2xl bg-neutral-200 py-3.5 text-base font-bold text-neutral-500 cursor-not-allowed'
    : 'w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white';

  const pendingJoinLabel =
    joinUiState?.kind === 'pending' ? pendingApprovalLabel(joinUiState.status) : null;
  const mapSuppliedPeekWire = activityPeekHasMapWireActions(card);
  const effectiveJoinStateLoading = mapSuppliedPeekWire ? false : joinStateLoading;
  const joinAffordanceLoading = Boolean(
    effectiveJoinStateLoading && joinUiState?.kind === 'open'
  );

  const runGated = (id: ActivityMapPeekActionId) => {
    if (gate) {
      gate();
      return;
    }
    onAction(id);
  };

  const scopedActions =
    surface === 'peek'
      ? filterActivityMapPeekFooterActions(actions, joinUiState, viewerLevel)
      : actions.filter((action) => action.id !== 'view_detail' && action.id !== 'withdraw_join');

  const visible = scopedActions.filter((action) => {
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

  const detailPending = surface === 'detail' && joinUiState?.kind === 'pending';
  const detailJoined = surface === 'detail' && joinUiState?.kind === 'confirmed';

  if (detailPending && onOpenParticipationManage) {
    const messageHost = visible.find((action) => action.id === 'message_host');
    const pendingDisabled = visible.find((action) => action.id === 'pending_join');
    return (
      <div className={detailStackClass}>
        {pendingDisabled ? (
          <button
            type="button"
            disabled
            className={fullWidthBtnClass(
              'w-full bg-amber-100 py-3.5 text-base font-bold text-amber-900 disabled:opacity-100'
            )}
          >
            {actionLabel(pendingDisabled, card, labelContext)}
          </button>
        ) : null}
        <div className={rowClass}>
          {messageHost ? (
            <button
              type="button"
              onClick={() => runGated('message_host')}
              className={secondaryBtnClass}
            >
              {actionLabel(messageHost, card, labelContext)}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onOpenParticipationManage()}
            className={primaryBtnClass}
          >
            {activityMapPeekActionLabel('manage_activity', undefined, labelContext)}
          </button>
        </div>
      </div>
    );
  }

  if (detailJoined && onOpenParticipationManage) {
    const chat = visible.find((action) => action.id === 'open_crew_chat');
    const inviteCrew = visible.find((action) => action.id === 'invite_crew');
    if (chat && inviteCrew) {
      return (
        <div className={detailStackClass}>
          <div className={rowClass}>
            <button type="button" onClick={() => runGated('open_crew_chat')} className={primaryBtnClass}>
              {actionLabel(chat, card, labelContext)}
            </button>
            <button type="button" onClick={() => runGated('invite_crew')} className={secondaryBtnClass}>
              {actionLabel(inviteCrew, card, labelContext)}
            </button>
          </div>
        </div>
      );
    }
    if (chat) {
      return (
        <div className={rowClass}>
          <button type="button" onClick={() => runGated('open_crew_chat')} className={primaryBtnClass}>
            {actionLabel(chat, card, labelContext)}
          </button>
          <button type="button" onClick={() => onOpenParticipationManage()} className={secondaryBtnClass}>
            {activityMapPeekActionLabel('manage_activity', undefined, labelContext)}
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onOpenParticipationManage()}
        className={fullWidthBtnClass(primaryBtnClass)}
      >
        {activityMapPeekActionLabel('manage_activity', undefined, labelContext)}
      </button>
    );
  }

  if (visible.length === 0) return null;

  const primaryAction = visible.find((action) => action.prominence === 'primary');
  const secondaryAction = visible.find((action) => action.prominence === 'secondary');
  const dualRow =
    isConsumerDualRow(primaryAction, secondaryAction) ||
    (surface === 'detail' && isDetailCrewInviteRow(primaryAction, secondaryAction));
  const paired = new Set(
    dualRow && primaryAction && secondaryAction ? [primaryAction, secondaryAction] : []
  );

  return (
    <div className={detailRootClass}>
      {dualRow && primaryAction && secondaryAction ? (
        <div className={detailStackClass}>
          <div className={rowClass}>
            {primaryAction.id === 'pending_join' ? (
              <button
                type="button"
                disabled
                className={`${primaryBtnClass} bg-amber-100 text-amber-900`}
              >
                {actionLabel(primaryAction, card, labelContext)}
              </button>
            ) : primaryAction.id === 'request_join' && joinFull ? (
              <button type="button" disabled className={`${primaryBtnClass} bg-neutral-200 text-neutral-500`}>
                {actionLabel(primaryAction, card, labelContext)}
              </button>
            ) : primaryAction.id === 'request_join' && pendingJoinLabel ? (
              <button
                type="button"
                disabled
                className={`${primaryBtnClass} bg-amber-100 text-amber-900`}
              >
                {pendingJoinLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => runGated(primaryAction.id)}
                disabled={primaryAction.id === 'request_join' && joinAffordanceLoading}
                className={primaryBtnClass}
              >
                {primaryAction.id === 'request_join' && joinAffordanceLoading
                  ? 'Loading…'
                  : actionLabel(primaryAction, card, labelContext)}
              </button>
            )}
            <button
              type="button"
              onClick={() => runGated(secondaryAction.id)}
              className={secondaryBtnClass}
            >
              {actionLabel(secondaryAction, card, labelContext)}
            </button>
          </div>
        </div>
      ) : null}

      {visible.map((action) => {
        if (paired.has(action)) return null;

        if (action.id === 'view_detail') {
          const className = prominenceClass(action.prominence);
          const label = activityMapPeekActionLabel(action.id, action, labelContext);
          const activityId = card.activityId ?? card.activity?.id;
          const hrefOverride = activityId ? activityDetailPath(activityId) : undefined;
          return (
            <PeekDetailLink
              key={action.id}
              card={card}
              label={label}
              className={className}
              hrefOverride={hrefOverride}
              joinStateLoading={effectiveJoinStateLoading}
              onGuestGatedAction={gate}
              onBeforeNavigate={onBeforeDetailNavigate}
              linkState={peekDetailNavState}
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
          const label = activityMapPeekActionLabel(action.id, action, labelContext);
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

        const joinLabel = actionLabel(action, card, labelContext);
        const isRequestJoin = action.id === 'request_join';

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => runGated(action.id)}
            disabled={(isRequestJoin && joinFull) || (isRequestJoin && joinAffordanceLoading)}
            className={isRequestJoin ? joinPrimaryClass : prominenceClass(action.prominence)}
          >
            {isRequestJoin && joinAffordanceLoading ? 'Loading…' : joinLabel}
          </button>
        );
      })}
    </div>
  );
};
