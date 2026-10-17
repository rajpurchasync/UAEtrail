import {
  acceptBuddyRequest,
  cancelBuddyRequest,
  createBuddyRequest,
  declineBuddyRequest,
  unfriendBuddy,
} from '../lib/buddy-store.js';
import { notifyBuddyRequestAccepted, notifyBuddyRequestReceived } from './buddy-notifications.js';

export const unfriendBuddyForUser = async (viewerUserId: string, targetUserId: string) => {
  await unfriendBuddy(viewerUserId, targetUserId);
  return { unfriended: true };
};

export const submitBuddyRequest = async (input: {
  fromUserId: string;
  toUserId: string;
  message?: string | null;
}) => {
  const request = await createBuddyRequest({
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    message: input.message,
  });

  if (request.status === 'pending') {
    await notifyBuddyRequestReceived({
      requestId: request.id,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
    });
  } else if (request.status === 'accepted') {
    await notifyBuddyRequestAccepted({
      requestId: request.id,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
    });
  }

  return request;
};

export const acceptBuddyRequestForUser = async (requestId: string, userId: string) => {
  const request = await acceptBuddyRequest(requestId, userId);
  await notifyBuddyRequestAccepted({
    requestId: request.id,
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
  });
  return request;
};

export const declineBuddyRequestForUser = (requestId: string, userId: string) =>
  declineBuddyRequest(requestId, userId);

export const cancelBuddyRequestForUser = (requestId: string, userId: string) =>
  cancelBuddyRequest(requestId, userId);
