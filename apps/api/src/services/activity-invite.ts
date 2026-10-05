import {
  ACTIVITY_JOIN_INVITE_DAILY_LIMIT_PER_ACTIVITY,
  ACTIVITY_JOIN_INVITE_WINDOW_MS,
  type ActivityJoinInviteForViewerDTO,
} from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findActivityParticipantByEventAndUser } from '../lib/activity-engagement-store.js';
import { findPublishedActivityWithPreviewsById } from '../lib/activities-store.js';
import {
  countActivityJoinInvitesFromSenderSince,
  findPendingActivityInviteForInvitee,
  findPendingActivityInviteForPair,
  listPendingActivityInviteeIdsForSender,
  upsertActivityInvite,
} from '../lib/activity-invites-store.js';
import { notifyActivityJoinInvite } from './activity-invite-notifications.js';
import { resolveNotificationActorDisplayName } from './notification-actor-label.js';

const assertViewerMaySendActivityJoinInvite = async (
  activityId: string,
  viewerUserId: string
): Promise<void> => {
  const activity = await findPublishedActivityWithPreviewsById(activityId);
  if (!activity) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const hostUserId = activity.hostId ?? activity.createdById ?? null;
  const isHost = hostUserId === viewerUserId;
  const participant = await findActivityParticipantByEventAndUser(activityId, viewerUserId);
  const isGoing = Boolean(participant);

  if (!isHost && !isGoing) {
    throw new ApiError(
      403,
      'forbidden',
      'Only the host or people already going can invite friends to join.'
    );
  }
};

export const listActivityJoinInvitesSent = async (input: {
  activityId: string;
  fromUserId: string;
}): Promise<{ inviteeUserIds: string[] }> => {
  await assertViewerMaySendActivityJoinInvite(input.activityId, input.fromUserId);
  const inviteeUserIds = await listPendingActivityInviteeIdsForSender({
    activityId: input.activityId,
    fromUserId: input.fromUserId,
  });
  return { inviteeUserIds };
};

export const createActivityJoinInvite = async (input: {
  activityId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<{ id: string; status: 'pending' }> => {
  if (input.fromUserId === input.toUserId) {
    throw new ApiError(400, 'invalid_invite', 'You cannot invite yourself.');
  }

  await assertViewerMaySendActivityJoinInvite(input.activityId, input.fromUserId);

  const existingPending = await findPendingActivityInviteForPair(input);
  if (!existingPending) {
    const since = new Date(Date.now() - ACTIVITY_JOIN_INVITE_WINDOW_MS);
    const sentCount = await countActivityJoinInvitesFromSenderSince({
      activityId: input.activityId,
      fromUserId: input.fromUserId,
      since,
    });
    if (sentCount >= ACTIVITY_JOIN_INVITE_DAILY_LIMIT_PER_ACTIVITY) {
      throw new ApiError(
        429,
        'rate_limit',
        'You have sent the maximum Join me invites for this outing today. Try again tomorrow or share the link instead.'
      );
    }
  }

  const invite = await upsertActivityInvite(input);
  await notifyActivityJoinInvite(input);

  return { id: invite._id, status: 'pending' };
};

export const createActivityJoinInvites = async (input: {
  activityId: string;
  fromUserId: string;
  toUserIds: string[];
}): Promise<{ sent: number; inviteeUserIds: string[] }> => {
  const unique = [...new Set(input.toUserIds.filter((id) => id && id !== input.fromUserId))];
  const inviteeUserIds: string[] = [];
  for (const toUserId of unique) {
    try {
      await createActivityJoinInvite({
        activityId: input.activityId,
        fromUserId: input.fromUserId,
        toUserId,
      });
      inviteeUserIds.push(toUserId);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'rate_limit') {
        break;
      }
    }
  }
  return { sent: inviteeUserIds.length, inviteeUserIds };
};

export const resolveViewerPendingJoinInvite = async (
  activityId: string,
  viewerUserId: string
): Promise<ActivityJoinInviteForViewerDTO | null> => {
  const pending = await findPendingActivityInviteForInvitee({
    activityId,
    toUserId: viewerUserId,
  });
  if (!pending) return null;

  const inviterDisplayName = await resolveNotificationActorDisplayName(
    pending.fromUserId,
    viewerUserId
  );
  return { fromUserId: pending.fromUserId, inviterDisplayName };
};
