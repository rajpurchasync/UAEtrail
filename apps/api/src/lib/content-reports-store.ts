import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';
import { COLLECTIONS } from './collections.js';
import { newEntityId } from './entity-builders.js';
import { findAuthUsersByIds } from './auth-users-store.js';

export const CONTENT_REPORT_REASONS = ['spam', 'harassment', 'other'] as const;
export type ContentReportReason = (typeof CONTENT_REPORT_REASONS)[number];

/** `post` / `reply` retained for historical community-feed reports only (feature removed). */
export const CONTENT_REPORT_TARGET_TYPES = ['user', 'message', 'post', 'review', 'reply'] as const;
export type ContentReportTargetType = (typeof CONTENT_REPORT_TARGET_TYPES)[number];

export const CONTENT_REPORT_STATUSES = ['open', 'resolved', 'dismissed'] as const;
export type ContentReportStatus = (typeof CONTENT_REPORT_STATUSES)[number];

type MongoContentReport = {
  _id: string;
  reporterUserId: string;
  targetType: ContentReportTargetType;
  targetId: string;
  reason: ContentReportReason;
  details: string | null;
  status?: ContentReportStatus;
  resolutionNote?: string | null;
  resolvedAt?: Date | null;
  resolvedByUserId?: string | null;
  createdAt: Date;
};

const reportsCollection = (): Collection<MongoContentReport> =>
  getMongoClient()!.db().collection<MongoContentReport>(COLLECTIONS.CONTENT_REPORTS);

export const createContentReport = async (input: {
  reporterUserId: string;
  targetType: ContentReportTargetType;
  targetId: string;
  reason: ContentReportReason;
  details?: string | null;
}): Promise<{ id: string }> => {
  const id = newEntityId();
  await reportsCollection().insertOne({
    _id: id,
    reporterUserId: input.reporterUserId,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    details: input.details?.trim() || null,
    createdAt: new Date(),
  });
  return { id };
};

export type AdminContentReportRow = {
  id: string;
  targetType: ContentReportTargetType;
  targetId: string;
  reason: ContentReportReason;
  details: string | null;
  status: ContentReportStatus;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  reporter: {
    id: string;
    email: string;
    displayName: string | null;
  };
};

export const listContentReportsAdmin = async (input: {
  skip: number;
  take: number;
  reason?: ContentReportReason;
  targetType?: ContentReportTargetType;
  status?: ContentReportStatus;
  reporterUserIds?: string[];
  createdAtFrom?: Date;
  createdAtTo?: Date;
}): Promise<{ items: AdminContentReportRow[]; total: number }> => {
  const query: Record<string, unknown> = {};
  if (input.reason) query.reason = input.reason;
  if (input.targetType) query.targetType = input.targetType;
  if (input.status === 'open') {
    query.$or = [{ status: 'open' }, { status: { $exists: false } }, { status: null }];
  } else if (input.status) {
    query.status = input.status;
  }
  if (input.reporterUserIds) query.reporterUserId = { $in: input.reporterUserIds };
  if (input.createdAtFrom || input.createdAtTo) {
    const createdAt: Record<string, Date> = {};
    if (input.createdAtFrom) createdAt.$gte = input.createdAtFrom;
    if (input.createdAtTo) createdAt.$lte = input.createdAtTo;
    query.createdAt = createdAt;
  }

  const [docs, total] = await Promise.all([
    reportsCollection().find(query).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    reportsCollection().countDocuments(query),
  ]);

  const reporterIds = [...new Set(docs.map((doc) => doc.reporterUserId))];
  const reporters = await findAuthUsersByIds(reporterIds);
  const reporterMap = new Map(reporters.map((user) => [user._id, user]));

  const items: AdminContentReportRow[] = docs.map((doc) => {
    const reporter = reporterMap.get(doc.reporterUserId);
    return {
      id: doc._id,
      targetType: doc.targetType,
      targetId: doc.targetId,
      reason: doc.reason,
      details: doc.details,
      status: doc.status ?? 'open',
      resolutionNote: doc.resolutionNote ?? null,
      resolvedAt: doc.resolvedAt ? doc.resolvedAt.toISOString() : null,
      createdAt: doc.createdAt.toISOString(),
      reporter: {
        id: doc.reporterUserId,
        email: reporter?.email ?? 'unknown',
        displayName: reporter?.profile.displayName ?? null,
      },
    };
  });

  return { items, total };
};

export const updateContentReportStatus = async (input: {
  id: string;
  status: Exclude<ContentReportStatus, 'open'>;
  note?: string | null;
  actorUserId: string;
}): Promise<AdminContentReportRow | null> => {
  const resolvedAt = new Date();
  const result = await reportsCollection().findOneAndUpdate(
    { _id: input.id },
    {
      $set: {
        status: input.status,
        resolutionNote: input.note?.trim() || null,
        resolvedAt,
        resolvedByUserId: input.actorUserId,
      },
    },
    { returnDocument: 'after' }
  );
  const doc = result;
  if (!doc) return null;
  const reporters = await findAuthUsersByIds([doc.reporterUserId]);
  const reporter = reporters[0];
  return {
    id: doc._id,
    targetType: doc.targetType,
    targetId: doc.targetId,
    reason: doc.reason,
    details: doc.details,
    status: doc.status ?? input.status,
    resolutionNote: doc.resolutionNote ?? null,
    resolvedAt: doc.resolvedAt ? doc.resolvedAt.toISOString() : resolvedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    reporter: {
      id: doc.reporterUserId,
      email: reporter?.email ?? 'unknown',
      displayName: reporter?.profile.displayName ?? null,
    },
  };
};
