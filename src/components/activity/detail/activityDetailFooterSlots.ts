import type { ActivityViewerAccessLevel } from '@uaetrail/shared-types';
import {
  ACTIVITY_CTA_MESSAGE_HOST,
  ACTIVITY_CTA_OPEN_CHAT,
  ACTIVITY_PEEK_MANAGE_LABEL,
} from '../../../content/activityParticipationCopy';
import { ACTIVITY_INVITE_FRIENDS_CTA } from '../../../content/activityInviteCopy';
import {
  JOIN_CANCEL_REQUEST_BUTTON,
  JOIN_WITHDRAW_APPROVED_REQUEST_BUTTON,
} from '../../../content/joinWithdrawCopy';
import { ACTIVITY_DETAIL_TAB_FOOTER_SHARE_OUTING } from '../../../content/activityDetailCopy';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';
import { pendingApprovalLabel, withdrawModalVariant } from '../../../utils/joinRequestUi';

/** Same two slots on every outing. Labels change only with membership, not activity type. */
export type ActivityDetailFooterMode = 'open' | 'pending' | 'joined' | 'host';

export type ActivityDetailFooterAction =
  | 'request_join'
  | 'open_pending_manage'
  | 'message_host'
  | 'open_crew_chat'
  | 'open_participation_manage'
  | 'participant_invite'
  | 'participant_withdraw'
  | 'invite_crew'
  | 'share_activity'
  | 'host_manage';

export type ActivityDetailFooterButton = {
  label: string;
  action: ActivityDetailFooterAction;
  disabled: boolean;
  tone: 'primary' | 'secondary' | 'status' | 'muted' | 'danger';
};

export type ActivityDetailStandardFooterModel = {
  mode: ActivityDetailFooterMode;
  left: ActivityDetailFooterButton;
  right: ActivityDetailFooterButton;
  /** Third slot — invite + withdraw inline (no Manage sheet). */
  center?: ActivityDetailFooterButton;
};

const participantWithdrawLabel = (joinUiState: JoinRequestUiState): string =>
  withdrawModalVariant(joinUiState) === 'activity'
    ? JOIN_WITHDRAW_APPROVED_REQUEST_BUTTON
    : JOIN_CANCEL_REQUEST_BUTTON;

const inviteFriendsButton = (): ActivityDetailFooterButton => ({
  label: ACTIVITY_INVITE_FRIENDS_CTA,
  action: 'participant_invite',
  disabled: false,
  tone: 'secondary',
});

const withdrawButton = (joinUiState: JoinRequestUiState): ActivityDetailFooterButton => ({
  label: participantWithdrawLabel(joinUiState),
  action: 'participant_withdraw',
  disabled: false,
  tone: 'danger',
});

const JOINED_LEVELS = new Set<ActivityViewerAccessLevel>([
  'participant',
  'activity_group_member',
]);

const pendingLabel = (
  joinUiState: JoinRequestUiState,
  pendingStatus?: 'pending' | 'waitlisted' | null
): string => {
  if (joinUiState.kind === 'pending') return pendingApprovalLabel(joinUiState.status);
  if (pendingStatus) return pendingApprovalLabel(pendingStatus);
  return 'Pending approval';
};

/**
 * Consumer activity detail sticky footer.
 * Not going: join status + Message host.
 * Going: Open chat + Invite + Withdraw (no Manage sheet).
 * Pending (with manage): Invite + Cancel/withdraw + Message host.
 * Hosting: Share outing + Manage.
 */
export const resolveActivityDetailStandardFooter = (input: {
  isHost: boolean;
  joinUiState: JoinRequestUiState;
  viewerLevel?: ActivityViewerAccessLevel | null;
  wirePending?: boolean;
  pendingStatus?: 'pending' | 'waitlisted' | null;
  joinFull?: boolean;
  joinLabel: string;
  canManageParticipation?: boolean;
}): ActivityDetailStandardFooterModel => {
  const level = input.viewerLevel ?? null;
  const joined =
    !input.isHost &&
    (input.joinUiState.kind === 'confirmed' || (level != null && JOINED_LEVELS.has(level)));
  const pending =
    !input.isHost &&
    !joined &&
    (input.joinUiState.kind === 'pending' || Boolean(input.wirePending));

  if (input.isHost) {
    return {
      mode: 'host',
      left: {
        label: ACTIVITY_DETAIL_TAB_FOOTER_SHARE_OUTING,
        action: 'share_activity',
        disabled: false,
        tone: 'primary',
      },
      right: {
        label: ACTIVITY_PEEK_MANAGE_LABEL,
        action: 'host_manage',
        disabled: false,
        tone: 'secondary',
      },
    };
  }

  if (joined) {
    if (input.canManageParticipation) {
      return {
        mode: 'joined',
        left: {
          label: ACTIVITY_CTA_OPEN_CHAT,
          action: 'open_crew_chat',
          disabled: false,
          tone: 'primary',
        },
        center: inviteFriendsButton(),
        right: withdrawButton(input.joinUiState),
      };
    }
    return {
      mode: 'joined',
      left: {
        label: ACTIVITY_CTA_OPEN_CHAT,
        action: 'open_crew_chat',
        disabled: false,
        tone: 'primary',
      },
      right: {
        label: ACTIVITY_INVITE_FRIENDS_CTA,
        action: 'invite_crew',
        disabled: false,
        tone: 'secondary',
      },
    };
  }

  if (pending) {
    if (input.canManageParticipation) {
      return {
        mode: 'pending',
        left: inviteFriendsButton(),
        center: withdrawButton(input.joinUiState),
        right: {
          label: ACTIVITY_CTA_MESSAGE_HOST,
          action: 'message_host',
          disabled: false,
          tone: 'secondary',
        },
      };
    }
    return {
      mode: 'pending',
      left: {
        label: pendingLabel(input.joinUiState, input.pendingStatus),
        action: 'open_pending_manage',
        disabled: true,
        tone: 'status',
      },
      right: {
        label: ACTIVITY_CTA_MESSAGE_HOST,
        action: 'message_host',
        disabled: false,
        tone: 'secondary',
      },
    };
  }

  const joinLabel = input.joinLabel.trim() || 'Join';
  return {
    mode: 'open',
    left: {
      label: joinLabel,
      action: 'request_join',
      disabled: Boolean(input.joinFull),
      tone: input.joinFull ? 'muted' : 'primary',
    },
    right: {
      label: ACTIVITY_CTA_MESSAGE_HOST,
      action: 'message_host',
      disabled: false,
      tone: 'secondary',
    },
  };
};
