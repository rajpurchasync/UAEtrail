import type { SocialTeamLabelType } from '@uaetrail/shared-types';
import { newEntityId } from './entity-builders.js';
import { findAuthUsersByIds } from './auth-users-store.js';
import { normalizeSearchRegexInput } from './regex-search.js';
import {
  GROUP_WALL_REACTION_KINDS,
  type GroupWallReactionKind,
} from '../domain/group-wall-reactions.js';
import {
  groupsCollection,
  invitesCollection,
  mapGroup,
  mapInvite,
  mapMember,
  membersCollection,
  normalizeInviteEmail,
  wallCollection,
  wallReactionsCollection,
  type MongoGroup,
  type MongoGroupInvite,
  type MongoGroupMember,
} from './social-groups-store-internals.js';
import type {
  GroupInviteRecord,
  GroupMemberRecord,
  GroupRecord,
  GroupRole,
  GroupStatus,
  GroupType,
  GroupWallPostPolicy,
} from './social-groups-store-types.js';
export {
  createGroupWallMessage,
  listGroupWallMessages,
  presentGroupWallMessage,
  toggleGroupWallReaction,
} from './social-groups-wall-store.js';
export { GROUP_WALL_REACTION_KINDS, type GroupWallReactionKind };
export type {
  GroupInviteRecord,
  GroupInviteStatus,
  GroupMemberRecord,
  GroupMemberType,
  GroupRecord,
  GroupRole,
  GroupStatus,
  GroupType,
  GroupWallMessageRecord,
  GroupWallPostPolicy,
  GroupWallReactionSummary,
  ListGroupWallMessagesOptions,
  ListGroupWallMessagesResult,
  PresentedGroupWallMessage,
} from './social-groups-store-types.js';


export const findGroupById = async (groupId: string): Promise<GroupRecord | null> => {
  const row = await groupsCollection().findOne({ _id: groupId });
  return row ? mapGroup(row) : null;
};

