import { RequestStatus } from '../domain/enums.js';
import {
  findActivityParticipantByEventAndUser,
  findActivityRequestByEventAndUser,
} from '../lib/activity-engagement-store.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import {
  createActivityGroup,
  ensureGroupMember,
  findGroupByActivityId,
  getGroupMembership,
  removeGroupMember,
} from '../lib/social-groups-store.js';

/** Activity chat stays open until one week after the scheduled activity start. */
export const ACTIVITY_CHAT_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export const isActivityGroupChatOpen = (startAt: Date): boolean =>
  Date.now() <= startAt.getTime() + ACTIVITY_CHAT_GRACE_MS;

const resolveActivityHostUserId = (eventDoc: { hostId?: string | null; createdById?: string }): string | null =>
  eventDoc.hostId ?? eventDoc.createdById ?? null;

/** Ensure the activity host is in the group. Participants opt in via joinActivityGroupChatForUser. */
export const syncActivityGroupChatRoster = async (
  activityId: string,
  groupId: string
): Promise<void> => {
  const eventDoc = await findActivityDocInMongo(activityId);
  if (!eventDoc) return;

  const hostUserId = resolveActivityHostUserId(eventDoc);
  if (!hostUserId) return;

  await ensureGroupMember({
    groupId,
    userId: hostUserId,
    role: 'admin',
    createdByUserId: hostUserId,
  });
};

/** Resolve the one group chat tied to this activity (does not create). */
export const resolveActivityGroupChatId = async (activityId: string): Promise<string | null> => {
  const group = await findGroupByActivityId(activityId);
  return group?.id ?? null;
};

/**
 * Create the activity group chat when the outing is created or published.
 * Idempotent — safe to call more than once.
 */
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
      hostUserId,
    });
  }

  await syncActivityGroupChatRoster(activityId, group.id);
  return group.id;
};

/** Open chat: one group per activity — resolve existing, or provision once if legacy data has none. */
export const openActivityGroupChat = async (activityId: string): Promise<string | null> => {
  let groupId = await resolveActivityGroupChatId(activityId);
  if (!groupId) {
    groupId = await ensureActivityGroupChat(activityId);
  }
  if (!groupId) return null;
  await syncActivityGroupChatRoster(activityId, groupId);
  return groupId;
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
    createdByUserId: hostUserId,
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

export type ActivityGroupChatStatus = {
  groupId: string | null;
  membershipId: string | null;
  isMember: boolean;
  canLeave: boolean;
};

export const getActivityGroupChatStatusForUser = async (input: {
  activityId: string;
  userId: string;
}): Promise<ActivityGroupChatStatus | null> => {
  const allowed = await userCanAccessActivityGroupChat(input);
  if (!allowed) return null;

  const group = await findGroupByActivityId(input.activityId);
  if (!group) {
    return { groupId: null, membershipId: null, isMember: false, canLeave: false };
  }

  const membership = await getGroupMembership(group.id, input.userId);
  const isHostAdmin = group.adminUserId === input.userId;

  return {
    groupId: group.id,
    membershipId: membership?.id ?? null,
    isMember: Boolean(membership),
    canLeave: Boolean(membership) && !isHostAdmin,
  };
};

export const joinActivityGroupChatForUser = async (input: {
  activityId: string;
  userId: string;
}): Promise<ActivityGroupChatStatus> => {
  const allowed = await userCanAccessActivityGroupChat(input);
  if (!allowed) {
    throw new Error('forbidden');
  }

  const groupId = await openActivityGroupChat(input.activityId);
  if (!groupId) {
    throw new Error('group_chat_unavailable');
  }

  await addParticipantToActivityGroupChat({
    activityId: input.activityId,
    userId: input.userId,
  });

  const status = await getActivityGroupChatStatusForUser(input);
  if (!status?.groupId) {
    throw new Error('group_chat_unavailable');
  }
  return status;
};

export const leaveActivityGroupChatForUser = async (input: {
  activityId: string;
  userId: string;
}): Promise<void> => {
  const group = await findGroupByActivityId(input.activityId);
  if (!group) return;

  if (group.adminUserId === input.userId) {
    throw new Error('group_owner_cannot_leave');
  }

  const membership = await getGroupMembership(group.id, input.userId);
  if (!membership) return;

  await removeParticipantFromActivityGroupChat({
    activityId: input.activityId,
    userId: input.userId,
  });
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
