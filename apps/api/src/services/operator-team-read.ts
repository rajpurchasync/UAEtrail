import { listTenantMembershipsWithUsers } from '../lib/tenant-access.js';

export const listOperatorTeamMembers = async (tenantId: string) => {
  const members = await listTenantMembershipsWithUsers(tenantId);
  return members.map((member) => ({
    id: member.id,
    userId: member.userId,
    email: member.user.email,
    displayName: member.user.profile?.displayName ?? member.user.email,
    role: member.role.toLowerCase(),
    createdAt: member.createdAt,
    isActive: member.isActive ?? true,
  }));
};
