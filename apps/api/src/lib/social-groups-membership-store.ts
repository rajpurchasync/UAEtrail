import { findAuthUsersByIds } from './auth-users-store.js';
import { newEntityId } from './entity-builders.js';
import {
  groupsCollection,
  invitesCollection,
  mapGroup,
  mapInvite,
  mapMember,
  membersCollection,
  normalizeInviteEmail,
  type MongoGroupInvite,
  type MongoGroupMember,
} from './social-groups-store-internals.js';
import type { GroupInviteRecord, GroupMemberRecord, GroupRole } from './social-groups-store-types.js';

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
  const groupRow = await groupsCollection().findOne({ _id: input.groupId });
  const group = groupRow ? mapGroup(groupRow) : null;
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


