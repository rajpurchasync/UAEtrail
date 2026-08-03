import type { Collection } from 'mongodb';
import { MembershipRole, TenantStatus, type TenantStatus as TenantStatusType } from '../domain/enums.js';
import type { TenantMembership } from '../domain/types.js';
import { findAuthUsersByIds } from './auth-users.js';
import { newEntityId } from './entity-builders.js';
import { findTenantById as findTenantRecordById, findTenantStatus } from './tenant-store.js';
import { getMongoClient } from './mongo.js';

export type TenantMembershipContext = {
  role: MembershipRole;
  tenant: {
    status: TenantStatusType;
  };
};

type MongoTenantMembership = {
  _id: string;
  tenantId: string;
  userId: string;
  role: MembershipRole;
  createdAt: Date;
  tenant: {
    status: TenantStatusType;
  };
};

const tenantMembershipsCollection = (): Collection<MongoTenantMembership> =>
  getMongoClient()!.db().collection<MongoTenantMembership>('tenant_memberships');

const toMembershipRecord = (row: MongoTenantMembership): TenantMembershipRecord => ({
  id: row._id,
  tenantId: row.tenantId,
  userId: row.userId,
  role: row.role,
  createdAt: row.createdAt,
  tenant: { status: row.tenant.status }
});

export const findTenantMembershipContext = async (
  tenantId: string,
  userId: string
): Promise<TenantMembershipContext | null> => {
  const row = await tenantMembershipsCollection().findOne({ tenantId, userId });
  if (!row) return null;
  const tenant = await findTenantRecordById(tenantId);
  if (!tenant) return null;
  return {
    role: row.role,
    tenant: { status: tenant.status }
  };
};

export const hasTenantMembership = async (tenantId: string, userId: string): Promise<boolean> => {
  const membership = await tenantMembershipsCollection().findOne(
    { tenantId, userId },
    { projection: { _id: 1 } }
  );
  return Boolean(membership);
};

export const listTenantMembershipsWithUsers = async (tenantId: string) => {
  const memberships = await tenantMembershipsCollection()
    .find({ tenantId })
    .sort({ createdAt: 1 })
    .toArray();

  const users = await findAuthUsersByIds(memberships.map((membership) => membership.userId));
  const userMap = new Map(users.map((user) => [user._id, user]));

  return memberships.map((membership) => {
    const user = userMap.get(membership.userId);
    return {
      id: membership._id,
      tenantId: membership.tenantId,
      userId: membership.userId,
      role: membership.role,
      createdAt: membership.createdAt,
      user: {
        id: membership.userId,
        email: user?.email ?? '',
        profile: user
          ? {
              displayName: user.profile.displayName,
              phone: user.profile.phone,
              avatarUrl: user.profile.avatarUrl,
              bio: user.profile.bio
            }
          : null
      }
    };
  });
};

export const findTenantById = async (tenantId: string) => findTenantRecordById(tenantId);

export const findCompanyGuideMembershipForUser = async (userId: string, tenantIdToExclude?: string) => {
  const memberships = await tenantMembershipsCollection()
    .find({ userId, role: MembershipRole.TENANT_GUIDE })
    .toArray();

  for (const membership of memberships) {
    if (tenantIdToExclude && membership.tenantId === tenantIdToExclude) continue;
    const tenant = await findTenantRecordById(membership.tenantId);
    if (tenant?.status === TenantStatus.ACTIVE) {
      return {
        id: membership._id,
        tenantId: membership.tenantId,
        userId: membership.userId,
        role: membership.role,
        createdAt: membership.createdAt
      };
    }
  }

  return null;
};

export type TenantMembershipRecord = TenantMembership & {
  tenant: { status: TenantStatusType };
};

export const upsertTenantMembership = async (input: {
  tenantId: string;
  userId: string;
  role: MembershipRole;
}): Promise<TenantMembershipRecord> => {
  const status = await findTenantStatus(input.tenantId);
  if (!status) {
    throw new Error('Failed to persist tenant membership.');
  }

  const existing = await tenantMembershipsCollection().findOne({
    tenantId: input.tenantId,
    userId: input.userId
  });

  const membershipId = existing?._id ?? newEntityId();
  const createdAt = existing?.createdAt ?? new Date();

  await tenantMembershipsCollection().updateOne(
    { tenantId: input.tenantId, userId: input.userId },
    {
      $set: {
        tenantId: input.tenantId,
        userId: input.userId,
        role: input.role,
        tenant: { status }
      },
      $setOnInsert: { _id: membershipId, createdAt }
    },
    { upsert: true }
  );

  const row = await tenantMembershipsCollection().findOne({
    tenantId: input.tenantId,
    userId: input.userId
  });
  if (!row) {
    throw new Error('Failed to persist tenant membership.');
  }

  return toMembershipRecord(row);
};

export const findTenantMembershipById = async (
  tenantId: string,
  membershipId: string
): Promise<TenantMembership | null> => {
  const row = await tenantMembershipsCollection().findOne({ _id: membershipId, tenantId });
  if (!row) return null;
  return {
    id: row._id,
    tenantId: row.tenantId,
    userId: row.userId,
    role: row.role,
    createdAt: row.createdAt
  };
};

export const findTenantMembershipByUser = async (
  tenantId: string,
  userId: string
): Promise<TenantMembership | null> => {
  const row = await tenantMembershipsCollection().findOne({ tenantId, userId });
  if (!row) return null;
  return {
    id: row._id,
    tenantId: row.tenantId,
    userId: row.userId,
    role: row.role,
    createdAt: row.createdAt
  };
};

export const listActiveTenantMembershipsByUser = async (userId: string) => {
  const memberships = await tenantMembershipsCollection().find({ userId }).sort({ createdAt: 1 }).toArray();

  const tenantEntries = await Promise.all(
    memberships.map(async (membership) => [membership.tenantId, await findTenantRecordById(membership.tenantId)] as const)
  );
  const tenantMap = new Map(tenantEntries.filter((entry): entry is [string, NonNullable<(typeof entry)[1]>] => Boolean(entry[1])));

  return memberships.flatMap((membership) => {
    const tenant = tenantMap.get(membership.tenantId);
    if (!tenant || tenant.status !== TenantStatus.ACTIVE) return [];
    return [
      {
        id: membership._id,
        tenantId: membership.tenantId,
        userId: membership.userId,
        role: membership.role,
        createdAt: membership.createdAt,
        tenant
      }
    ];
  });
};

export const updateTenantMembershipRole = async (
  membershipId: string,
  role: MembershipRole
): Promise<TenantMembershipRecord> => {
  const updated = await tenantMembershipsCollection().findOneAndUpdate(
    { _id: membershipId },
    { $set: { role } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    throw new Error('Failed to update tenant membership.');
  }

  return toMembershipRecord(updated);
};

export const syncTenantMembershipByTenantAndUser = async (
  _tenantId: string,
  _userId: string
): Promise<void> => {
  // Mongo is the source of truth; no sync needed.
};

export const deleteTenantMembershipsByUser = async (userId: string): Promise<void> => {
  await tenantMembershipsCollection().deleteMany({ userId });
};

export const syncTenantMembershipStatusForTenant = async (
  tenantId: string,
  status: TenantStatusType
): Promise<void> => {
  await tenantMembershipsCollection().updateMany(
    { tenantId },
    { $set: { 'tenant.status': status } }
  );
};
