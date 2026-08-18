import type { Collection } from 'mongodb';
import { newEntityId } from './entity-builders.js';
import { findAuthUsersByIds } from './auth-users.js';
import { getMongoClient } from './mongo.js';

export type GroupType = 'family' | 'friends';
export type GroupRole = 'admin' | 'buddy';
export type GroupMemberType = 'adult' | 'kid';
export type GroupInviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export type GroupRecord = {
  id: string;
  type: GroupType;
  name: string;
  slogan: string | null;
  bannerUrl: string | null;
  photoUrl: string | null;
  adminUserId: string;
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

export type GroupWallMessageRecord = {
  id: string;
  groupId: string;
  authorUserId: string;
  body: string;
  createdAt: Date;
};

type MongoGroup = {
  _id: string;
  type: GroupType;
  name: string;
  slogan: string | null;
  bannerUrl: string | null;
  photoUrl: string | null;
  adminUserId: string;
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

const mapGroup = (row: MongoGroup): GroupRecord => ({
  id: row._id,
  type: row.type,
  name: row.name,
  slogan: row.slogan,
  bannerUrl: row.bannerUrl,
  photoUrl: row.photoUrl,
  adminUserId: row.adminUserId,
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
  createdAt: row.createdAt
});

const normalizeInviteEmail = (email: string) => email.trim().toLowerCase();

export const findGroupById = async (groupId: string): Promise<GroupRecord | null> => {
  const row = await groupsCollection().findOne({ _id: groupId });
  return row ? mapGroup(row) : null;
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

export const listGroupsForUser = async (userId: string): Promise<GroupRecord[]> => {
  const memberships = await membersCollection()
    .find({ userId, memberType: 'adult' })
    .sort({ createdAt: -1 })
    .toArray();

  if (memberships.length === 0) return [];

  const uniqueGroupIds = [...new Set(memberships.map((m) => m.groupId))];
  const groups = await groupsCollection().find({ _id: { $in: uniqueGroupIds } }).toArray();
  const byId = new Map(groups.map((g) => [g._id, g]));

  return uniqueGroupIds
    .map((id) => byId.get(id))
    .filter((row): row is MongoGroup => Boolean(row))
    .map(mapGroup);
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

export const findInviteByToken = async (token: string): Promise<GroupInviteRecord | null> => {
  const row = await invitesCollection().findOne({ token });
  return row ? mapInvite(row) : null;
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

export const listGroupWallMessages = async (groupId: string, limit = 100) => {
  const rows = await wallCollection().find({ groupId }).sort({ createdAt: -1 }).limit(limit).toArray();
  const messages = rows.map(mapWall).reverse();
  const users = await findAuthUsersByIds(messages.map((m) => m.authorUserId));
  const userMap = new Map(users.map((u) => [u._id, u]));

  return messages.map((message) => {
    const user = userMap.get(message.authorUserId);
    return {
      ...message,
      author: {
        id: message.authorUserId,
        displayName: user?.profile.displayName ?? user?.email.split('@')[0] ?? 'Member',
        avatarUrl: user?.profile.avatarUrl ?? null
      }
    };
  });
};

export const createGroupWallMessage = async (input: {
  groupId: string;
  authorUserId: string;
  body: string;
}): Promise<GroupWallMessageRecord> => {
  const doc: MongoGroupWallMessage = {
    _id: newEntityId(),
    groupId: input.groupId,
    authorUserId: input.authorUserId,
    body: input.body.trim(),
    createdAt: new Date()
  };
  await wallCollection().insertOne(doc);
  return mapWall(doc);
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
  if (input.search?.trim()) {
    filter.name = { $regex: input.search.trim(), $options: 'i' };
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
    groupsCollection().deleteOne({ _id: groupId })
  ]);

  return { deleted: true };
};
