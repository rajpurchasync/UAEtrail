import type { Collection } from 'mongodb';
import type { GroupWallReplyPreviewDTO } from '@uaetrail/shared-types';
import { buildGroupWallReplyPreview } from './reply-preview.js';
import { newEntityId } from './entity-builders.js';
import { findAuthUsersByIds } from './auth-users.js';
import { getMongoClient } from './mongo.js';
import { normalizeSearchRegexInput } from './regex-search.js';

export type GroupType = 'family' | 'friends' | 'activity';
export type GroupRole = 'admin' | 'buddy';
export type GroupMemberType = 'adult' | 'kid';
export type GroupInviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export type GroupStatus = 'active' | 'suspended';

export type GroupWallPostPolicy = 'all_members' | 'admins_only';

export type GroupRecord = {
  id: string;
  type: GroupType;
  name: string;
  slogan: string | null;
  bannerUrl: string | null;
  photoUrl: string | null;
  adminUserId: string;
  activityId: string | null;
  status: GroupStatus;
  wallPostPolicy: GroupWallPostPolicy;
  createdAt: Date;
  updatedAt: Date;
};

export type GroupMemberRecord = {
  id: string;
  groupId: string;
  userId: string | null;
  role: GroupRole;
  memberType: GroupMemberType;
  displayName: string | null;
  invitedEmail: string | null;
  createdByUserId: string;
  createdAt: Date;
  isActive: boolean;
};

