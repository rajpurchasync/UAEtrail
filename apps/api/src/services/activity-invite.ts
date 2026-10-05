import { ApiError } from '../lib/api-error.js';
import { findActivityParticipantByEventAndUser } from '../lib/activity-engagement-store.js';
import { findPublishedActivityWithPreviewsById } from '../lib/activities-store.js';
import { upsertActivityInvite } from '../lib/activity-invites-store.js';
import { notifyActivityJoinInvite } from './activity-invite-notifications.js';

export const createActivityJoinInvite = async (input: {
  activityId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<{ id: string; status: 'pending' }> => {
  if (input.fromUserId === input.toUserId) {
    throw new ApiError(400, 'invalid_invite', 'You cannot invite yourself.');
  }

  const activity = await findPublishedActivityWithPreviewsById(input.activityId);
  if (!activity) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const hostUserId = activity.hostId ?? activity.createdById ?? null;
  const isHost = hostUserId === input.fromUserId;
  const participant = await findActivityParticipantByEventAndUser(input.activityId, input.fromUserId);
  const isGoing = Boolean(participant);

  if (!isHost && !isGoing) {
    throw new ApiError(
      403,
      'forbidden',
      'Only the host or people already going can invite friends to join.'
    );
  }

  const invite = await upsertActivityInvite(input);
  await notifyActivityJoinInvite(input);

  return { id: invite._id, status: 'pending' };
};
