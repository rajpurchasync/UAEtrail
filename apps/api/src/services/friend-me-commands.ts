import {
  acceptFriendRequest,
  cancelFriendRequest,
  createFriendRequest,
  declineFriendRequest,
  unfriendMember,
} from '../lib/friend-store.js';
import { notifyFriendRequestAccepted, notifyFriendRequestReceived } from './friend-notifications.js';

export const unfriendMemberForUser = async (viewerUserId: string, targetUserId: string) => {
  await unfriendMember(viewerUserId, targetUserId);
  return { unfriended: true };
};

export const submitFriendRequest = async (input: {
  fromUserId: string;
  toUserId: string;
  message?: string | null;
}) => {
  const request = await createFriendRequest({
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    message: input.message,
  });

  if (request.status === 'pending') {
    await notifyFriendRequestReceived({
      requestId: request.id,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
    });
  } else if (request.status === 'accepted') {
    await notifyFriendRequestAccepted({
      requestId: request.id,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
    });
  }

  return request;
};

export const acceptFriendRequestForUser = async (requestId: string, userId: string) => {
  const request = await acceptFriendRequest(requestId, userId);
  await notifyFriendRequestAccepted({
    requestId: request.id,
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
  });
  return request;
};

export const declineFriendRequestForUser = (requestId: string, userId: string) =>
  declineFriendRequest(requestId, userId);

export const cancelFriendRequestForUser = (requestId: string, userId: string) =>
  cancelFriendRequest(requestId, userId);
