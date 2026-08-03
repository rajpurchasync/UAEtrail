import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';

type MongoAuditLogDoc = {
  _id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  tenantId: string | null;
  metadata: unknown;
  createdAt: Date;
};

const auditLogsCollection = (): Collection<MongoAuditLogDoc> =>
  getMongoClient()!.db().collection<MongoAuditLogDoc>('audit_logs');

export const createAuditLog = async ({
  actorId,
  action,
  entityType,
  entityId,
  tenantId,
  metadata
}: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  tenantId?: string;
  metadata?: unknown;
}): Promise<void> => {
  await auditLogsCollection().insertOne({
    _id: randomUUID(),
    actorId,
    action,
    entityType,
    entityId,
    tenantId: tenantId ?? null,
    metadata: metadata ?? null,
    createdAt: new Date()
  });
};
