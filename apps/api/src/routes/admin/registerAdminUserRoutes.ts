import { TenantType, UserRole, UserStatus } from '../../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../../lib/audit.js';
import { ApiError } from '../../lib/api-error.js';
import { revokeRefreshTokensByUser } from '../../lib/auth-tokens.js';
import { resolveAdminUserListFilters, resolveAdminUserType } from '../../lib/user-type.js';
import {
  listActivitiesForAdminByIds,
  listActivitiesForAdminRequests,
  listOwnerTenantTypes,
  listTenantMembershipsForUser,
  listTenantOwnerIdsByTenantType,
  listUserHostedActivitiesBasic,
  listUserOwnedTenantsBasic,
} from '../../lib/admin-store.js';
import {
  listUserActivityParticipantsBasic,
  listUserActivityRequestsBasic,
} from '../../lib/activity-engagement-store.js';
import { validate } from '../../middleware/validate.js';
import {
  countAuthUsers,
  findAuthUserById,
  listAuthUsers,
  updateAuthUserStatus,
} from '../../lib/auth-users.js';
import { PROFILE_PATH } from '../../lib/member-routes.js';
import { notifyUserAdminAction } from '../../services/admin-notifications.js';
import { listUserGroupsWithMembership } from '../../lib/social-groups-store.js';

const idParamSchema = z.object({ id: z.string().min(1) });

const suspendCommentSchema = z.object({
  comment: z.string().trim().max(500).optional(),
});

const requireSuspendComment = (
  data: { comment?: string },
  isSuspend: boolean,
  ctx: z.RefinementCtx
): void => {
  if (isSuspend && (!data.comment || data.comment.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Comment is required when suspending.',
      path: ['comment'],
    });
  }
};

