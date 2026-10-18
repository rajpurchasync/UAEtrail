import type { z } from 'zod';
import { MembershipRole, TenantType, UserRole } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { findTenantById } from '../lib/activities-store.js';
import { findAuthUserByEmail, updateAuthUserCore } from '../lib/auth-users-store.js';
import { createAuditLog } from '../lib/audit.js';
import {
  deleteTenantMembership,
  findCompanyGuideMembershipForUser,
  findTenantMembershipById,
  setTenantMembershipActiveState,
  updateTenantMembershipRole,
  upsertTenantMembership,
} from '../lib/tenant-access.js';
import {
  membershipRoleToPrisma,
  type teamCreateSchema,
  type teamPatchSchema,
} from '../routes/operator/operator-route-schemas.js';

export const addOperatorTeamMember = async (
  tenantId: string,
  actorUserId: string,
  body: z.infer<typeof teamCreateSchema>
) => {
  const role = membershipRoleToPrisma(body.role);

  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');
  }

  const user = await findAuthUserByEmail(body.email);
  if (!user) {
    throw new ApiError(
      404,
      'user_not_found',
      'This person must sign up and sign in on UAE Trail before you can add them to your team.'
    );
  }

  if (role === MembershipRole.TENANT_GUIDE && tenant.type === TenantType.COMPANY) {
    const existingCompanyGuideMembership = await findCompanyGuideMembershipForUser(
      user._id,
      tenantId
    );
    if (existingCompanyGuideMembership) {
      throw new ApiError(
        400,
        'guide_tenant_conflict',
        'Guide is already assigned to another company tenant.'
      );
    }
  }

  const membership = await upsertTenantMembership({ tenantId, userId: user._id, role });

  await createAuditLog({
    actorId: actorUserId,
    action: 'team.upsert_member',
    entityType: 'tenant_membership',
    entityId: membership.id,
    tenantId,
  });

  return {
    id: membership.id,
    userId: user._id,
    email: user.email,
    displayName: user.profile?.displayName ?? user.email,
    role: membership.role.toLowerCase(),
    isNewUser: false,
  };
};

export const patchOperatorTeamMember = async (
  tenantId: string,
  actorUserId: string,
  membershipId: string,
  body: z.infer<typeof teamPatchSchema>
) => {
  const membership = await findTenantMembershipById(tenantId, membershipId);
  if (!membership) {
    throw new ApiError(404, 'membership_not_found', 'Team member not found.');
  }

  let updated: { id: string; role: MembershipRole; isActive: boolean } | null = null;
  if (body.role) {
    const updatedRoleMembership = await updateTenantMembershipRole(
      membership.id,
      membershipRoleToPrisma(body.role)
    );
    updated = {
      id: updatedRoleMembership.id,
      role: updatedRoleMembership.role,
      isActive: (updatedRoleMembership as { isActive?: boolean }).isActive ?? true,
    };
    await updateAuthUserCore({
      userId: membership.userId,
      role: body.role === 'tenant_admin' ? UserRole.TENANT_ADMIN : UserRole.TENANT_GUIDE,
    });
  }

  if (body.isActive !== undefined) {
    updated = await setTenantMembershipActiveState(membership.id, body.isActive);
  }

  await createAuditLog({
    actorId: actorUserId,
    action: body.isActive !== undefined ? 'team.update_status' : 'team.update_role',
    entityType: 'tenant_membership',
    entityId: membership.id,
    tenantId,
  });

  return {
    id: membership.id,
    role: updated?.role?.toLowerCase() ?? membership.role.toLowerCase(),
    isActive: updated?.isActive ?? (membership as { isActive?: boolean }).isActive ?? true,
  };
};

export const removeOperatorTeamMember = async (
  tenantId: string,
  actorUserId: string,
  membershipId: string
) => {
  const membership = await findTenantMembershipById(tenantId, membershipId);
  if (!membership) {
    throw new ApiError(404, 'membership_not_found', 'Team member not found.');
  }

  if (membership.role === MembershipRole.TENANT_OWNER) {
    throw new ApiError(400, 'owner_cannot_be_removed', 'The tenant owner cannot be removed.');
  }

  const removed = await deleteTenantMembership(membership.id);
  if (!removed) {
    throw new ApiError(500, 'membership_delete_failed', 'Failed to remove team member.');
  }

  await createAuditLog({
    actorId: actorUserId,
    action: 'team.remove_member',
    entityType: 'tenant_membership',
    entityId: membership.id,
    tenantId,
  });

  return { removed: true };
};
