import { Router } from 'express';
import { z } from 'zod';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import {
  setAdminTenantDiscoverFeatured,
  setAdminTenantStatus,
} from '../../services/admin-tenant-commands.js';
import { listAdminTenantsPage, loadAdminTenantDetail } from '../../services/admin-tenant-read.js';

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

const discoverFeaturedSchema = z.object({
  featured: z.boolean(),
});

/** Platform admin tenant list, detail, and suspend/activate (`/admin/tenants/*`). */
export const registerAdminTenantRoutes = (adminRouter: Router): void => {
  adminRouter.get('/tenants', validate({ query: paginationSchema }), async (req, res, next) => {
    try {
      const pg = req.query as unknown as z.infer<typeof paginationSchema>;
      const { items, total } = await listAdminTenantsPage({
        page: pg.page,
        pageSize: pg.pageSize,
      });
      res.json(paginatedResponse(items, total, pg));
    } catch (error) {
      next(error);
    }
  });

  adminRouter.get('/tenants/:id', validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const data = await loadAdminTenantDetail(id);
      res.json({ data });
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
        const result = await setAdminTenantStatus({
          actorId: req.auth!.userId,
          tenantId: id,
          status,
          comment,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  adminRouter.patch(
    '/tenants/:id/discover-featured',
    validate({ params: idParamSchema, body: discoverFeaturedSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { featured } = req.body as z.infer<typeof discoverFeaturedSchema>;
        const result = await setAdminTenantDiscoverFeatured({
          actorId: req.auth!.userId,
          tenantId: id,
          featured,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );
};
