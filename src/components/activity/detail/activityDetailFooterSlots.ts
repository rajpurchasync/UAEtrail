import type { ActivityViewerAccessLevel } from '@uaetrail/shared-types';
import {
  ACTIVITY_CTA_MESSAGE_HOST,
  ACTIVITY_CTA_OPEN_CHAT,
  ACTIVITY_PEEK_MANAGE_LABEL,
} from '../../../content/activityParticipationCopy';
import { ACTIVITY_DETAIL_TAB_FOOTER_SHARE_OUTING } from '../../../content/activityDetailCopy';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';
import { pendingApprovalLabel } from '../../../utils/joinRequestUi';

/** Same two slots on every outing. Labels change only with membership, not activity type. */
export type ActivityDetailFooterMode = 'open' | 'pending' | 'joined' | 'host';

export type ActivityDetailFooterAction =
  | 'request_join'
  | 'open_pending_manage'
  | 'message_host'
  | 'open_crew_chat'
  | 'open_participation_manage'
  | 'invite_crew'
  | 'share_activity'
  | 'host_manage';

export type ActivityDetailFooterButton = {
  label: string;
  action: ActivityDetailFooterAction;
  disabled: boolean;
  tone: 'primary' | 'secondary' | 'status' | 'muted';
};

export type ActivityDetailStandardFooterModel = {
  mode: ActivityDetailFooterMode;
  left: ActivityDetailFooterButton;
  right: ActivityDetailFooterButton;
};

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
 * Going: Open chat + Manage (invite and leave live in Manage).
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
    (input.joinUiState.kind === 'pending' ||
      level === 'join_request' ||
      Boolean(input.wirePending));

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
    return {
      mode: 'joined',
      left: {
        label: ACTIVITY_CTA_OPEN_CHAT,
        action: 'open_crew_chat',
        disabled: false,
        tone: 'primary',
      },
      right: {
        label: ACTIVITY_PEEK_MANAGE_LABEL,
        action: input.canManageParticipation ? 'open_participation_manage' : 'invite_crew',
        disabled: false,
        tone: 'secondary',
      },
    };
  }

  if (pending) {
    return {
      mode: 'pending',
      left: {
        label: pendingLabel(input.joinUiState, input.pendingStatus),
        action: 'open_pending_manage',
        disabled: !input.canManageParticipation,
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
