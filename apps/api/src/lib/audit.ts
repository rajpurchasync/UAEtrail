import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

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
  metadata?: Prisma.InputJsonValue;
}): Promise<void> => {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      tenantId,
      metadata
    }
  });
};
