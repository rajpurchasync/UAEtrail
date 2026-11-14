import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { FileText } from 'lucide-react';
import { ActivityPeekFooterIcon } from './ActivityPeekFooterIcon';
import { activityDetailPath } from '../../../../config/routingCatalog';
import { EXPLORE_PEEK_CTA } from '../../../../config/exploreTheme';
import {
  discoveryCardActivityJoinIsFull,
  type DiscoveryCardModel,
} from '../../../../discovery/discoveryCardModel';
import {
  activityPeekHasMapWireActions,
  resolveActivityMapPeekActions,
} from '../../../../activity/activityPeekEngagement';
import { useAuth } from '../../../../context/AuthContext';
import { viewerIsActivityHostUser } from '../../../../utils/viewerHostsActivity';
import {
  resolveActivityDetailStandardFooter,
  type ActivityDetailFooterAction,
  type ActivityDetailFooterButton,
} from '../../../../components/activity/detail/activityDetailFooterSlots';
import type { JoinRequestUiState } from '../../../../utils/joinRequestUi';
import { useLocation } from 'react-router-dom';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';
import { mapPeekDetailNavState } from '../../../mapPeekDetailNavState';
import { resolveListFeedFooterModel, type ListFeedFooterButton } from '../../../../list/listFeedFooterActions';

export type ActivityPeekStandardFooterProps = {
  card: DiscoveryCardModel;
  joinUiState: JoinRequestUiState;
  joinStateLoading?: boolean;
  onAction: (id: ActivityMapPeekActionId) => void;
  onJoin?: () => void;
  onWithdraw?: () => void;
  onGuestGatedAction?: (action: ActivityMapPeekActionId) => void;
  onBeforeDetailNavigate?: () => void;
};

const peekDetailLabel = (
  <>
    <ActivityPeekFooterIcon icon={FileText} />
    <span>Details</span>
  </>
);

const buttonClass = (button: ActivityDetailFooterButton): string => {
  if (button.disabled && button.tone === 'status') return EXPLORE_PEEK_CTA.peekJoinPending;
  if (button.disabled || button.tone === 'muted') return EXPLORE_PEEK_CTA.peekJoinDisabled;
  if (button.tone === 'primary') return EXPLORE_PEEK_CTA.peekJoin;
  if (button.tone === 'danger') return EXPLORE_PEEK_CTA.peekTile;
  return EXPLORE_PEEK_CTA.peekTile;
};

const wireActionButtonClass = (role: 'primary' | 'secondary'): string =>
  role === 'primary' ? EXPLORE_PEEK_CTA.peekJoin : EXPLORE_PEEK_CTA.peekTile;

