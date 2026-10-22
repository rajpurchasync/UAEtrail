import type { ReactNode } from 'react';
import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { FileText, MessageCircle, MessageSquare, UserPlus } from 'lucide-react';
import { ActivityPeekFooterIcon } from './ActivityPeekFooterIcon';
import { activityDetailPath } from '../../../../config/routingCatalog';
import { EXPLORE_PEEK_CTA } from '../../../../config/exploreTheme';
import {
  ACTIVITY_CTA_MESSAGE_HOST,
  ACTIVITY_CTA_OPEN_GROUP_CHAT,
  ACTIVITY_PEEK_ALREADY_JOINED,
} from '../../../../content/activityParticipationCopy';
import { ACTIVITY_INVITE_FRIENDS_CTA } from '../../../../content/activityInviteCopy';
import {
  activityPeekViewerCanOpenGroupChat,
  activityPeekViewerIsJoined,
  activityPeekHasMapWireActions,
} from '../../../../activity/activityPeekEngagement';
import { ACTIVITY_DETAIL_GROUP_CHAT_ACTION } from '../../../../content/activityDetailCopy';
import {
  discoveryCardActivityJoinIsFull,
  type DiscoveryCardModel,
} from '../../../../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../../../../utils/joinRequestUi';
import { pendingApprovalLabel } from '../../../../utils/joinRequestUi';
import { useLocation } from 'react-router-dom';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';
import { mapPeekDetailNavState } from '../../../mapPeekDetailNavState';

export type ActivityPeekStandardFooterProps = {
  card: DiscoveryCardModel;
  joinUiState: JoinRequestUiState;
  joinStateLoading?: boolean;
  onAction: (id: ActivityMapPeekActionId) => void;
  onJoin?: () => void;
  onGuestGatedAction?: (action: ActivityMapPeekActionId) => void;
  onBeforeDetailNavigate?: () => void;
};

const PeekFooterIconTile = ({
  icon,
  label,
  className,
  ariaLabel,
  onClick,
}: {
  icon: ReactNode;
  label: ReactNode;
  className: string;
  ariaLabel: string;
  onClick?: () => void;
}) => (
  <button type="button" onClick={onClick} className={className} aria-label={ariaLabel}>
    {icon}
    <span className="max-w-full px-0.5">{label}</span>
  </button>
);

const peekDetailLabel = (
  <>
    <ActivityPeekFooterIcon icon={FileText} />
    <span>Details</span>
  </>
);

/** Fixed map peek footer — join, message, invitation, view details (AD-PEEK parity). */
export const ActivityPeekStandardFooter = ({
  card,
  joinUiState,
  joinStateLoading = false,
  onAction,
  onJoin,
  onGuestGatedAction,
  onBeforeDetailNavigate,
}: ActivityPeekStandardFooterProps) => {
  const location = useLocation();
  const gate = onGuestGatedAction;
  const isHost = card.viewerAccess?.level === 'host';
  const joined = activityPeekViewerIsJoined(card, joinUiState) || isHost;
  const canOpenGroupChat = activityPeekViewerCanOpenGroupChat(card, joinUiState);
  const joinFull = discoveryCardActivityJoinIsFull(card);
  const mapWire = activityPeekHasMapWireActions(card);
  const joinLoading = joinStateLoading && !mapWire && joinUiState.kind === 'open';

  const run = (id: ActivityMapPeekActionId) => {
    if (gate) {
      gate(id);
      return;
    }
    onAction(id);
  };

  const joinButton = () => {
    if (joinLoading) {
      return (
        <button type="button" disabled className={EXPLORE_PEEK_CTA.peekJoinDisabled}>
          Loading…
        </button>
      );
    }
    if (isHost) {
      return (
        <button type="button" disabled className={EXPLORE_PEEK_CTA.peekJoinDisabled}>
          {ACTIVITY_PEEK_ALREADY_JOINED}
        </button>
      );
    }
    if (joinUiState.kind === 'confirmed' || activityPeekViewerIsJoined(card, joinUiState)) {
      return (
        <button type="button" disabled className={EXPLORE_PEEK_CTA.peekJoinDisabled}>
          {ACTIVITY_PEEK_ALREADY_JOINED}
        </button>
      );
    }
    if (joinUiState.kind === 'pending') {
      return (
        <button type="button" disabled className={EXPLORE_PEEK_CTA.peekJoinPending}>
          {pendingApprovalLabel(joinUiState.status)}
        </button>
      );
    }
    if (joinFull) {
      return (
        <button type="button" disabled className={EXPLORE_PEEK_CTA.peekJoinDisabled}>
          Full
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          if (onJoin) {
            onJoin();
            return;
          }
          if (gate) {
            gate('request_join');
            return;
          }
          onAction('request_join');
        }}
        className={EXPLORE_PEEK_CTA.peekJoin}
      >
        {card.primaryCta}
      </button>
    );
  };

  const messageAria = canOpenGroupChat ? ACTIVITY_CTA_OPEN_GROUP_CHAT : ACTIVITY_CTA_MESSAGE_HOST;
  const messageAction = canOpenGroupChat ? 'open_crew_chat' : 'message_host';
  const messageIcon = canOpenGroupChat ? (
    <ActivityPeekFooterIcon icon={MessageSquare} />
  ) : (
    <ActivityPeekFooterIcon icon={MessageCircle} />
  );
  const messageLabel = canOpenGroupChat ? ACTIVITY_DETAIL_GROUP_CHAT_ACTION : ACTIVITY_CTA_MESSAGE_HOST;

  const activityId = card.activityId ?? card.activity?.id;
  const detailHref = activityId ? activityDetailPath(activityId) : card.path;

  return (
    <div className="space-y-1.5" data-activity-peek-standard-footer>
      {joinButton()}
      <div className="grid grid-cols-3 gap-1.5">
        <PeekFooterIconTile
          icon={messageIcon}
          label={messageLabel}
          className={EXPLORE_PEEK_CTA.peekTile}
          ariaLabel={messageAria}
          onClick={() => run(messageAction)}
        />
        <PeekFooterIconTile
          icon={<ActivityPeekFooterIcon icon={UserPlus} />}
          label="Invite friends"
          className={EXPLORE_PEEK_CTA.peekTile}
          ariaLabel={ACTIVITY_INVITE_FRIENDS_CTA}
          onClick={() => run('invite_crew')}
        />
        {detailHref ? (
          <PeekDetailLink
            card={card}
            label={peekDetailLabel}
            className={EXPLORE_PEEK_CTA.peekTile}
            hrefOverride={detailHref}
            joinStateLoading={false}
            onGuestGatedAction={gate ? () => gate('view_detail') : undefined}
            onBeforeNavigate={onBeforeDetailNavigate}
            linkState={mapPeekDetailNavState(location, card.id)}
            ariaLabel="View details"
          />
        ) : (
          <span className={EXPLORE_PEEK_CTA.peekTile} aria-hidden />
        )}
      </div>
    </div>
  );
};