export type GroupInviteRecord = {
  id: string;
  groupId: string;
  invitedByUserId: string;
  email: string;
  role: GroupRole;
  token: string;
  status: GroupInviteStatus;
  acceptedByUserId: string | null;
  acceptedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export const GROUP_WALL_REACTION_KINDS = [
  'like',
  'dislike',
  'happy',
  'heart',
  'laugh',
  'mountain',
  'camping',
  'car'
] as const;

export type GroupWallReactionKind = (typeof GROUP_WALL_REACTION_KINDS)[number];

export type GroupWallReactionSummary = {
  kind: GroupWallReactionKind;
  count: number;
  reactedByMe: boolean;
};

export type GroupWallMessageRecord = {
  id: string;
  groupId: string;
  authorUserId: string;
  body: string;
  replyToMessageId?: string | null;
  createdAt: Date;
  reactions?: GroupWallReactionSummary[];
};

export type PresentedGroupWallMessage = GroupWallMessageRecord & {
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  reactions: GroupWallReactionSummary[];
  replyToPreview?: GroupWallReplyPreviewDTO | null;
};

type MongoGroup = {
  _id: string;
  type: GroupType;
  name: string;
  slogan: string | null;
  bannerUrl: string | null;
  photoUrl: string | null;
  adminUserId: string;
  activityId?: string | null;
  status?: GroupStatus;
  wallPostPolicy?: GroupWallPostPolicy;
  createdAt: Date;
  updatedAt: Date;
};

type MongoGroupMember = {
  _id: string;
  groupId: string;
  userId: string | null;
  role: GroupRole;
  memberType: GroupMemberType;
  displayName: string | null;
  invitedEmail: string | null;
  createdByUserId: string;
  createdAt: Date;
  isActive?: boolean;
  wallLastReadAt?: Date;
};

type MongoGroupInvite = {
  _id: string;
  groupId: string;
  invitedByUserId: string;
  email: string;
  role: GroupRole;
  token: string;
  status: GroupInviteStatus;
  acceptedByUserId: string | null;
  acceptedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type MongoGroupWallMessage = {
  _id: string;
  groupId: string;
  authorUserId: string;
  body: string;
  replyToMessageId?: string | null;
  createdAt: Date;
};

type MongoGroupWallReaction = {
  _id: string;
  groupId: string;
  messageId: string;
  userId: string;
  kind: GroupWallReactionKind;
  createdAt: Date;
};

const groupsCollection = (): Collection<MongoGroup> =>
  getMongoClient()!.db().collection<MongoGroup>('social_groups');

const membersCollection = (): Collection<MongoGroupMember> =>
  getMongoClient()!.db().collection<MongoGroupMember>('social_group_members');

const invitesCollection = (): Collection<MongoGroupInvite> =>
  getMongoClient()!.db().collection<MongoGroupInvite>('social_group_invites');

const wallCollection = (): Collection<MongoGroupWallMessage> =>
  getMongoClient()!.db().collection<MongoGroupWallMessage>('social_group_wall');

const wallReactionsCollection = (): Collection<MongoGroupWallReaction> =>
  getMongoClient()!.db().collection<MongoGroupWallReaction>('social_group_wall_reactions');

const mapGroup = (row: MongoGroup): GroupRecord => ({
  id: row._id,
  type: row.type,
  name: row.name,
  slogan: row.slogan,
  bannerUrl: row.bannerUrl,
  photoUrl: row.photoUrl,
  adminUserId: row.adminUserId,
  activityId: row.activityId ?? null,
  status: row.status ?? 'active',
  wallPostPolicy: row.wallPostPolicy ?? 'all_members',
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const mapMember = (row: MongoGroupMember): GroupMemberRecord => ({
  id: row._id,
  groupId: row.groupId,
  userId: row.userId,
  role: row.role,
  memberType: row.memberType,
  displayName: row.displayName,
  invitedEmail: row.invitedEmail,
  createdByUserId: row.createdByUserId,
  createdAt: row.createdAt,
  isActive: row.isActive ?? true
});

const mapInvite = (row: MongoGroupInvite): GroupInviteRecord => ({
  id: row._id,
  groupId: row.groupId,
  invitedByUserId: row.invitedByUserId,
  email: row.email,
  role: row.role,
  token: row.token,
  status: row.status,
  acceptedByUserId: row.acceptedByUserId,
  acceptedAt: row.acceptedAt,
  expiresAt: row.expiresAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const mapWall = (row: MongoGroupWallMessage): GroupWallMessageRecord => ({
  id: row._id,
  groupId: row.groupId,
  authorUserId: row.authorUserId,
  body: row.body,
  replyToMessageId: row.replyToMessageId ?? null,
  createdAt: row.createdAt
});

const normalizeInviteEmail = (email: string) => email.trim().toLowerCase();

export const findGroupById = async (groupId: string): Promise<GroupRecord | null> => {
  const row = await groupsCollection().findOne({ _id: groupId });
  return row ? mapGroup(row) : null;
};

export const findGroupByActivityId = async (activityId: string): Promise<GroupRecord | null> => {
  const row = await groupsCollection().findOne({ activityId });
  return row ? mapGroup(row) : null;
};

export const mapActivityIdsToGroupChatIds = async (
  activityIds: string[]
): Promise<Map<string, string>> => {
  const unique = [...new Set(activityIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const rows = await groupsCollection()
    .find({ activityId: { $in: unique } })
    .project({ _id: 1, activityId: 1 })
    .toArray();

  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.activityId) map.set(row.activityId, row._id);
  }
  return map;
};

export const createActivityGroup = async (input: {
  activityId: string;
  activityTitle: string;
  hostUserId: string;
  wallPostPolicy?: GroupWallPostPolicy;
}): Promise<GroupRecord> => {
  const now = new Date();
  const groupId = newEntityId();
  const groupDoc: MongoGroup = {
    _id: groupId,
    type: 'activity',
    name: input.activityTitle.trim() || 'Activity chat',
    slogan: null,
    bannerUrl: null,
    photoUrl: null,
    adminUserId: input.hostUserId,
    activityId: input.activityId,
    status: 'active',
    wallPostPolicy: input.wallPostPolicy ?? 'all_members',
    createdAt: now,
    updatedAt: now
  };

  const memberDoc: MongoGroupMember = {
    _id: newEntityId(),
    groupId,
    userId: input.hostUserId,
    role: 'admin',
    memberType: 'adult',
    displayName: null,
    invitedEmail: null,
    createdByUserId: input.hostUserId,
    createdAt: now,
    isActive: true
  };

  await Promise.all([groupsCollection().insertOne(groupDoc), membersCollection().insertOne(memberDoc)]);
  return mapGroup(groupDoc);
};

export const updateGroupWallPostPolicy = async (
  groupId: string,
  wallPostPolicy: GroupWallPostPolicy
): Promise<GroupRecord | null> =>
  updateGroupChatSettings(groupId, { wallPostPolicy });

export const updateGroupChatSettings = async (
  groupId: string,
  patch: { wallPostPolicy?: GroupWallPostPolicy; photoUrl?: string | null }
): Promise<GroupRecord | null> => {
  const $set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.wallPostPolicy !== undefined) {
    $set.wallPostPolicy = patch.wallPostPolicy;
  }
  if (patch.photoUrl !== undefined) {
    $set.photoUrl = patch.photoUrl?.trim() || null;
  }

  const result = await groupsCollection().findOneAndUpdate(
    { _id: groupId },
    { $set },
    { returnDocument: 'after' }
  );
  return result ? mapGroup(result) : null;
};

export const createSocialGroup = async (input: {
  creatorUserId: string;
  type: GroupType;
  name: string;
  slogan?: string;
  bannerUrl?: string;
  photoUrl?: string;
}): Promise<GroupRecord> => {
  const now = new Date();
  const groupId = newEntityId();
  const groupDoc: MongoGroup = {
    _id: groupId,
    type: input.type,
    name: input.name.trim(),
    slogan: input.slogan?.trim() || null,
    bannerUrl: input.bannerUrl?.trim() || null,
    photoUrl: input.photoUrl?.trim() || null,
    adminUserId: input.creatorUserId,
    status: 'active',
    wallPostPolicy: 'all_members',
    createdAt: now,
    updatedAt: now
  };

  const memberDoc: MongoGroupMember = {
    _id: newEntityId(),
    groupId,
    userId: input.creatorUserId,
    role: 'admin',
    memberType: 'adult',
    displayName: null,
    invitedEmail: null,
    createdByUserId: input.creatorUserId,
    createdAt: now,
    isActive: true
  };

  await Promise.all([groupsCollection().insertOne(groupDoc), membersCollection().insertOne(memberDoc)]);
  return mapGroup(groupDoc);
};

export type GroupChatPreview = {
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type GroupRecordWithChatPreview = GroupRecord & { chatPreview: GroupChatPreview };

const listGroupsForMemberships = async (memberships: MongoGroupMember[]): Promise<GroupRecord[]> => {
  if (memberships.length === 0) return [];

  const uniqueGroupIds = [...new Set(memberships.map((m) => m.groupId))];
  const groups = await groupsCollection().find({ _id: { $in: uniqueGroupIds } }).toArray();
  const byId = new Map(groups.map((g) => [g._id, g]));

  return uniqueGroupIds
    .map((id) => byId.get(id))
    .filter((row): row is MongoGroup => Boolean(row))
    .map(mapGroup);
};

export const listGroupsForUser = async (userId: string): Promise<GroupRecord[]> => {
  const memberships = await membersCollection()
    .find({ userId, memberType: 'adult' })
    .sort({ createdAt: -1 })
    .toArray();

  return listGroupsForMemberships(memberships);
};

export const listGroupsForUserWithChatPreview = async (
  userId: string
): Promise<GroupRecordWithChatPreview[]> => {
  const memberships = await membersCollection()
    .find({ userId, memberType: 'adult', isActive: { $ne: false } })
    .sort({ createdAt: -1 })
    .toArray();

  const groups = await listGroupsForMemberships(memberships);
  if (groups.length === 0) return [];

  const groupIds = groups.map((group) => group.id);
  const readAtByGroup = new Map(
    memberships.map((membership) => [membership.groupId, membership.wallLastReadAt ?? new Date(0)])
  );

  const latestRows = await wallCollection()
    .aggregate<{ _id: string; body: string; createdAt: Date }>([
      { $match: { groupId: { $in: groupIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$groupId',
          body: { $first: '$body' },
          createdAt: { $first: '$createdAt' },
        },
      },
    ])
    .toArray();
  const latestByGroup = new Map(latestRows.map((row) => [row._id, row]));

  const unreadEntries = await Promise.all(
    groupIds.map(async (groupId) => {
      const since = readAtByGroup.get(groupId) ?? new Date(0);
      const unreadCount = await wallCollection().countDocuments({
        groupId,
        createdAt: { $gt: since },
        authorUserId: { $ne: userId },
      });
      return [groupId, unreadCount] as const;
    })
  );
  const unreadByGroup = new Map(unreadEntries);

  return groups.map((group) => {
    const latest = latestByGroup.get(group.id);
    return {
      ...group,
      chatPreview: {
        lastMessageBody: latest?.body ?? null,
        lastMessageAt: latest?.createdAt?.toISOString() ?? null,
        unreadCount: unreadByGroup.get(group.id) ?? 0,
      },
    };
  });
};

export const markGroupWallRead = async (groupId: string, userId: string): Promise<void> => {
  await membersCollection().updateOne(
    { groupId, userId, memberType: 'adult' },
    { $set: { wallLastReadAt: new Date() } }
  );
};

export const listUserGroupsWithMembership = async (userId: string) => {
  const memberships = await membersCollection()
    .find({ userId, memberType: 'adult', isActive: { $ne: false } })
    .sort({ createdAt: -1 })
    .toArray();

  if (memberships.length === 0) return [];

  const groupIds = [...new Set(memberships.map((membership) => membership.groupId))];
  const groups = await groupsCollection().find({ _id: { $in: groupIds } }).toArray();
  const groupMap = new Map(groups.map((group) => [group._id, group]));

  return memberships.flatMap((membership) => {
    const group = groupMap.get(membership.groupId);
    if (!group) return [];
    return [{
      id: group._id,
      name: group.name,
      type: group.type,
      role: membership.role,
      status: group.status ?? 'active',
      joinedAt: membership.createdAt
    }];
  });
};

export const updateGroupStatus = async (
  groupId: string,
  status: GroupStatus
): Promise<GroupRecord | null> => {
  const result = await groupsCollection().findOneAndUpdate(
    { _id: groupId },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return result ? mapGroup(result) : null;
};

export const listGroupMembersDetailed = async (groupId: string) => {
  const members = await membersCollection().find({ groupId }).sort({ createdAt: 1 }).toArray();
  const adults = members.filter((member) => member.userId);
  const users = await findAuthUsersByIds(adults.map((member) => member.userId!).filter(Boolean));
  const userMap = new Map(users.map((user) => [user._id, user]));

  return members.map((member) => {
    const user = member.userId ? userMap.get(member.userId) : null;
    return {
      ...mapMember(member),
      user: user
        ? {
            id: user._id,
            email: user.email,
            displayName: user.profile.displayName,
            avatarUrl: user.profile.avatarUrl
          }
        : null
    };
  });
};

export const getGroupMembership = async (
  groupId: string,
  userId: string
): Promise<GroupMemberRecord | null> => {
  const row = await membersCollection().findOne({ groupId, userId, memberType: 'adult' });
  return row ? mapMember(row) : null;
};

/** True when both adults currently share at least one social group. */
export const usersShareActiveGroup = async (userA: string, userB: string): Promise<boolean> => {
  if (!userA || !userB) return false;
  if (userA === userB) return true;

  const memberships = await membersCollection()
    .find(
      { userId: userA, memberType: 'adult', isActive: { $ne: false } },
      { projection: { groupId: 1 } }
    )
    .toArray();
  const groupIds = [...new Set(memberships.map((row) => row.groupId).filter(Boolean))];
  if (groupIds.length === 0) return false;

  const shared = await membersCollection().findOne({
    userId: userB,
    groupId: { $in: groupIds },
    memberType: 'adult',
    isActive: { $ne: false }
  });
  return Boolean(shared);
};

export const createGroupInvite = async (input: {
  groupId: string;
  invitedByUserId: string;
  email: string;
  role: GroupRole;
  expiresInDays?: number;
}): Promise<GroupInviteRecord> => {
  const now = new Date();
  const token = newEntityId();
  const email = normalizeInviteEmail(input.email);
  const expiresAt = new Date(now.getTime() + (input.expiresInDays ?? 14) * 24 * 60 * 60 * 1000);

  await invitesCollection().updateMany(
    { groupId: input.groupId, email, status: 'pending' },
    { $set: { status: 'cancelled', updatedAt: now } }
  );

  const invite: MongoGroupInvite = {
    _id: newEntityId(),
    groupId: input.groupId,
    invitedByUserId: input.invitedByUserId,
    email,
    role: input.role,
    token,
    status: 'pending',
    acceptedByUserId: null,
    acceptedAt: null,
    expiresAt,
    createdAt: now,
    updatedAt: now
  };

  await invitesCollection().insertOne(invite);
  return mapInvite(invite);
};

export const listGroupInvites = async (groupId: string): Promise<GroupInviteRecord[]> => {
  const rows = await invitesCollection().find({ groupId }).sort({ createdAt: -1 }).toArray();
  return rows.map(mapInvite);
};

const markInviteAccepted = async (inviteId: string, acceptedByUserId: string, now: Date): Promise<void> => {
  await invitesCollection().updateOne(
    { _id: inviteId },
    {
      $set: {
        status: 'accepted',
        acceptedByUserId,
        acceptedAt: now,
        updatedAt: now
      }
    }
  );
};

const upsertAdultMembership = async (input: {
  groupId: string;
  userId: string;
  role: GroupRole;
  createdByUserId: string;
  invitedEmail?: string | null;
}) => {
  const now = new Date();
  const existing = await membersCollection().findOne({
    groupId: input.groupId,
    userId: input.userId,
    memberType: 'adult'
  });

  if (existing) {
    if (existing.role !== input.role) {
      await membersCollection().updateOne({ _id: existing._id }, { $set: { role: input.role } });
      const updated = await membersCollection().findOne({ _id: existing._id });
      return mapMember(updated ?? existing);
    }
    return mapMember(existing);
  }

  const doc: MongoGroupMember = {
    _id: newEntityId(),
    groupId: input.groupId,
    userId: input.userId,
    role: input.role,
    memberType: 'adult',
    displayName: null,
    invitedEmail: input.invitedEmail ?? null,
    createdByUserId: input.createdByUserId,
    createdAt: now
  };

  await membersCollection().insertOne(doc);
  return mapMember(doc);
};

export const ensureGroupMember = async (input: {
  groupId: string;
  userId: string;
  role: GroupRole;
  createdByUserId: string;
}): Promise<GroupMemberRecord> => {
  const member = await upsertAdultMembership({
    groupId: input.groupId,
    userId: input.userId,
    role: input.role,
    createdByUserId: input.createdByUserId
  });
  await membersCollection().updateOne({ _id: member.id }, { $set: { isActive: true } });
  return member;
};

export const removeGroupMember = async (groupId: string, userId: string): Promise<void> => {
  await membersCollection().deleteOne({ groupId, userId, memberType: 'adult' });
};

export const acceptGroupInviteByToken = async (input: {
  token: string;
  userId: string;
  email: string;
}): Promise<GroupInviteRecord | null> => {
  const inviteRow = await invitesCollection().findOne({ token: input.token });
  if (!inviteRow) return null;

  const now = new Date();
  if (inviteRow.status !== 'pending' || inviteRow.expiresAt < now) {
    return mapInvite(inviteRow);
  }

  if (normalizeInviteEmail(input.email) !== inviteRow.email) {
    throw new Error('This invite was sent to a different email address.');
  }

  await upsertAdultMembership({
    groupId: inviteRow.groupId,
    userId: input.userId,
    role: inviteRow.role,
    createdByUserId: inviteRow.invitedByUserId,
    invitedEmail: inviteRow.email
  });

  await markInviteAccepted(inviteRow._id, input.userId, now);

  const updated = await invitesCollection().findOne({ _id: inviteRow._id });
  return updated ? mapInvite(updated) : null;
};

export const acceptPendingGroupInvitesForEmail = async (input: {
  userId: string;
  email: string;
}): Promise<number> => {
  const email = normalizeInviteEmail(input.email);
  const now = new Date();
  const invites = await invitesCollection().find({ email, status: 'pending' }).toArray();

  let acceptedCount = 0;
  for (const invite of invites) {
    if (invite.expiresAt < now) {
      await invitesCollection().updateOne(
        { _id: invite._id },
        { $set: { status: 'expired', updatedAt: now } }
      );
      continue;
    }

    await upsertAdultMembership({
      groupId: invite.groupId,
      userId: input.userId,
      role: invite.role,
      createdByUserId: invite.invitedByUserId,
      invitedEmail: invite.email
    });

    await markInviteAccepted(invite._id, input.userId, now);
    acceptedCount += 1;
  }

  return acceptedCount;
};

export const findGroupMemberById = async (
  groupId: string,
  membershipId: string
): Promise<GroupMemberRecord | null> => {
  const row = await membersCollection().findOne({ _id: membershipId, groupId });
  return row ? mapMember(row) : null;
};

export const setGroupMembershipActiveState = async (membershipId: string, isActive: boolean) => {
  const updated = await membersCollection().findOneAndUpdate(
    { _id: membershipId },
    { $set: { isActive } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    throw new Error('Group membership not found.');
  }

  return mapMember(updated);
};

export const updateGroupMemberRole = async (input: {
  groupId: string;
  membershipId: string;
  role: GroupRole;
  ownerUserId: string;
}): Promise<GroupMemberRecord> => {
  const group = await findGroupById(input.groupId);
  if (!group) {
    throw new Error('Group not found.');
  }
  if (group.adminUserId !== input.ownerUserId) {
    throw new Error('Only the group owner can change member roles.');
  }

  const member = await findGroupMemberById(input.groupId, input.membershipId);
  if (!member) {
    throw new Error('Group membership not found.');
  }
  if (member.memberType !== 'adult') {
    throw new Error('Only adult members can have their role changed.');
  }
  if (member.userId === input.ownerUserId) {
    throw new Error('You cannot change your own role.');
  }
  if (member.userId === group.adminUserId && input.role !== 'admin') {
    throw new Error('The group owner must remain an admin.');
  }

  const updated = await membersCollection().findOneAndUpdate(
    { _id: input.membershipId, groupId: input.groupId },
    { $set: { role: input.role } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    throw new Error('Group membership not found.');
  }

  return mapMember(updated);
};

export const removeGroupMembership = async (membershipId: string) => {
  const result = await membersCollection().deleteOne({ _id: membershipId });
  return { removed: result.deletedCount > 0 };
};

export const createKidGroupMember = async (input: {
  groupId: string;
  createdByUserId: string;
  displayName: string;
  role?: GroupRole;
}): Promise<GroupMemberRecord> => {
  const doc: MongoGroupMember = {
    _id: newEntityId(),
    groupId: input.groupId,
    userId: null,
    role: input.role ?? 'buddy',
    memberType: 'kid',
    displayName: input.displayName.trim(),
    invitedEmail: null,
    createdByUserId: input.createdByUserId,
    createdAt: new Date(),
    isActive: true
  };
  await membersCollection().insertOne(doc);
  return mapMember(doc);
};

const displayNameForUser = (
  user: Awaited<ReturnType<typeof findAuthUsersByIds>>[number] | undefined
) => user?.profile.displayName ?? user?.email.split('@')[0] ?? 'Member';

const presentGroupWallMessages = async (
  groupId: string,
  messages: GroupWallMessageRecord[],
  viewerUserId?: string
): Promise<PresentedGroupWallMessage[]> => {
  if (messages.length === 0) return [];

  const replyParentIds = [
    ...new Set(
      messages.map((m) => m.replyToMessageId?.trim()).filter((id): id is string => Boolean(id))
    ),
  ];
  const parentRows =
    replyParentIds.length > 0
      ? await wallCollection().find({ groupId, _id: { $in: replyParentIds } }).toArray()
      : [];
  const parentById = new Map(parentRows.map((row) => [row._id, mapWall(row)]));

  const authorIds = [
    ...new Set([
      ...messages.map((m) => m.authorUserId),
      ...parentRows.map((row) => row.authorUserId),
    ]),
  ];
  const users = await findAuthUsersByIds(authorIds);
  const userMap = new Map(users.map((u) => [u._id, u]));

  const messageIds = messages.map((message) => message.id);
  const reactionRows = await wallReactionsCollection()
    .find({ groupId, messageId: { $in: messageIds } })
    .toArray();

  const reactionsByMessage = new Map<string, GroupWallReactionSummary[]>();
  for (const reaction of reactionRows) {
    const existing = reactionsByMessage.get(reaction.messageId) ?? [];
    const summary = existing.find((item) => item.kind === reaction.kind);
    if (summary) {
      summary.count += 1;
      if (viewerUserId && reaction.userId === viewerUserId) {
        summary.reactedByMe = true;
      }
    } else {
      existing.push({
        kind: reaction.kind,
        count: 1,
        reactedByMe: Boolean(viewerUserId && reaction.userId === viewerUserId)
      });
    }
    reactionsByMessage.set(reaction.messageId, existing);
  }

  return messages.map((message) => {
    const user = userMap.get(message.authorUserId);
    const replyId = message.replyToMessageId?.trim() || null;
    const parent = replyId ? parentById.get(replyId) : undefined;
    const parentUser = parent ? userMap.get(parent.authorUserId) : undefined;
    const replyToPreview =
      replyId && parent
        ? buildGroupWallReplyPreview(
            replyId,
            displayNameForUser(parentUser),
            parent.body
          )
        : null;

    return {
      ...message,
      author: {
        id: message.authorUserId,
        displayName: displayNameForUser(user),
        avatarUrl: user?.profile.avatarUrl ?? null,
      },
      reactions: reactionsByMessage.get(message.id) ?? [],
      replyToPreview,
    };
  });
};

export type ListGroupWallMessagesOptions = {
  limit?: number;
  viewerUserId?: string;
  /** Return messages strictly after this timestamp (ascending, for poll / SSE). */
  since?: Date;
  /** Return messages strictly before this timestamp (ascending batch, for history). */
  before?: Date;
  /** Return messages older than this wall message (compound cursor with createdAt). */
  beforeMessageId?: string;
};

export type ListGroupWallMessagesResult = {
  messages: PresentedGroupWallMessage[];
  /** True when the query hit `limit` and older messages may still exist. */
  hasMoreOlder: boolean;
};

export const listGroupWallMessages = async (
  groupId: string,
  options: ListGroupWallMessagesOptions = {}
): Promise<ListGroupWallMessagesResult> => {
  const limit = options.limit ?? 100;
  const viewerUserId = options.viewerUserId;

  const historyCursorCount = [options.before, options.beforeMessageId].filter(Boolean).length;
  if (options.since && (options.before || options.beforeMessageId)) {
    throw new Error('wall_list_since_before_conflict');
  }
  if (historyCursorCount > 1) {
    throw new Error('wall_list_before_conflict');
  }

  if (options.since) {
    const rows = await wallCollection()
      .find({ groupId, createdAt: { $gt: options.since } })
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
    const messages = rows.map(mapWall);
    const presented = await presentGroupWallMessages(groupId, messages, viewerUserId);
    return { messages: presented, hasMoreOlder: false };
  }

  if (options.beforeMessageId) {
    const anchor = await wallCollection().findOne({ _id: options.beforeMessageId, groupId });
    if (!anchor) {
      return { messages: [], hasMoreOlder: false };
    }
    const rows = await wallCollection()
      .find({
        groupId,
        $or: [
          { createdAt: { $lt: anchor.createdAt } },
          { createdAt: anchor.createdAt, _id: { $lt: anchor._id } },
        ],
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();
    const messages = rows.map(mapWall).reverse();
    const presented = await presentGroupWallMessages(groupId, messages, viewerUserId);
    return { messages: presented, hasMoreOlder: rows.length === limit };
  }

  if (options.before) {
    const rows = await wallCollection()
      .find({ groupId, createdAt: { $lt: options.before } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    const messages = rows.map(mapWall).reverse();
    const presented = await presentGroupWallMessages(groupId, messages, viewerUserId);
    return { messages: presented, hasMoreOlder: rows.length === limit };
  }

  const rows = await wallCollection().find({ groupId }).sort({ createdAt: -1 }).limit(limit).toArray();
  const messages = rows.map(mapWall).reverse();
  const presented = await presentGroupWallMessages(groupId, messages, viewerUserId);
  return { messages: presented, hasMoreOlder: rows.length === limit };
};

export const presentGroupWallMessage = async (
  groupId: string,
  message: GroupWallMessageRecord,
  viewerUserId?: string
) => {
  const [presented] = await presentGroupWallMessages(groupId, [message], viewerUserId);
  return presented;
};

export const createGroupWallMessage = async (input: {
  groupId: string;
  authorUserId: string;
  body: string;
  replyToMessageId?: string | null;
}): Promise<GroupWallMessageRecord> => {
  const replyToMessageId = input.replyToMessageId?.trim() || null;
  if (replyToMessageId) {
    const parent = await wallCollection().findOne({ _id: replyToMessageId, groupId: input.groupId });
    if (!parent) {
      throw new Error('reply_not_found');
    }
  }

  const doc: MongoGroupWallMessage = {
    _id: newEntityId(),
    groupId: input.groupId,
    authorUserId: input.authorUserId,
    body: input.body.trim(),
    replyToMessageId,
    createdAt: new Date()
  };
  await wallCollection().insertOne(doc);
  return { ...mapWall(doc), reactions: [] };
};

export const toggleGroupWallReaction = async (input: {
  groupId: string;
  messageId: string;
  userId: string;
  kind: GroupWallReactionKind;
}): Promise<{ reactions: GroupWallReactionSummary[] }> => {
  const message = await wallCollection().findOne({ _id: input.messageId, groupId: input.groupId });
  if (!message) {
    throw new Error('Message not found.');
  }

  const existing = await wallReactionsCollection().findOne({
    messageId: input.messageId,
    userId: input.userId,
    kind: input.kind
  });

  if (existing) {
    await wallReactionsCollection().deleteOne({ _id: existing._id });
  } else {
    await wallReactionsCollection().insertOne({
      _id: newEntityId(),
      groupId: input.groupId,
      messageId: input.messageId,
      userId: input.userId,
      kind: input.kind,
      createdAt: new Date()
    });
  }

  const reactionRows = await wallReactionsCollection().find({ messageId: input.messageId }).toArray();
  const reactions: GroupWallReactionSummary[] = [];
  for (const reaction of reactionRows) {
    const summary = reactions.find((item) => item.kind === reaction.kind);
    if (summary) {
      summary.count += 1;
      if (reaction.userId === input.userId) {
        summary.reactedByMe = true;
      }
    } else {
      reactions.push({
        kind: reaction.kind,
        count: 1,
        reactedByMe: reaction.userId === input.userId
      });
    }
  }

  return { reactions };
};

export const countSocialGroups = async (): Promise<number> => groupsCollection().countDocuments();

export const listAllSocialGroupsAdmin = async (input: {
  skip: number;
  take: number;
  search?: string;
  type?: GroupType;
}) => {
  const filter: Record<string, unknown> = {};
  if (input.type) filter.type = input.type;
  const searchRegex = normalizeSearchRegexInput(input.search);
  if (searchRegex) {
    filter.name = { $regex: searchRegex, $options: 'i' };
  }

  const [rows, total] = await Promise.all([
    groupsCollection().find(filter).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    groupsCollection().countDocuments(filter)
  ]);

  if (rows.length === 0) {
    return { data: [], total };
  }

  const groupIds = rows.map((row) => row._id);
  const memberCounts = await membersCollection()
    .aggregate<{ _id: string; count: number; adultCount: number }>([
      { $match: { groupId: { $in: groupIds } } },
      {
        $group: {
          _id: '$groupId',
          count: { $sum: 1 },
          adultCount: { $sum: { $cond: [{ $eq: ['$memberType', 'adult'] }, 1, 0] } }
        }
      }
    ])
    .toArray();
  const countMap = new Map(memberCounts.map((entry) => [entry._id, entry]));

  const adminUserIds = [...new Set(rows.map((row) => row.adminUserId))];
  const users = await findAuthUsersByIds(adminUserIds);
  const userMap = new Map(users.map((user) => [user._id, user]));

  const data = rows.map((row) => {
    const group = mapGroup(row);
    const counts = countMap.get(row._id);
    const admin = userMap.get(row.adminUserId);
    return {
      ...group,
      memberCount: counts?.count ?? 0,
      adultMemberCount: counts?.adultCount ?? 0,
      admin: admin
        ? {
            id: admin._id,
            email: admin.email,
            displayName: admin.profile.displayName ?? null,
            avatarUrl: admin.profile.avatarUrl ?? null
          }
        : null
    };
  });

  return { data, total };
};

export const getSocialGroupAdminDetail = async (groupId: string) => {
  const group = await findGroupById(groupId);
  if (!group) return null;

  const [members, invites, adminUsers] = await Promise.all([
    listGroupMembersDetailed(groupId),
    listGroupInvites(groupId),
    findAuthUsersByIds([group.adminUserId])
  ]);

  const admin = adminUsers[0] ?? null;
  return {
    group,
    admin: admin
      ? {
          id: admin._id,
          email: admin.email,
          displayName: admin.profile.displayName ?? null,
          avatarUrl: admin.profile.avatarUrl ?? null
        }
      : null,
    members,
    invites: invites.map(({ token: _token, ...invite }) => invite),
    stats: {
      memberCount: members.length,
      adultCount: members.filter((member) => member.memberType === 'adult').length,
      kidCount: members.filter((member) => member.memberType === 'kid').length,
      pendingInvites: invites.filter((invite) => invite.status === 'pending').length
    }
  };
};

export const deleteSocialGroup = async (groupId: string): Promise<{ deleted: boolean }> => {
  const group = await findGroupById(groupId);
  if (!group) return { deleted: false };

  await Promise.all([
    membersCollection().deleteMany({ groupId }),
    invitesCollection().deleteMany({ groupId }),
    wallCollection().deleteMany({ groupId }),
    wallReactionsCollection().deleteMany({ groupId }),
    groupsCollection().deleteOne({ _id: groupId })
  ]);

  return { deleted: true };
};
