import { ApiError } from '../lib/api-error.js';
import {
  getActivityGroupChatStatusForUser,
  joinActivityGroupChatForUser,
  leaveActivityGroupChatForUser,
  openActivityGroupChat,
  userCanAccessActivityGroupChat,
} from './activity-group-chat.js';

export const loadMyActivityGroupChatEntry = async (input: { activityId: string; userId: string }) => {
  const allowed = await userCanAccessActivityGroupChat({
    activityId: input.activityId,
    userId: input.userId,
  });
  if (!allowed) {
    throw new ApiError(403, 'forbidden', 'You cannot access this activity chat.');
  }

  const groupId = await openActivityGroupChat(input.activityId);
  if (!groupId) {
    throw new ApiError(
      404,
      'group_chat_unavailable',
      'Activity chat is not set up for this outing yet.'
    );
  }

  const status = await getActivityGroupChatStatusForUser({
    activityId: input.activityId,
    userId: input.userId,
  });

  return {
    groupId,
    membershipId: status?.membershipId ?? null,
    isMember: status?.isMember ?? false,
    canLeave: status?.canLeave ?? false,
  };
};

export const loadMyActivityGroupChatStatus = async (input: { activityId: string; userId: string }) => {
  const status = await getActivityGroupChatStatusForUser({
    activityId: input.activityId,
    userId: input.userId,
  });
  if (!status) {
    throw new ApiError(403, 'forbidden', 'You cannot access this activity chat.');
  }
  return status;
};

export const joinMyActivityGroupChat = async (input: { activityId: string; userId: string }) => {
  try {
    return await joinActivityGroupChatForUser({
      activityId: input.activityId,
      userId: input.userId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'forbidden') {
      throw new ApiError(403, 'forbidden', 'You cannot join this activity chat.');
    }
    throw new ApiError(404, 'group_chat_unavailable', 'Activity chat is not set up for this outing yet.');
  }
};

export const leaveMyActivityGroupChat = async (input: { activityId: string; userId: string }) => {
  try {
    await leaveActivityGroupChatForUser({
      activityId: input.activityId,
      userId: input.userId,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'group_owner_cannot_leave') {
      throw new ApiError(
        403,
        'group_owner_cannot_leave',
        'Hosts stay in the crew chat to coordinate the outing.'
      );
    }
    throw err;
  }
};
