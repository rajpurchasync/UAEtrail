import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import {
  activityDetailPath,
  messagesGroupPath,
  messagesToUserPath,
  MESSAGES_PATH,
} from '../config/routingCatalog';
import type { GuestSheetSurface } from '../hooks/useActivityJoinFlow';
import {
  AUTH_RESUME_CREW_CHAT_QUERY,
  withAuthResumeInviteFriends,
  withAuthResumeQuery,
} from '../utils/authReturnContext';

export type ActivityPeekGuestAuthInput = {
  guestSheetSurface: GuestSheetSurface;
  guestSheetIntent: 'activity' | 'place';
  pendingPeekAction: ActivityMapPeekActionId | null;
  activity?: {
    id: string;
    hostUserId?: string | null;
    organizerUserId?: string | null;
    groupChatId?: string | null;
  } | null;
  browseReturnPath: string;
};

const messageHostChatPath = (activityId: string, hostUserId: string): string => {
  const params = new URLSearchParams({ to: hostUserId, activity: activityId });
  return `${MESSAGES_PATH}?${params.toString()}`;
};

const crewChatPath = (activityId: string, groupChatId?: string | null): string => {
  if (groupChatId?.trim()) {
    return messagesGroupPath(groupChatId.trim(), activityId);
  }
  const params = new URLSearchParams({
    activity: activityId,
    [AUTH_RESUME_CREW_CHAT_QUERY]: '1',
  });
  return `${MESSAGES_PATH}?${params.toString()}`;
};

/** Post-auth destination after guest taps a map peek CTA (join sheet or browse gate). */
export const resolveActivityPeekGuestAuthReturnPath = (
  input: ActivityPeekGuestAuthInput
): string | undefined => {
  const {
    guestSheetSurface,
    guestSheetIntent,
    pendingPeekAction,
    activity,
    browseReturnPath,
  } = input;

  if (guestSheetIntent !== 'activity' || !activity?.id) {
    return guestSheetSurface === 'browse' ? browseReturnPath : undefined;
  }

  const detail = activityDetailPath(activity.id);
  const action =
    guestSheetSurface === 'join' ? ('request_join' as const) : pendingPeekAction ?? 'view_detail';

  switch (action) {
    case 'request_join':
      return withAuthResumeQuery(detail, { join: true });
    case 'message_host': {
      const hostUserId = activity.hostUserId ?? activity.organizerUserId ?? null;
      if (!hostUserId) return detail;
      return messageHostChatPath(activity.id, hostUserId);
    }
    case 'open_crew_chat':
      return crewChatPath(activity.id, activity.groupChatId);
    case 'invite_crew':
      return withAuthResumeInviteFriends(detail);
    case 'view_detail':
      return detail;
    default:
      return detail;
  }
};
