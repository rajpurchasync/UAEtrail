import { Router } from 'express';
import { z } from 'zod';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import { setAdminSocialGroupStatus } from '../../services/admin-group-commands.js';
import { listAdminSocialGroupsPage, loadAdminSocialGroupDetail } from '../../services/admin-group-read.js';

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

const groupStatusSchema = suspendCommentSchema
  .extend({
    status: z.enum(['active', 'suspended']),
  })
  .superRefine((data, ctx) => requireSuspendComment(data, data.status === 'suspended', ctx));

const groupListQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  type: z.enum(['family', 'friends']).optional(),
});

/** Platform admin social group list, detail, and suspend/activate (`/admin/groups/*`). */
export const registerAdminGroupRoutes = (adminRouter: Router): void => {
  adminRouter.get('/groups', validate({ query: groupListQuerySchema }), async (req, res, next) => {
    try {
      const query = req.query as unknown as z.infer<typeof groupListQuerySchema>;
      const pg = paginationSchema.parse({ page: query.page, pageSize: query.pageSize });
      const { items, total } = await listAdminSocialGroupsPage({
        page: pg.page,
        pageSize: pg.pageSize,
        search: query.search,
        type: query.type,
      });
      res.json(paginatedResponse(items, total, pg));
    } catch (error) {
      next(error);
    }
  });

  adminRouter.get('/groups/:id', validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const data = await loadAdminSocialGroupDetail(id);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.patch(
    '/groups/:id/status',
    validate({ params: idParamSchema, body: groupStatusSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { status, comment } = req.body as z.infer<typeof groupStatusSchema>;
        const result = await setAdminSocialGroupStatus({
          actorId: req.auth!.userId,
          groupId: id,
          status,
          comment,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );
};
