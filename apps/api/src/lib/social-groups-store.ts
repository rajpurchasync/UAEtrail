import type { SocialTeamLabelType } from '@uaetrail/shared-types';
import { newEntityId } from './entity-builders.js';
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


export {
  acceptGroupInviteByToken,
  acceptPendingGroupInvitesForEmail,
  createGroupInvite,
  createKidGroupMember,
  ensureGroupMember,
  findGroupMemberById,
  findGroupMembersByIds,
  listGroupInvites,
  listGroupMembersDetailed,
  removeGroupMember,
  removeGroupMembership,
  setGroupMembershipActiveState,
  updateGroupMemberRole,
  updateKidGroupMember,
} from './social-groups-membership-store.js';

export {
  countSocialGroups,
  deleteSocialGroup,
  getSocialGroupAdminDetail,
  listAllSocialGroupsAdmin,
} from './social-groups-admin-store.js';
