import { RequestStatus } from '../domain/enums.js';
import {
  findActivityParticipantByEventAndUser,
  findActivityRequestByEventAndUser,
  listActivityParticipantsWithUsers
} from '../lib/activity-engagement-store.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import {
  createActivityGroup,
  ensureGroupMember,
  findGroupByActivityId,
  removeGroupMember
} from '../lib/social-groups-store.js';

/** Trip chat stays open until one week after the scheduled activity start. */
export const TRIP_CHAT_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export const isActivityGroupChatOpen = (startAt: Date): boolean =>
  Date.now() <= startAt.getTime() + TRIP_CHAT_GRACE_MS;

const resolveActivityHostUserId = (eventDoc: { hostId?: string | null; createdById?: string }): string | null =>
  eventDoc.hostId ?? eventDoc.createdById ?? null;

export const ensureActivityGroupChat = async (activityId: string): Promise<string | null> => {
  const eventDoc = await findActivityDocInMongo(activityId);
  if (!eventDoc) return null;

  const hostUserId = resolveActivityHostUserId(eventDoc);
  if (!hostUserId) return null;

  let group = await findGroupByActivityId(activityId);
  if (!group) {
    group = await createActivityGroup({
      activityId,
      activityTitle: eventDoc.title,
      hostUserId
    });
  }

  await ensureGroupMember({
    groupId: group.id,
    userId: hostUserId,
    role: 'admin',
    createdByUserId: hostUserId
  });

  const participants = await listActivityParticipantsWithUsers(activityId);
  await Promise.all(
    participants.map((participant) =>
      ensureGroupMember({
        groupId: group!.id,
        userId: participant.userId,
        role: 'buddy',
        createdByUserId: hostUserId
      })
    )
  );

  return group.id;
};

export const addParticipantToActivityGroupChat = async (input: {
  activityId: string;
  userId: string;
}): Promise<void> => {
  const groupId = await ensureActivityGroupChat(input.activityId);
  if (!groupId) return;

  const eventDoc = await findActivityDocInMongo(input.activityId);
  const hostUserId = eventDoc ? resolveActivityHostUserId(eventDoc) : null;
  if (!hostUserId) return;

  await ensureGroupMember({
    groupId,
    userId: input.userId,
    role: 'buddy',
    createdByUserId: hostUserId
  });
};

export const removeParticipantFromActivityGroupChat = async (input: {
  activityId: string;
  userId: string;
}): Promise<void> => {
  const group = await findGroupByActivityId(input.activityId);
  if (!group) return;
  await removeGroupMember(group.id, input.userId);
};

export const userCanAccessActivityGroupChat = async (input: {
  activityId: string;
  userId: string;
}): Promise<boolean> => {
  const eventDoc = await findActivityDocInMongo(input.activityId);
  if (!eventDoc) return false;
  if (!isActivityGroupChatOpen(eventDoc.startAt)) return false;

  const hostUserId = resolveActivityHostUserId(eventDoc);
  if (hostUserId === input.userId || eventDoc.createdById === input.userId) {
    return true;
  }

  const participant = await findActivityParticipantByEventAndUser(input.activityId, input.userId);
  if (participant) return true;

  const request = await findActivityRequestByEventAndUser(input.activityId, input.userId);
  return request?.status === RequestStatus.APPROVED;
};