/** Map peek footer. Same membership states as the activity detail sticky footer, plus Details. */
export const ActivityPeekStandardFooter = ({
  card,
  joinUiState,
  joinStateLoading = false,
  onAction,
  onJoin,
  onWithdraw,
  onGuestGatedAction,
  onBeforeDetailNavigate,
}: ActivityPeekStandardFooterProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const gate = onGuestGatedAction;
  const activity = card.activity;
  const hostOnRecord = Boolean(activity && (activity.hostUserId || activity.hostId));
  const isHost =
    activity && hostOnRecord
      ? viewerIsActivityHostUser(activity, user?.id)
      : card.viewerAccess?.level === 'host';
  const joinFull = discoveryCardActivityJoinIsFull(card);
  const mapWire = activityPeekHasMapWireActions(card);
  const joinLoading = joinStateLoading && !mapWire && joinUiState.kind === 'open';
  const canManageParticipation =
    Boolean(onWithdraw) &&
    (joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed');
  const peekWireActions = resolveActivityMapPeekActions(card, joinUiState);
  const pendingWire = peekWireActions.find((action) => action.id === 'pending_join');
  const hostWirePeek = isHost && mapWire;

  const hostWireFooter = hostWirePeek
    ? resolveListFeedFooterModel(card, { isGuest: false, joinUiState })
    : null;

  const footer = hostWirePeek
    ? null
    : resolveActivityDetailStandardFooter({
        isHost,
        joinUiState,
        viewerLevel: card.viewerAccess?.level ?? null,
        wirePending: Boolean(pendingWire),
        pendingStatus: pendingWire?.joinRequestStatus ?? null,
        joinFull,
        joinLabel: joinLoading ? 'Loading…' : card.primaryCta,
        canManageParticipation,
      });

  const run = (id: ActivityMapPeekActionId, effect: () => void) => {
    if (gate) {
      gate(id);
      return;
    }
    effect();
  };

  const press = (action: ActivityDetailFooterAction) => {
    switch (action) {
      case 'request_join':
        run('request_join', () => {
          if (onJoin) onJoin();
          else onAction('request_join');
        });
        return;
      case 'message_host':
        run('message_host', () => onAction('message_host'));
        return;
      case 'open_crew_chat':
        run('open_crew_chat', () => onAction('open_crew_chat'));
        return;
      case 'invite_crew':
      case 'participant_invite':
        run('invite_crew', () => onAction('invite_crew'));
        return;
      case 'participant_withdraw':
        run('withdraw_join', () => {
          if (onWithdraw) onWithdraw();
          else onAction('withdraw_join');
        });
        return;
      case 'share_activity':
        run('share_activity', () => onAction('share_activity'));
        return;
      case 'host_manage':
        run('manage_activity', () => onAction('manage_activity'));
        return;
      case 'open_pending_manage':
      case 'open_participation_manage':
        return;
      default: {
        const _exhaustive: never = action;
        return _exhaustive;
      }
    }
  };

  const renderWireAction = (button: ListFeedFooterButton, role: 'primary' | 'secondary') => {
    if (button.kind === 'disabled') {
      return (
        <button type="button" disabled className={EXPLORE_PEEK_CTA.peekJoinPending}>
          {button.label}
        </button>
      );
    }
    if (button.kind !== 'action') return null;
    return (
      <button
        type="button"
        className={wireActionButtonClass(role)}
        onClick={() => run(button.actionId, () => onAction(button.actionId))}
      >
        {button.label}
      </button>
    );
  };

  const buttons = hostWirePeek
    ? null
    : [footer!.left, footer!.center, footer!.right].filter(
        (button): button is ActivityDetailFooterButton => Boolean(button)
      );
  const activityId = card.activityId ?? card.activity?.id;
  const detailHref = activityId ? activityDetailPath(activityId) : card.path;
  const footerMode = hostWirePeek ? 'host' : footer!.mode;

  return (
    <div className="space-y-1.5" data-activity-peek-standard-footer={footerMode}>
      <div className={`grid gap-1.5 ${buttons && buttons.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {hostWirePeek && hostWireFooter ? (
          <>
            {renderWireAction(hostWireFooter.primary, 'primary')}
            {hostWireFooter.secondary
              ? renderWireAction(hostWireFooter.secondary, 'secondary')
              : null}
          </>
        ) : (
          buttons?.map((button) => (
            <button
              key={button.action}
              type="button"
              disabled={button.disabled || (joinLoading && button.action === 'request_join')}
              className={buttonClass(button)}
              onClick={() => press(button.action)}
            >
              {button.label}
            </button>
          ))
        )}
      </div>
      {detailHref ? (
        <PeekDetailLink
          card={card}
          label={peekDetailLabel}
          className={EXPLORE_PEEK_CTA.peekTile}
          hrefOverride={detailHref}
          joinStateLoading={false}
          onGuestGatedAction={gate ? () => gate('view_detail') : undefined}
          onBeforeNavigate={onBeforeDetailNavigate}
          linkState={mapPeekDetailNavState(location)}
          ariaLabel="View details"
        />
      ) : null}
    </div>
  );
};