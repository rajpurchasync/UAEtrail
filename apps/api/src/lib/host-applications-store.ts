import type { Collection } from 'mongodb';
import {
  HostApplicationStatus,
  MembershipRole,
  TenantStatus,
  UserRole,
  type TenantType
} from '../domain/enums.js';
import { findAuthUserById, findAuthUsersByIds, updateAuthUserCore } from './auth-users.js';
import { COLLECTIONS } from './collections.js';
import { newEntityId } from './entity-builders.js';
import { getMongoClient } from './mongo.js';
import { writeTenantToMongo, ensureUniqueTenantSlug } from './tenant-store.js';

export type HostApplicationRecord = {
  id: string;
  applicantId: string;
  requestedTenantId: string | null;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantType;
  status: HostApplicationStatus;
  reviewerId: string | null;
  reviewerNote: string | null;
  reviewedAt: Date | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type HostApplicationWithApplicant = HostApplicationRecord & {
  applicant: {
    email: string;
    profile: { displayName: string | null };
  };
};

type MongoHostApplication = {
  _id: string;
  applicantId: string;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantType;
  status: HostApplicationStatus;
  reviewerId: string | null;
  reviewerNote: string | null;
  requestedTenantId: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
};

const hostApplicationsCollection = (): Collection<MongoHostApplication> =>
  getMongoClient()!.db().collection<MongoHostApplication>(COLLECTIONS.HOST_APPLICATIONS);

const mapMongoApplication = (doc: MongoHostApplication): HostApplicationRecord => ({
  id: doc._id,
  applicantId: doc.applicantId,
  requestedTenantId: doc.requestedTenantId,
  requestedName: doc.requestedName,
  requestedSlug: doc.requestedSlug,
  requestedType: doc.requestedType,
  status: doc.status,
  reviewerId: doc.reviewerId,
  reviewerNote: doc.reviewerNote,
  reviewedAt: doc.reviewedAt,
  metadata: doc.metadata,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const toMongoDoc = (row: HostApplicationRecord): MongoHostApplication => ({
  _id: row.id,
  applicantId: row.applicantId,
  requestedName: row.requestedName,
  requestedSlug: row.requestedSlug,
  requestedType: row.requestedType,
  status: row.status,
  reviewerId: row.reviewerId,
  reviewerNote: row.reviewerNote,
  requestedTenantId: row.requestedTenantId,
  metadata: row.metadata,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  reviewedAt: row.reviewedAt
});

const writeHostApplicationToMongo = async (row: HostApplicationRecord): Promise<void> => {
  await hostApplicationsCollection().updateOne(
    { _id: row.id },
    { $set: toMongoDoc(row) },
    { upsert: true }
  );
};

const patchHostApplicationInMongo = async (
  id: string,
  patch: Partial<Omit<MongoHostApplication, '_id'>>
): Promise<void> => {
  await hostApplicationsCollection().updateOne(
    { _id: id },
    { $set: { ...patch, updatedAt: new Date() } }
  );
};

const buildHostApplicationRecord = (input: {
  id: string;
  applicantId: string;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantType;
  status?: HostApplicationStatus;
  requestedTenantId?: string | null;
  metadata?: unknown;
  reviewerId?: string | null;
  reviewerNote?: string | null;
  reviewedAt?: Date | null;
}): HostApplicationRecord => {
  const now = new Date();
  return {
    id: input.id,
    applicantId: input.applicantId,
    requestedName: input.requestedName,
    requestedSlug: input.requestedSlug,
    requestedType: input.requestedType,
    status: input.status ?? HostApplicationStatus.PENDING,
    requestedTenantId: input.requestedTenantId ?? null,
    metadata: input.metadata ?? null,
    reviewerId: input.reviewerId ?? null,
    reviewerNote: input.reviewerNote ?? null,
    reviewedAt: input.reviewedAt ?? null,
    createdAt: now,
    updatedAt: now
  };
};

const attachApplicant = async (
  application: HostApplicationRecord
): Promise<HostApplicationWithApplicant | null> => {
  const applicant = await findAuthUserById(application.applicantId);
  if (!applicant) return null;
  return {
    ...application,
    applicant: {
      email: applicant.email,
      profile: { displayName: applicant.profile.displayName }
    }
  };
};

const findHostApplicationInMongo = async (id: string): Promise<HostApplicationRecord | null> => {
  const doc = await hostApplicationsCollection().findOne({ _id: id });
  return doc ? mapMongoApplication(doc) : null;
};

const findLatestHostApplicationInMongo = async (
  applicantId: string
): Promise<HostApplicationRecord | null> => {
  const doc = await hostApplicationsCollection()
    .find({ applicantId })
    .sort({ createdAt: -1 })
    .limit(1)
    .next();
  return doc ? mapMongoApplication(doc) : null;
};

const findPendingHostApplicationInMongo = async (
  applicantId: string
): Promise<HostApplicationRecord | null> => {
  const doc = await hostApplicationsCollection().findOne({
    applicantId,
    status: HostApplicationStatus.PENDING
  });
  return doc ? mapMongoApplication(doc) : null;
};

export const createHostApplicationRecord = async (input: {
  applicantId: string;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantType;
}): Promise<HostApplicationRecord> => {
  const applicationId = newEntityId();
  const row = buildHostApplicationRecord({ ...input, id: applicationId });
  await writeHostApplicationToMongo(row);
  return row;
};

export const listHostApplicationsDetailed = async (input: {
  skip: number;
  take: number;
}): Promise<HostApplicationWithApplicant[]> => {
  const docs = await hostApplicationsCollection()
    .find({})
    .sort({ createdAt: -1 })
    .skip(input.skip)
    .limit(input.take)
    .toArray();

  const applications = docs.map(mapMongoApplication);
  const applicants = await findAuthUsersByIds([...new Set(applications.map((item) => item.applicantId))]);
  const applicantById = new Map(applicants.map((user) => [user._id, user]));

  return applications.flatMap((application) => {
    const applicant = applicantById.get(application.applicantId);
    if (!applicant) return [];
    return [
      {
        ...application,
        applicant: {
          email: applicant.email,
          profile: { displayName: applicant.profile.displayName }
        }
      }
    ];
  });
};

export const countHostApplications = async (): Promise<number> => {
  return hostApplicationsCollection().countDocuments({});
};

export const findHostApplicationById = async (id: string): Promise<HostApplicationRecord | null> => {
  return findHostApplicationInMongo(id);
};

export const findLatestHostApplicationByApplicant = async (
  applicantId: string
): Promise<HostApplicationRecord | null> => {
  return findLatestHostApplicationInMongo(applicantId);
};

export const findLatestHostApplicationWithApplicant = async (
  applicantId: string
): Promise<HostApplicationWithApplicant | null> => {
  const mongoRow = await findLatestHostApplicationInMongo(applicantId);
  if (!mongoRow) return null;
  return attachApplicant(mongoRow);
};

export const findPendingHostApplicationByApplicant = async (
  applicantId: string
): Promise<HostApplicationRecord | null> => {
  return findPendingHostApplicationInMongo(applicantId);
};

export const updateHostApplicationMetadata = async (
  id: string,
  metadata: unknown
): Promise<HostApplicationRecord> => {
  await patchHostApplicationInMongo(id, { metadata });
  const mongoRow = await findHostApplicationInMongo(id);
  if (!mongoRow) {
    throw new Error('Failed to update host application metadata.');
  }
  return { ...mongoRow, metadata };
};

export const createHostApplicationDetailed = async (input: {
  applicantId: string;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantType;
  status?: HostApplicationStatus;
  requestedTenantId?: string | null;
  metadata?: unknown;
}): Promise<HostApplicationRecord> => {
  const applicationId = newEntityId();
  const row = buildHostApplicationRecord({
    id: applicationId,
    applicantId: input.applicantId,
    requestedName: input.requestedName,
    requestedSlug: input.requestedSlug,
    requestedType: input.requestedType,
    status: input.status,
    requestedTenantId: input.requestedTenantId,
    metadata: input.metadata
  });
  await writeHostApplicationToMongo(row);
  return row;
};

export const approveHostApplicationAndProvisionTenant = async (input: {
  applicationId: string;
  reviewerId: string;
  reviewerNote?: string;
}) => {
  const application = await findHostApplicationInMongo(input.applicationId);
  if (!application) {
    return null;
  }

  const tenantSlug = await ensureUniqueTenantSlug(application.requestedSlug);
  const tenantId = newEntityId();
  const membershipId = newEntityId();
  const reviewedAt = new Date();
  const meta = (application.metadata as Record<string, string> | null) ?? {};
  const applicationId = application.id;

  const now = new Date();
  await writeTenantToMongo({
    id: tenantId,
    name: application.requestedName,
    slug: tenantSlug,
    type: application.requestedType,
    status: TenantStatus.ACTIVE,
    ownerId: application.applicantId,
    countryCode: 'AE',
    createdAt: now,
    updatedAt: now
  });

  await getMongoClient()!
    .db()
    .collection('tenant_memberships')
    .updateOne(
      { tenantId, userId: application.applicantId },
      {
        $set: {
          tenantId,
          userId: application.applicantId,
          role: MembershipRole.TENANT_OWNER,
          tenant: { status: TenantStatus.ACTIVE }
        },
        $setOnInsert: { _id: membershipId, createdAt: now }
      },
      { upsert: true }
    );

  await updateAuthUserCore({
    userId: application.applicantId,
    role: UserRole.TENANT_OWNER,
    profile: {
      ...(meta.hostDisplayName ? { displayName: meta.hostDisplayName } : {}),
      ...(meta.bio ? { bio: meta.bio } : {}),
      ...(meta.phoneE164 || meta.phone ? { phone: meta.phoneE164 || meta.phone } : {}),
      ...(meta.profilePhoto ? { avatarUrl: meta.profilePhoto } : {})
    }
  });

  await patchHostApplicationInMongo(applicationId, {
    requestedTenantId: tenantId,
    status: HostApplicationStatus.APPROVED,
    reviewerId: input.reviewerId,
    reviewerNote: input.reviewerNote ?? null,
    reviewedAt
  });

  return { applicationId, tenantId };
};

export const markHostApplicationApproved = async (input: {
  id: string;
  tenantId: string;
  reviewerId: string;
  reviewerNote?: string;
}): Promise<HostApplicationRecord> => {
  const reviewedAt = new Date();
  await patchHostApplicationInMongo(input.id, {
    requestedTenantId: input.tenantId,
    status: HostApplicationStatus.APPROVED,
    reviewerId: input.reviewerId,
    reviewerNote: input.reviewerNote ?? null,
    reviewedAt
  });

  const mongoRow = await findHostApplicationInMongo(input.id);
  if (!mongoRow) {
    throw new Error('Failed to approve host application.');
  }

  return {
    ...mongoRow,
    requestedTenantId: input.tenantId,
    status: HostApplicationStatus.APPROVED,
    reviewerId: input.reviewerId,
    reviewerNote: input.reviewerNote ?? null,
    reviewedAt
  };
};

export const markHostApplicationRejected = async (input: {
  id: string;
  reviewerId: string;
  reviewerNote?: string;
}): Promise<HostApplicationRecord> => {
  const reviewedAt = new Date();
  await patchHostApplicationInMongo(input.id, {
    status: HostApplicationStatus.REJECTED,
    reviewerId: input.reviewerId,
    reviewerNote: input.reviewerNote ?? null,
    reviewedAt
  });

  const mongoRow = await findHostApplicationInMongo(input.id);
  if (!mongoRow) {
    throw new Error('Failed to reject host application.');
  }

  return {
    ...mongoRow,
    status: HostApplicationStatus.REJECTED,
    reviewerId: input.reviewerId,
    reviewerNote: input.reviewerNote ?? null,
    reviewedAt
  };
};
