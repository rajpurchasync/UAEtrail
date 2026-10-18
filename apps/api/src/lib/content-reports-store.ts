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

type MongoContentReport = {
  _id: string;
  reporterUserId: string;
  targetType: ContentReportTargetType;
  targetId: string;
  reason: ContentReportReason;
  details: string | null;
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
}): Promise<{ items: AdminContentReportRow[]; total: number }> => {
  const [docs, total] = await Promise.all([
    reportsCollection().find({}).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    reportsCollection().countDocuments(),
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
