import { findAuthUserIdsMatchingActorSearch } from '../lib/auth-users-store.js';
import { listAuditLogsPaged } from '../lib/admin-store.js';

export const listAdminAuditLogs = async (input: {
  action?: string;
  entityType?: string;
  actor?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}) => {
  const where: {
    action?: string | { contains: string };
    entityType?: string;
    actorIds?: string[];
    createdAtFrom?: Date;
    createdAtTo?: Date;
  } = {};
  if (input.action) where.action = { contains: input.action };
  if (input.entityType) where.entityType = input.entityType;
  if (input.from) where.createdAtFrom = new Date(input.from);
  if (input.to) where.createdAtTo = new Date(input.to);
  if (input.actor?.trim()) {
    const actorIds = await findAuthUserIdsMatchingActorSearch(input.actor);
    where.actorIds = actorIds.length > 0 ? actorIds : ['__none__'];
  }

  const { items: logs, total } = await listAuditLogsPaged({
    where,
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  });

  return {
    items: logs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      actorEmail: l.actor.email,
      actorName: l.actor.profile?.displayName ?? null,
      tenantId: l.tenantId,
      metadata: l.metadata,
      createdAt: l.createdAt,
    })),
    total,
  };
};