export const findGroupsByIds = async (groupIds: string[]): Promise<GroupRecord[]> => {
  const ids = [...new Set(groupIds.filter(Boolean))];
  if (ids.length === 0) return [];
  const rows = await groupsCollection()
    .find({ _id: { $in: ids } })
    .toArray();
  return rows.map(mapGroup);
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
    kind: 'outing_crew',
    teamLabel: null,
    type: 'outing_crew',
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
  patch: {
    wallPostPolicy?: GroupWallPostPolicy;
    photoUrl?: string | null;
    name?: string;
  }
): Promise<GroupRecord | null> => {
  const $set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.wallPostPolicy !== undefined) {
    $set.wallPostPolicy = patch.wallPostPolicy;
  }
  if (patch.photoUrl !== undefined) {
    $set.photoUrl = patch.photoUrl?.trim() || null;
  }
  if (patch.name !== undefined) {
    $set.name = patch.name.trim();
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
  teamLabel: SocialTeamLabelType;
  name: string;
  slogan?: string;
  bannerUrl?: string;
  photoUrl?: string;
}): Promise<GroupRecord> => {
  const now = new Date();
  const groupId = newEntityId();
  const groupDoc: MongoGroup = {
    _id: groupId,
    kind: 'team',
    teamLabel: input.teamLabel,
    type: input.teamLabel,
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

const listGroupsForMemberships = async (
  memberships: MongoGroupMember[],
  kind?: 'user' | 'activity'
): Promise<GroupRecord[]> => {
  if (memberships.length === 0) return [];

  const uniqueGroupIds = [...new Set(memberships.map((m) => m.groupId))];
  const typeQuery =
    kind === 'activity'
      ? {
          $or: [
            { kind: 'outing_crew' as const },
            { kind: { $exists: false }, type: { $in: ['activity', 'outing_crew'] as const } },
            { activityId: { $exists: true, $ne: null } },
          ],
        }
      : kind === 'user'
        ? {
            $or: [
              { kind: 'team' as const },
              {
                kind: { $exists: false },
                type: { $nin: ['activity', 'outing_crew'] as const },
              },
            ],
          }
        : {};
  const groups = await groupsCollection()
    .find({ _id: { $in: uniqueGroupIds }, ...typeQuery })
    .toArray();
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

export type InboxGroupPreviewFilter = {
  /** User groups (family, friends) or outing chats. */
  kind?: 'user' | 'activity';
  /** Skip last-message lookups for groups that have nothing unread. */
  unreadOnly?: boolean;
};

export const listGroupsForUserWithChatPreview = async (
  userId: string,
  filter?: InboxGroupPreviewFilter
): Promise<GroupRecordWithChatPreview[]> => {
  const memberships = await membersCollection()
    .find({ userId, memberType: 'adult', isActive: { $ne: false } })
    .sort({ createdAt: -1 })
    .toArray();

  const groups = await listGroupsForMemberships(memberships, filter?.kind);
  if (groups.length === 0) return [];

  const groupIds = groups.map((group) => group.id);
  const readAtByGroup = new Map(
    memberships.map((membership) => [membership.groupId, membership.wallLastReadAt ?? new Date(0)])
  );

  const readAtBranches = groupIds.map((groupId) => ({
    case: { $eq: ['$groupId', groupId] },
    then: readAtByGroup.get(groupId) ?? new Date(0),
  }));
  const unreadRows =
    groupIds.length === 0
      ? []
      : await wallCollection()
          .aggregate<{ _id: string; unreadCount: number }>([
            {
              $match: {
                groupId: { $in: groupIds },
                authorUserId: { $ne: userId },
              },
            },
            {
              $addFields: {
                readAt: {
                  $switch: {
                    branches: readAtBranches,
                    default: new Date(0),
                  },
                },
              },
            },
            { $match: { $expr: { $gt: ['$createdAt', '$readAt'] } } },
            { $group: { _id: '$groupId', unreadCount: { $sum: 1 } } },
          ])
          .toArray();
  const unreadByGroup = new Map(groupIds.map((groupId) => [groupId, 0]));
  for (const row of unreadRows) {
    unreadByGroup.set(row._id, row.unreadCount);
  }

  const previewGroups = filter?.unreadOnly
    ? groups.filter((group) => (unreadByGroup.get(group.id) ?? 0) > 0)
    : groups;
  const previewIds = previewGroups.map((group) => group.id);
  const latestRows =
    previewIds.length === 0
      ? []
      : await wallCollection()
          .aggregate<{ _id: string; body: string; createdAt: Date }>([
            { $match: { groupId: { $in: previewIds } } },
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

  return previewGroups.map((group) => {
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

/** Adult memberships for one user across many groups (one query). */
export const getAdultMembershipsInGroups = async (
  groupIds: string[],
  userId: string
): Promise<Map<string, GroupMemberRecord>> => {
  const ids = [...new Set(groupIds.filter(Boolean))];
  if (ids.length === 0 || !userId) return new Map();
  const rows = await membersCollection()
    .find({ groupId: { $in: ids }, userId, memberType: 'adult' })
    .toArray();
  const map = new Map<string, GroupMemberRecord>();
  for (const row of rows) {
    map.set(row.groupId, mapMember(row));
  }
  return map;
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

export const findGroupMembersByIds = async (
  membershipIds: string[]
): Promise<GroupMemberRecord[]> => {
  const ids = [...new Set(membershipIds.filter(Boolean))];
  if (ids.length === 0) return [];
  const rows = await membersCollection()
    .find({ _id: { $in: ids } })
    .toArray();
  return rows.map(mapMember);
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
  dateOfBirth?: Date | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  medicalConditions?: string | null;
  gender?: 'male' | 'female' | 'prefer_not_to_say' | null;
  photoUrl?: string | null;
  role?: GroupRole;
}): Promise<GroupMemberRecord> => {
  const doc: MongoGroupMember = {
    _id: newEntityId(),
    groupId: input.groupId,
    userId: null,
    role: input.role ?? 'member',
    memberType: 'kid',
    displayName: input.displayName.trim(),
    invitedEmail: null,
    createdByUserId: input.createdByUserId,
    createdAt: new Date(),
    isActive: true,
    dateOfBirth: input.dateOfBirth ?? null,
    emergencyContactName: input.emergencyContactName?.trim() ?? '',
    emergencyContactPhone: input.emergencyContactPhone?.trim() ?? '',
    emergencyContactRelation: input.emergencyContactRelation?.trim() || null,
    medicalConditions: input.medicalConditions?.trim() ?? '',
    gender: input.gender ?? null,
    photoUrl: input.photoUrl?.trim() || null,
  };
  await membersCollection().insertOne(doc);
  return mapMember(doc);
};

export const updateKidGroupMember = async (
  membershipId: string,
  patch: {
    displayName?: string;
    dateOfBirth?: Date;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string | null;
    medicalConditions?: string;
    gender?: 'male' | 'female' | 'prefer_not_to_say' | null;
    photoUrl?: string | null;
  }
): Promise<GroupMemberRecord> => {
  const existing = await membersCollection().findOne({ _id: membershipId, memberType: 'kid' });
  if (!existing) {
    throw new Error('Kid membership not found.');
  }
  const $set: Partial<MongoGroupMember> = {};
  if (patch.displayName !== undefined) $set.displayName = patch.displayName.trim();
  if (patch.dateOfBirth !== undefined) $set.dateOfBirth = patch.dateOfBirth;
  if (patch.emergencyContactName !== undefined) {
    $set.emergencyContactName = patch.emergencyContactName.trim();
  }
  if (patch.emergencyContactPhone !== undefined) {
    $set.emergencyContactPhone = patch.emergencyContactPhone.trim();
  }
  if (patch.emergencyContactRelation !== undefined) {
    $set.emergencyContactRelation = patch.emergencyContactRelation?.trim() || null;
  }
  if (patch.medicalConditions !== undefined) {
    $set.medicalConditions = patch.medicalConditions.trim();
  }
  if (patch.gender !== undefined) $set.gender = patch.gender;
  if (patch.photoUrl !== undefined) $set.photoUrl = patch.photoUrl?.trim() || null;
  const result = await membersCollection().findOneAndUpdate(
    { _id: membershipId, memberType: 'kid' },
    { $set },
    { returnDocument: 'after' }
  );
  if (!result) {
    throw new Error('Kid membership not found.');
  }
  return mapMember(result);
};


export const countSocialGroups = async (): Promise<number> => groupsCollection().countDocuments();

export const listAllSocialGroupsAdmin = async (input: {
  skip: number;
  take: number;
  search?: string;
  type?: GroupType;
  status?: 'active' | 'suspended';
}) => {
  const filter: Record<string, unknown> = {};
  if (input.type) filter.type = input.type;
  if (input.status) filter.status = input.status;
  const searchRegex = normalizeSearchRegexInput(input.search);
  if (searchRegex) {
    filter.$or = [
      { name: { $regex: searchRegex, $options: 'i' } },
      { slogan: { $regex: searchRegex, $options: 'i' } },
    ];
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
