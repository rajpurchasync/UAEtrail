import { randomUUID } from 'node:crypto';
import type { Collection } from 'mongodb';
import { NotificationType } from '../domain/enums.js';
import { getMongoClient } from './mongo.js';
import { COLLECTIONS } from './collections.js';

export type NotificationOutboxInput = {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  meta?: Record<string, unknown>;
};

export const SideEffectOutboxKind = {
  NOTIFICATION: 'NOTIFICATION',
  EXPLORE_MAP_CACHE_INVALIDATE: 'EXPLORE_MAP_CACHE_INVALIDATE'
} as const;
export type SideEffectOutboxKind =
  (typeof SideEffectOutboxKind)[keyof typeof SideEffectOutboxKind];

export const SideEffectOutboxStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  DONE: 'DONE',
  FAILED: 'FAILED'
} as const;
export type SideEffectOutboxStatus =
  (typeof SideEffectOutboxStatus)[keyof typeof SideEffectOutboxStatus];

type MongoSideEffectOutbox = {
  _id: string;
  kind: SideEffectOutboxKind;
  payload: NotificationOutboxInput | null;
  logContext: string;
  status: SideEffectOutboxStatus;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  processedAt: Date | null;
  lockedAt: Date | null;
};

const outboxCollection = (): Collection<MongoSideEffectOutbox> =>
  getMongoClient()!.db().collection<MongoSideEffectOutbox>(COLLECTIONS.SIDE_EFFECT_OUTBOX);

const MAX_ATTEMPTS = 5;

export const enqueueNotificationOutbox = async (
  input: NotificationOutboxInput,
  logContext: string
): Promise<string> => {
  const id = randomUUID();
  const doc: MongoSideEffectOutbox = {
    _id: id,
    kind: SideEffectOutboxKind.NOTIFICATION,
    payload: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      meta: input.meta
    },
    logContext,
    status: SideEffectOutboxStatus.PENDING,
    attempts: 0,
    lastError: null,
    createdAt: new Date(),
    processedAt: null,
    lockedAt: null
  };
  await outboxCollection().insertOne(doc);
  return id;
};

export const enqueueExploreMapCacheInvalidateOutbox = async (logContext: string): Promise<string> => {
  const id = randomUUID();
  const doc: MongoSideEffectOutbox = {
    _id: id,
    kind: SideEffectOutboxKind.EXPLORE_MAP_CACHE_INVALIDATE,
    payload: null,
    logContext,
    status: SideEffectOutboxStatus.PENDING,
    attempts: 0,
    lastError: null,
    createdAt: new Date(),
    processedAt: null,
    lockedAt: null
  };
  await outboxCollection().insertOne(doc);
  return id;
};

export type ClaimedOutboxEntry = {
  kind: SideEffectOutboxKind;
  payload: NotificationOutboxInput | null;
  logContext: string;
};

export const claimOutboxEntry = async (id: string): Promise<ClaimedOutboxEntry | null> => {
  const result = await outboxCollection().findOneAndUpdate(
    {
      _id: id,
      status: { $in: [SideEffectOutboxStatus.PENDING, SideEffectOutboxStatus.FAILED] },
      attempts: { $lt: MAX_ATTEMPTS }
    },
    {
      $set: { status: SideEffectOutboxStatus.PROCESSING, lockedAt: new Date() },
      $inc: { attempts: 1 }
    },
    { returnDocument: 'after' }
  );
  if (!result) {
    return null;
  }
  return {
    kind: result.kind,
    payload: result.payload,
    logContext: result.logContext
  };
};

export const drainableOutboxIds = async (limit: number): Promise<string[]> => {
  const rows = await outboxCollection()
    .find({
      status: { $in: [SideEffectOutboxStatus.PENDING, SideEffectOutboxStatus.FAILED] },
      attempts: { $lt: MAX_ATTEMPTS }
    })
    .sort({ createdAt: 1 })
    .limit(limit)
    .project({ _id: 1 })
    .toArray();
  return rows.map((row) => row._id);
};

export const releaseStaleProcessingOutboxEntries = async (maxAgeMs: number): Promise<number> => {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const result = await outboxCollection().updateMany(
    {
      status: SideEffectOutboxStatus.PROCESSING,
      lockedAt: { $lte: cutoff }
    },
    {
      $set: { status: SideEffectOutboxStatus.PENDING, lockedAt: null }
    }
  );
  return result.modifiedCount;
};

export const markOutboxDone = async (id: string): Promise<void> => {
  await outboxCollection().updateOne(
    { _id: id },
    {
      $set: {
        status: SideEffectOutboxStatus.DONE,
        processedAt: new Date(),
        lastError: null,
        lockedAt: null
      }
    }
  );
};

export const markOutboxFailed = async (id: string, message: string): Promise<void> => {
  const entry = await outboxCollection().findOne({ _id: id });
  const attempts = entry?.attempts ?? MAX_ATTEMPTS;
  const nextStatus =
    attempts >= MAX_ATTEMPTS
      ? SideEffectOutboxStatus.FAILED
      : SideEffectOutboxStatus.PENDING;

  await outboxCollection().updateOne(
    { _id: id },
    {
      $set: {
        status: nextStatus,
        lastError: message.slice(0, 2000),
        processedAt: nextStatus === SideEffectOutboxStatus.FAILED ? new Date() : null,
        lockedAt: null
      }
    }
  );
};

/** @deprecated Use claimOutboxEntry */
export const claimNotificationOutboxEntry = async (
  id: string
): Promise<NotificationOutboxInput | null> => {
  const entry = await claimOutboxEntry(id);
  if (!entry || entry.kind !== SideEffectOutboxKind.NOTIFICATION) {
    return null;
  }
  return entry.payload;
};
