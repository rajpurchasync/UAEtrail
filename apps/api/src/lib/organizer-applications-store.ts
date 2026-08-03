import type { Collection } from 'mongodb';
import {
  MembershipRole,
  OrganizerApplicationStatus,
  TenantStatus,
  UserRole,
  type TenantType
} from '../domain/enums.js';
import { findAuthUserById, findAuthUsersByIds, updateAuthUserCore } from './auth-users.js';
import { newEntityId } from './entity-builders.js';
import { getMongoClient } from './mongo.js';
import { writeTenantToMongo, ensureUniqueTenantSlug } from './tenant-store.js';

export type OrganizerApplicationRecord = {
  id: string;
  applicantId: string;
  requestedTenantId: string | null;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantType;
  status: OrganizerApplicationStatus;
  reviewerId: string | null;
  reviewerNote: string | null;
  reviewedAt: Date | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizerApplicationWithApplicant = OrganizerApplicationRecord & {
  applicant: {
    email: string;
    profile: { displayName: string | null };
  };
};

type MongoOrganizerApplication = {
  _id: string;
  applicantId: string;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantType;
  status: OrganizerApplicationStatus;
  reviewerId: string | null;
  reviewerNote: string | null;
  requestedTenantId: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
};

const organizerApplicationsCollection = (): Collection<MongoOrganizerApplication> =>
  getMongoClient()!.db().collection<MongoOrganizerApplication>('organizer_applications');

const mapMongoApplication = (doc: MongoOrganizerApplication): OrganizerApplicationRecord => ({
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

const toMongoDoc = (row: OrganizerApplicationRecord): MongoOrganizerApplication => ({
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

const writeOrganizerApplicationToMongo = async (row: OrganizerApplicationRecord): Promise<void> => {
  await organizerApplicationsCollection().updateOne(
    { _id: row.id },
    { $set: toMongoDoc(row) },
    { upsert: true }
  );
};

const patchOrganizerApplicationInMongo = async (
  id: string,
  patch: Partial<Omit<MongoOrganizerApplication, '_id'>>
): Promise<void> => {
  await organizerApplicationsCollection().updateOne(
    { _id: id },
    { $set: { ...patch, updatedAt: new Date() } }
  );
};

const buildOrganizerApplicationRecord = (input: {
  id: string;
  applicantId: string;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantType;
  status?: OrganizerApplicationStatus;
  requestedTenantId?: string | null;
  metadata?: unknown;
  reviewerId?: string | null;
  reviewerNote?: string | null;
  reviewedAt?: Date | null;
}): OrganizerApplicationRecord => {
  const now = new Date();
  return {
    id: input.id,
    applicantId: input.applicantId,
    requestedName: input.requestedName,
    requestedSlug: input.requestedSlug,
    requestedType: input.requestedType,
    status: input.status ?? OrganizerApplicationStatus.PENDING,
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
  application: OrganizerApplicationRecord
): Promise<OrganizerApplicationWithApplicant | null> => {
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

const findOrganizerApplicationInMongo = async (id: string): Promise<OrganizerApplicationRecord | null> => {
  const doc = await organizerApplicationsCollection().findOne({ _id: id });
  return doc ? mapMongoApplication(doc) : null;
};

const findLatestOrganizerApplicationInMongo = async (
  applicantId: string
): Promise<OrganizerApplicationRecord | null> => {
  const doc = await organizerApplicationsCollection()
    .find({ applicantId })
    .sort({ createdAt: -1 })
    .limit(1)
    .next();
  return doc ? mapMongoApplication(doc) : null;
};

const findPendingOrganizerApplicationInMongo = async (
  applicantId: string
): Promise<OrganizerApplicationRecord | null> => {
  const doc = await organizerApplicationsCollection().findOne({
    applicantId,
    status: OrganizerApplicationStatus.PENDING
  });
  return doc ? mapMongoApplication(doc) : null;
};

export const createOrganizerApplicationRecord = async (input: {
  applicantId: string;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantType;
}): Promise<OrganizerApplicationRecord> => {
  const applicationId = newEntityId();
  const row = buildOrganizerApplicationRecord({ ...input, id: applicationId });
  await writeOrganizerApplicationToMongo(row);
  return row;
};

export const listOrganizerApplicationsDetailed = async (input: {
  skip: number;
  take: number;
}): Promise<OrganizerApplicationWithApplicant[]> => {
  const docs = await organizerApplicationsCollection()
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

export const countOrganizerApplications = async (): Promise<number> => {
  return organizerApplicationsCollection().countDocuments({});
};

export const findOrganizerApplicationById = async (id: string): Promise<OrganizerApplicationRecord | null> => {
  return findOrganizerApplicationInMongo(id);
};

export const findLatestOrganizerApplicationByApplicant = async (
  applicantId: string
): Promise<OrganizerApplicationRecord | null> => {
  return findLatestOrganizerApplicationInMongo(applicantId);
};

export const findLatestOrganizerApplicationWithApplicant = async (
  applicantId: string
): Promise<OrganizerApplicationWithApplicant | null> => {
  const mongoRow = await findLatestOrganizerApplicationInMongo(applicantId);
  if (!mongoRow) return null;
  return attachApplicant(mongoRow);
};

export const findPendingOrganizerApplicationByApplicant = async (
  applicantId: string
): Promise<OrganizerApplicationRecord | null> => {
  return findPendingOrganizerApplicationInMongo(applicantId);
};

export const updateOrganizerApplicationMetadata = async (
  id: string,
  metadata: unknown
): Promise<OrganizerApplicationRecord> => {
  await patchOrganizerApplicationInMongo(id, { metadata });
  const mongoRow = await findOrganizerApplicationInMongo(id);
  if (!mongoRow) {
    throw new Error('Failed to update organizer application metadata.');
  }
  return { ...mongoRow, metadata };
};

export const createOrganizerApplicationDetailed = async (input: {
  applicantId: string;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantType;
  status?: OrganizerApplicationStatus;
  requestedTenantId?: string | null;
  metadata?: unknown;
}): Promise<OrganizerApplicationRecord> => {
  const applicationId = newEntityId();
  const row = buildOrganizerApplicationRecord({
    id: applicationId,
    applicantId: input.applicantId,
    requestedName: input.requestedName,
    requestedSlug: input.requestedSlug,
    requestedType: input.requestedType,
    status: input.status,
    requestedTenantId: input.requestedTenantId,
    metadata: input.metadata
  });
  await writeOrganizerApplicationToMongo(row);
  return row;
};

export const approveOrganizerApplicationAndProvisionTenant = async (input: {
  applicationId: string;
  reviewerId: string;
  reviewerNote?: string;
}) => {
  const application = await findOrganizerApplicationInMongo(input.applicationId);
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
      ...(meta.phone ? { phone: meta.phone } : {}),
      ...(meta.profilePhoto ? { avatarUrl: meta.profilePhoto } : {})
    }
  });

  await patchOrganizerApplicationInMongo(applicationId, {
    requestedTenantId: tenantId,
    status: OrganizerApplicationStatus.APPROVED,
    reviewerId: input.reviewerId,
    reviewerNote: input.reviewerNote ?? null,
    reviewedAt
  });

  return { applicationId, tenantId };
};

export const markOrganizerApplicationApproved = async (input: {
  id: string;
  tenantId: string;
  reviewerId: string;
  reviewerNote?: string;
}): Promise<OrganizerApplicationRecord> => {
  const reviewedAt = new Date();
  await patchOrganizerApplicationInMongo(input.id, {
    requestedTenantId: input.tenantId,
    status: OrganizerApplicationStatus.APPROVED,
    reviewerId: input.reviewerId,
    reviewerNote: input.reviewerNote ?? null,
    reviewedAt
  });

  const mongoRow = await findOrganizerApplicationInMongo(input.id);
  if (!mongoRow) {
    throw new Error('Failed to approve organizer application.');
  }

  return {
    ...mongoRow,
    requestedTenantId: input.tenantId,
    status: OrganizerApplicationStatus.APPROVED,
    reviewerId: input.reviewerId,
    reviewerNote: input.reviewerNote ?? null,
    reviewedAt
  };
};

export const markOrganizerApplicationRejected = async (input: {
  id: string;
  reviewerId: string;
  reviewerNote?: string;
}): Promise<OrganizerApplicationRecord> => {
  const reviewedAt = new Date();
  await patchOrganizerApplicationInMongo(input.id, {
    status: OrganizerApplicationStatus.REJECTED,
    reviewerId: input.reviewerId,
    reviewerNote: input.reviewerNote ?? null,
    reviewedAt
  });

  const mongoRow = await findOrganizerApplicationInMongo(input.id);
  if (!mongoRow) {
    throw new Error('Failed to reject organizer application.');
  }

  return {
    ...mongoRow,
    status: OrganizerApplicationStatus.REJECTED,
    reviewerId: input.reviewerId,
    reviewerNote: input.reviewerNote ?? null,
    reviewedAt
  };
};
