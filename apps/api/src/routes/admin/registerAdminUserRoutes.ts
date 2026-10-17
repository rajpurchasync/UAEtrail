import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { setAdminUserStatus } from '../../services/admin-user-commands.js';
import { listAdminUsersPage, loadAdminUserDetail } from '../../services/admin-user-read.js';

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
      const result = await listAdminUsersPage({ role, userType, status, search, page, pageSize });
      res.json({
        data: result.items,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.get('/users/:id', validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const data = await loadAdminUserDetail(id);
      res.json({ data });
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
        const result = await setAdminUserStatus({
          actorId: req.auth!.userId,
          userId: id,
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
