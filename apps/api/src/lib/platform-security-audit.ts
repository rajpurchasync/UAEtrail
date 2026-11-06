import { createAuditLog } from './audit.js';

export const auditMemberRoleSwitch = async (input: {
  actorId: string;
  previousRole: string;
  nextRole: string;
  target: 'participant' | 'original';
  switchedFromRole: string | null;
}): Promise<void> => {
  const action =
    input.target === 'participant' ? 'member.impersonation_start' : 'member.impersonation_end';
  await createAuditLog({
    actorId: input.actorId,
    action,
    entityType: 'user',
    entityId: input.actorId,
    metadata: {
      target: input.target,
      previousRole: input.previousRole,
      nextRole: input.nextRole,
      switchedFromRole: input.switchedFromRole,
    },
  });
};

export const auditPlatformAdminTenantScope = async (input: {
  actorId: string;
  tenantId: string;
  method: string;
  path: string;
}): Promise<void> => {
  await createAuditLog({
    actorId: input.actorId,
    action: 'platform_admin.tenant_scope',
    entityType: 'tenant',
    entityId: input.tenantId,
    tenantId: input.tenantId,
    metadata: {
      method: input.method,
      path: input.path,
    },
  });
};