const userListQuerySchema = z.object({
  role: z.string().optional(),
  userType: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const userStatusSchema = suspendCommentSchema
  .extend({
    status: z.enum(['active', 'suspended']),
  })
  .superRefine((data, ctx) => requireSuspendComment(data, data.status === 'suspended', ctx));

/** Platform admin user list, detail, and suspend/activate (`/admin/users/*`). */
export const registerAdminUserRoutes = (adminRouter: Router): void => {
  adminRouter.get('/users', validate({ query: userListQuerySchema }), async (req, res, next) => {
    try {
      const { role, userType, status, search, page, pageSize } = req.query as unknown as z.infer<
        typeof userListQuerySchema
      >;

      const listFilters = userType ? resolveAdminUserListFilters(userType) : {};
      const authRoleFilter = role ? (role.toUpperCase() as UserRole) : listFilters.role;
      const authStatusFilter = status ? (status.toUpperCase() as UserStatus) : undefined;

      let ownerIdsFilter: string[] | undefined;
      if (listFilters.tenantOwnerType) {
        ownerIdsFilter = await listTenantOwnerIdsByTenantType(listFilters.tenantOwnerType);
      }

      const listInput = {
        role: authRoleFilter as UserRole | UserRole[] | undefined,
        status: authStatusFilter as 'ACTIVE' | 'SUSPENDED' | undefined,
        search,
        userIds: ownerIdsFilter,
        skip: (page - 1) * pageSize,
        take: pageSize,
      };

      const [users, total] = await Promise.all([
        listAuthUsers(listInput),
        countAuthUsers({
          role: listInput.role,
          status: listInput.status,
          search: listInput.search,
          userIds: listInput.userIds,
        }),
      ]);

      const ownedTenantMap = new Map<string, { type: TenantType }[]>();
      const tenantOwnerIds = users.filter((u) => u.role === 'TENANT_OWNER').map((u) => u._id);
      if (tenantOwnerIds.length > 0) {
        const owners = await listOwnerTenantTypes(tenantOwnerIds);
        owners.forEach((tenant) => {
          const existing = ownedTenantMap.get(tenant.ownerId) ?? [];
          existing.push({ type: tenant.type });
          ownedTenantMap.set(tenant.ownerId, existing);
        });
      }

      res.json({
        data: users.map((u) => ({
          id: u._id,
          email: u.email,
          role: u.role.toLowerCase(),
          userType: resolveAdminUserType({ role: u.role, ownedTenants: ownedTenantMap.get(u._id) }),
          status: u.status.toLowerCase(),
          authProvider: u.authProvider.toLowerCase(),
          displayName: u.profile.displayName ?? null,
          avatarUrl: u.profile.avatarUrl ?? null,
          createdAt: u.createdAt,
          lastActiveAt: u.lastActiveAt,
        })),
        total,
        page,
        pageSize,
      });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.get('/users/:id', validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;

      const user = await findAuthUserById(id);

      if (!user) {
        throw new ApiError(404, 'user_not_found', 'User not found.');
      }

      const [ownedTenants, memberships, requests, participants, groups, hostedActivities] = await Promise.all([
        listUserOwnedTenantsBasic(id),
        listTenantMembershipsForUser(id),
        listUserActivityRequestsBasic(id, 20),
        listUserActivityParticipantsBasic(id, 20),
        listUserGroupsWithMembership(id),
        listUserHostedActivitiesBasic(id, 20),
      ]);

      const requestEventIds = [...new Set(requests.map((request) => request.activityId))];
      const participantEventIds = [...new Set(participants.map((participant) => participant.activityId))];

      const [requestEvents, participantEvents] = await Promise.all([
        requestEventIds.length > 0 ? listActivitiesForAdminRequests(requestEventIds) : Promise.resolve([]),
        participantEventIds.length > 0 ? listActivitiesForAdminByIds(participantEventIds) : Promise.resolve([]),
      ]);
      const requestEventMap = new Map(requestEvents.map((event) => [event.id, event]));
      const participantEventMap = new Map(participantEvents.map((event) => [event.id, event]));

      res.json({
        data: {
          id: user._id,
          email: user.email,
          role: user.role.toLowerCase(),
          userType: resolveAdminUserType({
            ...user,
            ownedTenants,
          }),
          status: user.status.toLowerCase(),
          authProvider: user.authProvider.toLowerCase(),
          googleLinked: Boolean(user.googleId),
          createdAt: user.createdAt,
          lastActiveAt: user.lastActiveAt,
          emailVerifiedAt: user.emailVerifiedAt,
          profile: user.profile
            ? {
                displayName: user.profile.displayName,
                phone: user.profile.phone,
                bio: user.profile.bio,
                avatarUrl: user.profile.avatarUrl,
              }
            : null,
          memberships: memberships.map((m: (typeof memberships)[number]) => ({
            tenantId: m.tenantId,
            tenantName: m.tenant.name,
            tenantSlug: m.tenant.slug,
            role: m.role.toLowerCase(),
            joinedAt: m.createdAt,
          })),
          ownedTenants: ownedTenants.map((tenant) => ({
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            type: tenant.type.toLowerCase(),
            status: tenant.status.toLowerCase(),
          })),
          groups: groups.map((group) => ({
            id: group.id,
            name: group.name,
            type: group.type,
            role: group.role,
            status: group.status,
            isCreator: group.role === 'admin',
            joinedAt: group.joinedAt,
          })),
          hostedActivities,
          requests: requests.reduce<
            Array<{
              id: string;
              activityId: string;
              activityTitle: string | null;
              locationName: string;
              status: string;
              createdAt: Date;
            }>
          >((acc, r) => {
            const event = requestEventMap.get(r.activityId);
            if (!event) return acc;
            acc.push({
              id: r.id,
              activityId: r.activityId,
              activityTitle: event.title,
              locationName: event.location.name,
              status: r.status.toLowerCase(),
              createdAt: r.createdAt,
            });
            return acc;
          }, []),
          joinedActivities: participants.reduce<
            Array<{
              activityId: string;
              activityTitle: string | null;
              locationName: string;
              tenantName: string;
              date: string;
              checkedInAt: Date | null;
            }>
          >((acc, p) => {
            const event = participantEventMap.get(p.activityId);
            if (!event) return acc;
            acc.push({
              activityId: p.activityId,
              activityTitle: event.title,
              locationName: event.location.name,
              tenantName: event.tenant.name,
              date: event.startAt.toISOString().slice(0, 10),
              checkedInAt: p.checkedInAt,
            });
            return acc;
          }, []),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.patch(
    '/users/:id/status',
    validate({ params: idParamSchema, body: userStatusSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { status, comment } = req.body as z.infer<typeof userStatusSchema>;

        const user = await findAuthUserById(id);
        if (!user) throw new ApiError(404, 'user_not_found', 'User not found.');
        if (user.role === UserRole.PLATFORM_ADMIN) {
          throw new ApiError(400, 'cannot_modify_admin', 'Cannot modify admin status.');
        }

        const prismaStatus = status === 'active' ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
        await updateAuthUserStatus(id, prismaStatus);
        if (status === 'suspended') {
          await revokeRefreshTokensByUser(id);
        }

        await createAuditLog({
          actorId: req.auth!.userId,
          action: `user.${status === 'active' ? 'activate' : 'suspend'}`,
          entityType: 'user',
          entityId: id,
          metadata: comment ? { comment } : undefined,
        });

        await notifyUserAdminAction({
          userId: id,
          title: status === 'active' ? 'Account reactivated' : 'Account suspended',
          body:
            status === 'active'
              ? 'Your account access has been restored.'
              : comment
                ? `Your account has been suspended. Reason: ${comment}`
                : 'Your account has been suspended by an administrator. Contact support if you believe this is a mistake.',
          reason: comment,
          meta: {
            kind: status === 'active' ? 'user_reactivated' : 'user_suspended',
            path: PROFILE_PATH,
          },
        });

        res.json({ message: `User ${status === 'active' ? 'activated' : 'suspended'}.` });
      } catch (error) {
        next(error);
      }
    }
  );
};
