import { TenantStatus } from '../../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../../lib/audit.js';
import { ApiError } from '../../lib/api-error.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import {
  findAdminTenantById,
  findAdminTenantDetailedById,
  listAdminTenantsPaged,
  updateAdminTenantStatus,
} from '../../lib/admin-store.js';
import { validate } from '../../middleware/validate.js';
import { HOST_OVERVIEW_PATH, PRO_MEMBERSHIP_PATH } from '../../lib/member-routes.js';
import { notifyUserAdminAction } from '../../services/admin-notifications.js';

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

const tenantStatusSchema = suspendCommentSchema
  .extend({
    status: z.enum(['active', 'suspended']),
  })
  .superRefine((data, ctx) => requireSuspendComment(data, data.status === 'suspended', ctx));

/** Platform admin tenant list, detail, and suspend/activate (`/admin/tenants/*`). */
export const registerAdminTenantRoutes = (adminRouter: Router): void => {
  adminRouter.get('/tenants', async (req, res, next) => {
    try {
      const pg = paginationSchema.parse(req.query);
      const { items: tenants, total } = await listAdminTenantsPaged({
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize,
      });

      res.json(
        paginatedResponse(
          tenants.map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            type: t.type.toLowerCase(),
            status: t.status.toLowerCase(),
            ownerName: t.owner.profile?.displayName ?? t.owner.email,
            ownerEmail: t.owner.email,
            memberCount: t._count.memberships,
            activityCount: t._count.activities,
            createdAt: t.createdAt,
          })),
          total,
          pg
        )
      );
    } catch (error) {
      next(error);
    }
  });

  adminRouter.get('/tenants/:id', validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;

      const tenant = await findAdminTenantDetailedById(id);

      if (!tenant) throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');

      res.json({
        data: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          type: tenant.type.toLowerCase(),
          status: tenant.status.toLowerCase(),
          owner: {
            id: tenant.owner.id,
            email: tenant.owner.email,
            displayName: tenant.owner.profile?.displayName ?? null,
          },
          createdAt: tenant.createdAt,
          members: tenant.memberships.map((m) => ({
            userId: m.userId,
            email: m.user.email,
            displayName: m.user.profile?.displayName ?? null,
            role: m.role.toLowerCase(),
            joinedAt: m.createdAt,
          })),
          activities: tenant.activities.map((e) => ({
            id: e.id,
            title: e.title,
            locationName: e.location.name,
            startAt: e.startAt,
            status: e.status.toLowerCase(),
            capacity: e.capacity,
            participantCount: e.participants.length,
            checkedInCount: e.participants.filter((p) => p.checkedInAt !== null).length,
            guideName: e.guide?.profile?.displayName ?? null,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.patch(
    '/tenants/:id/status',
    validate({ params: idParamSchema, body: tenantStatusSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { status, comment } = req.body as z.infer<typeof tenantStatusSchema>;

        const tenant = await findAdminTenantById(id);
        if (!tenant) throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');

        const prismaStatus = status === 'active' ? TenantStatus.ACTIVE : TenantStatus.SUSPENDED;
        await updateAdminTenantStatus(id, prismaStatus);

        await createAuditLog({
          actorId: req.auth!.userId,
          action: `tenant.${status === 'active' ? 'activate' : 'suspend'}`,
          entityType: 'tenant',
          entityId: id,
          metadata: comment ? { comment } : undefined,
        });

        await notifyUserAdminAction({
          userId: tenant.ownerId,
          title: status === 'active' ? 'Host account reopened' : 'Host account suspended',
          body:
            status === 'active'
              ? `Your host profile "${tenant.name}" is active again. You can create and manage events.`
              : comment
                ? `Your host profile "${tenant.name}" has been suspended. Reason: ${comment}`
                : `Your host profile "${tenant.name}" has been suspended. Contact support for details.`,
          reason: comment,
          meta: {
            kind: status === 'active' ? 'host_reopened' : 'host_suspended',
            tenantId: id,
            path: status === 'active' ? HOST_OVERVIEW_PATH : PRO_MEMBERSHIP_PATH,
          },
        });

        res.json({ message: `Tenant ${status === 'active' ? 'activated' : 'suspended'}.` });
      } catch (error) {
        next(error);
      }
    }
  );
};
