import type {
  ActivityMapPeekAction,
  ActivityMapPeekActionId,
  ActivityViewerAccessLevel,
} from '@uaetrail/shared-types';
import { ACTIVITY_INVITE_FRIENDS_CTA } from '../content/activityInviteCopy';
import {
  ACTIVITY_CTA_MESSAGE_HOST,
  ACTIVITY_CTA_OPEN_CHAT,
  ACTIVITY_PEEK_MANAGE_LABEL,
} from '../content/activityParticipationCopy';
import { JOIN_CANCEL_REQUEST_BUTTON } from '../content/joinWithdrawCopy';
import { pendingApprovalLabel } from '../utils/joinRequestUi';
import { HOSTING_LINK_RIDESHARE_LABEL } from './createFlowCopy';

export type ActivityMapPeekActionLabelContext = {
  /** Map peek vs activity detail CTA row. */
  surface?: 'peek' | 'detail';
  viewerLevel?: ActivityViewerAccessLevel | null;
  /** Signed-in join UI — pending / confirmed remap labels and Manage. */
  joinPhase?: 'open' | 'pending' | 'confirmed';
};

export const activityMapPeekViewDetailLabel = (
  context?: ActivityMapPeekActionLabelContext
): string => {
  if (context?.surface === 'peek') {
    if (context.joinPhase === 'pending') return ACTIVITY_PEEK_MANAGE_LABEL;
    return 'View details';
  }
  if (context?.joinPhase === 'pending' || context?.joinPhase === 'confirmed') {
    return ACTIVITY_PEEK_MANAGE_LABEL;
  }
  if (
    context?.viewerLevel === 'participant' ||
    context?.viewerLevel === 'activity_group_member' ||
    context?.viewerLevel === 'join_request'
  ) {
    return ACTIVITY_PEEK_MANAGE_LABEL;
  }
  return 'View full details';
};

export const activityMapPeekActionLabel = (
  id: ActivityMapPeekActionId,
  action?: Pick<ActivityMapPeekAction, 'joinRequestStatus'>,
  context?: ActivityMapPeekActionLabelContext
): string => {
  switch (id) {
    case 'open_crew_chat':
      return context?.joinPhase === 'confirmed' ||
        context?.viewerLevel === 'participant' ||
        context?.viewerLevel === 'activity_group_member' ||
        context?.viewerLevel === 'host'
        ? ACTIVITY_CTA_OPEN_CHAT
        : 'Message';
    case 'link_rideshare':
    case 'offer_rideshare':
      return HOSTING_LINK_RIDESHARE_LABEL;
    case 'share_activity':
      return 'Share outing';
    case 'manage_activity':
      return ACTIVITY_PEEK_MANAGE_LABEL;
    case 'withdraw_join':
      return JOIN_CANCEL_REQUEST_BUTTON;
    case 'message_host':
      return ACTIVITY_CTA_MESSAGE_HOST;
    case 'invite_crew':
      return ACTIVITY_INVITE_FRIENDS_CTA;
    case 'view_detail':
      return activityMapPeekViewDetailLabel(context);
    case 'request_join':
      return 'Join';
    case 'pending_join':
      return action?.joinRequestStatus
        ? pendingApprovalLabel(action.joinRequestStatus)
        : 'Waiting for host';
    default:
      return id;
  }
};
