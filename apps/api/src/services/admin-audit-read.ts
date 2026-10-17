import { listAuditLogsPaged } from '../lib/admin-store.js';

export const listAdminAuditLogs = async (input: {
  action?: string;
  entityType?: string;
  page: number;
  pageSize: number;
}) => {
  const where: { action?: string | { contains: string }; entityType?: string } = {};
  if (input.action) where.action = { contains: input.action };
  if (input.entityType) where.entityType = input.entityType;

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
