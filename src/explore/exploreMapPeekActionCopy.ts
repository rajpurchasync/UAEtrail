import type { ActivityMapPeekAction, ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { JOIN_CANCEL_REQUEST_BUTTON } from '../content/joinWithdrawCopy';
import { pendingApprovalLabel } from '../utils/joinRequestUi';
import { ORGANIZE_LINK_RIDESHARE_LABEL } from './createFlowCopy';

export const activityMapPeekActionLabel = (
  id: ActivityMapPeekActionId,
  action?: Pick<ActivityMapPeekAction, 'joinRequestStatus'>
): string => {
  switch (id) {
    case 'open_crew_chat':
      return 'Message';
    case 'link_rideshare':
    case 'offer_rideshare':
      return ORGANIZE_LINK_RIDESHARE_LABEL;
    case 'share_activity':
      return 'Share outing';
    case 'manage_activity':
      return 'Manage';
    case 'withdraw_join':
      return JOIN_CANCEL_REQUEST_BUTTON;
    case 'message_host':
      return 'Message organizer';
    case 'invite_crew':
      return 'Ask your crew to join';
    case 'view_detail':
      return 'View full details';
    case 'request_join':
      return 'Join';
    case 'pending_join':
      return action?.joinRequestStatus
        ? pendingApprovalLabel(action.joinRequestStatus)
        : 'Waiting for organizer';
    default:
      return id;
  }
};
