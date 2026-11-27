import type { Collection } from 'mongodb';
import type { MemberGroupInboundType, MemberGroupKind, SocialTeamLabelType } from '@uaetrail/shared-types';
import { resolveMemberGroupShape } from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { findAuthUsersByIds } from './auth-users-store.js';
import { getMongoClient } from './mongo.js';
import { isKidProfileComplete } from '../domain/family-kid-profile.js';
import type { GroupWallReactionKind } from '../domain/group-wall-reactions.js';
import type {
  GroupInviteRecord,
  GroupInviteStatus,
  GroupMemberRecord,
  GroupMemberType,
  GroupRecord,
  GroupRole,
  GroupStatus,
  GroupWallMessageRecord,
  GroupWallPostPolicy,
} from './social-groups-store-types.js';

export type MongoGroup = {
  _id: string;
  kind?: MemberGroupKind;
  teamLabel?: SocialTeamLabelType | null;
  type: MemberGroupInboundType;
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

export type MongoGroupMember = {
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
  dateOfBirth?: Date | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  medicalConditions?: string | null;
  gender?: 'male' | 'female' | 'prefer_not_to_say' | null;
  photoUrl?: string | null;
};

export type MongoGroupInvite = {
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

export type MongoGroupWallMessage = {
  _id: string;
  groupId: string;
  authorUserId: string;
  body: string;
  replyToMessageId?: string | null;
  createdAt: Date;
};

export type MongoGroupWallReaction = {
  _id: string;
  groupId: string;
  messageId: string;
  userId: string;
  kind: GroupWallReactionKind;
  createdAt: Date;
};

export const groupsCollection = (): Collection<MongoGroup> =>
  getMongoClient()!.db().collection<MongoGroup>(COLLECTIONS.MEMBER_GROUPS);

export const membersCollection = (): Collection<MongoGroupMember> =>
  getMongoClient()!.db().collection<MongoGroupMember>(COLLECTIONS.MEMBER_GROUP_MEMBERS);

export const invitesCollection = (): Collection<MongoGroupInvite> =>
  getMongoClient()!.db().collection<MongoGroupInvite>(COLLECTIONS.MEMBER_GROUP_INVITES);

export const wallCollection = (): Collection<MongoGroupWallMessage> =>
  getMongoClient()!.db().collection<MongoGroupWallMessage>(COLLECTIONS.MEMBER_GROUP_WALL);

export const wallReactionsCollection = (): Collection<MongoGroupWallReaction> =>
  getMongoClient()!.db().collection<MongoGroupWallReaction>(COLLECTIONS.MEMBER_GROUP_WALL_REACTIONS);

export const mapGroup = (row: MongoGroup): GroupRecord => {
  const shape = resolveMemberGroupShape({
    kind: row.kind ?? null,
    teamLabel: row.teamLabel ?? null,
    type: row.type,
  });
  return {
    id: row._id,
    kind: shape.kind,
    teamLabel: shape.teamLabel,
    type: shape.inboundType,
    name: row.name,
    slogan: row.slogan,
    bannerUrl: row.bannerUrl,
    photoUrl: row.photoUrl,
    adminUserId: row.adminUserId,
    activityId: row.activityId ?? null,
    status: row.status ?? 'active',
    wallPostPolicy: row.wallPostPolicy ?? 'all_members',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export const mapMember = (row: MongoGroupMember): GroupMemberRecord => {
  const base: GroupMemberRecord = {
    id: row._id,
    groupId: row.groupId,
    userId: row.userId,
    role: row.role,
    memberType: row.memberType,
    displayName: row.displayName,
    invitedEmail: row.invitedEmail,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt,
    isActive: row.isActive ?? true,
    dateOfBirth: row.dateOfBirth ?? null,
    emergencyContactName: row.emergencyContactName ?? null,
    emergencyContactPhone: row.emergencyContactPhone ?? null,
    emergencyContactRelation: row.emergencyContactRelation ?? null,
    medicalConditions: row.medicalConditions ?? null,
    gender: row.gender ?? null,
    photoUrl: row.photoUrl ?? null,
  };
  if (row.memberType === 'kid') {
    base.profileComplete = isKidProfileComplete(base);
  }
  return base;
};

export const mapInvite = (row: MongoGroupInvite): GroupInviteRecord => ({
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
  updatedAt: row.updatedAt,
});

export const mapWall = (row: MongoGroupWallMessage): GroupWallMessageRecord => ({
  id: row._id,
  groupId: row.groupId,
  authorUserId: row.authorUserId,
  body: row.body,
  replyToMessageId: row.replyToMessageId ?? null,
  createdAt: row.createdAt,
});

export const normalizeInviteEmail = (email: string) => email.trim().toLowerCase();

export const displayNameForUser = (
  user: Awaited<ReturnType<typeof findAuthUsersByIds>>[number] | undefined
) => user?.profile.displayName ?? user?.email.split('@')[0] ?? 'Member';