import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { listAdminContentReports } from '../../services/admin-content-reports-read.js';
import { resolveAdminContentReport } from '../../services/admin-content-reports-commands.js';

const contentReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  reason: z.enum(['spam', 'harassment', 'other']).optional(),
  targetType: z.enum(['user', 'message', 'post', 'review', 'reply']).optional(),
  status: z.enum(['open', 'resolved', 'dismissed']).optional(),
  reporter: z.string().trim().max(120).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const resolveBodySchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  note: z.string().trim().max(500).optional(),
});

/** Platform admin content reports (`GET/PATCH /admin/reports`). */
export const registerAdminContentReportRoutes = (adminRouter: Router): void => {
  adminRouter.get('/reports', validate({ query: contentReportsQuerySchema }), async (req, res, next) => {
    try {
      const { page, pageSize, reason, targetType, status, reporter, from, to } = req.query as unknown as z.infer<
        typeof contentReportsQuerySchema
      >;
      const { items, total } = await listAdminContentReports({
        page,
        pageSize,
        reason,
        targetType,
        status,
        reporter,
        from,
        to,
      });
      res.json({
        data: items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.patch(
    '/reports/:id',
    validate({
      params: z.object({ id: z.string().min(1) }),
      body: resolveBodySchema,
    }),
    async (req, res, next) => {
      try {
        const { id } = req.params as { id: string };
        const body = req.body as z.infer<typeof resolveBodySchema>;
        const data = await resolveAdminContentReport({
          id,
          status: body.status,
          note: body.note,
          actorUserId: req.auth!.userId,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
