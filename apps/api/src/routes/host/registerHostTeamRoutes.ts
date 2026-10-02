import type { Router } from 'express';
import { z } from 'zod';
import { MembershipRole, TenantType, UserRole } from '../../domain/enums.js';
import { createAuditLog } from '../../lib/audit.js';
import { ApiError } from '../../lib/api-error.js';
import { findTenantById } from '../../lib/activities-store.js';
import { findAuthUserByEmail, updateAuthUserCore } from '../../lib/auth-users.js';
import { ORG_TEAM_MANAGE_ROLES } from '../../lib/org-permissions.js';
import {
  deleteTenantMembership,
  findCompanyGuideMembershipForUser,
  findTenantMembershipById,
  listTenantMembershipsWithUsers,
  setTenantMembershipActiveState,
  updateTenantMembershipRole,
  upsertTenantMembership,
} from '../../lib/tenant-access.js';
import { requireOrgRole } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import {
  membershipIdSchema,
  membershipRoleToPrisma,
  teamCreateSchema,
  teamPatchSchema,
} from './host-route-schemas.js';

export const registerHostTeamRoutes = (hostRouter: Router): void => {
  hostRouter.get('/team', async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const members = await listTenantMembershipsWithUsers(tenantId);

      res.json({
        data: members.map((member) => ({
          id: member.id,
          userId: member.userId,
          email: member.user.email,
          displayName: member.user.profile?.displayName ?? member.user.email,
          role: member.role.toLowerCase(),
          createdAt: member.createdAt,
          isActive: member.isActive ?? true,
        })),
      });
    } catch (error) {
      next(error);
    }
  });

  hostRouter.post(
    '/team',
    requireOrgRole(ORG_TEAM_MANAGE_ROLES),
    validate({ body: teamCreateSchema }),
    async (req, res, next) => {
      try {
        const tenantId = req.tenantContext!.tenantId;
        const body = req.body as z.infer<typeof teamCreateSchema>;
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
          actorId: req.auth!.userId,
          action: 'team.upsert_member',
          entityType: 'tenant_membership',
          entityId: membership.id,
          tenantId,
        });

        res.status(201).json({
          data: {
            id: membership.id,
            userId: user._id,
            email: user.email,
            displayName: user.profile?.displayName ?? user.email,
            role: membership.role.toLowerCase(),
            isNewUser: false,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  hostRouter.patch(
    '/team/:membershipId',
    requireOrgRole(ORG_TEAM_MANAGE_ROLES),
    validate({ params: membershipIdSchema, body: teamPatchSchema }),
    async (req, res, next) => {
      try {
        const { membershipId } = req.params as z.infer<typeof membershipIdSchema>;
        const { role, isActive } = req.body as z.infer<typeof teamPatchSchema>;
        const tenantId = req.tenantContext!.tenantId;

        const membership = await findTenantMembershipById(tenantId, membershipId);
        if (!membership) {
          throw new ApiError(404, 'membership_not_found', 'Team member not found.');
        }

        let updated: { id: string; role: MembershipRole; isActive: boolean } | null = null;
        if (role) {
          const updatedRoleMembership = await updateTenantMembershipRole(
            membership.id,
            membershipRoleToPrisma(role)
          );
          updated = {
            id: updatedRoleMembership.id,
            role: updatedRoleMembership.role,
            isActive: (updatedRoleMembership as { isActive?: boolean }).isActive ?? true,
          };
          await updateAuthUserCore({
            userId: membership.userId,
            role: role === 'tenant_admin' ? UserRole.TENANT_ADMIN : UserRole.TENANT_GUIDE,
          });
        }

        if (isActive !== undefined) {
          updated = await setTenantMembershipActiveState(membership.id, isActive);
        }

        await createAuditLog({
          actorId: req.auth!.userId,
          action: isActive !== undefined ? 'team.update_status' : 'team.update_role',
          entityType: 'tenant_membership',
          entityId: membership.id,
          tenantId,
        });

        res.json({
          data: {
            id: membership.id,
            role: updated?.role?.toLowerCase() ?? membership.role.toLowerCase(),
            isActive: updated?.isActive ?? (membership as { isActive?: boolean }).isActive ?? true,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  hostRouter.delete(
    '/team/:membershipId',
    requireOrgRole(ORG_TEAM_MANAGE_ROLES),
    validate({ params: membershipIdSchema }),
    async (req, res, next) => {
      try {
        const { membershipId } = req.params as z.infer<typeof membershipIdSchema>;
        const tenantId = req.tenantContext!.tenantId;

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
          actorId: req.auth!.userId,
          action: 'team.remove_member',
          entityType: 'tenant_membership',
          entityId: membership.id,
          tenantId,
        });

        res.json({ data: { removed: true } });
      } catch (error) {
        next(error);
      }
    }
  );
};
