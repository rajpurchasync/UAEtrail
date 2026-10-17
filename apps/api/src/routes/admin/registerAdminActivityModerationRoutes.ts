import { Router } from 'express';
import { z } from 'zod';
import { mountActivityRoutes } from '../../lib/activity-routes.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import {
  moderateAdminActivity,
  toggleAdminActivityFeatured,
} from '../../services/admin-activity-moderation-commands.js';
import {
  listAdminActivityModerationPage,
  loadAdminActivityEngagement,
  loadAdminActivityModerationDetail,
} from '../../services/admin-activity-moderation-read.js';

const idParamSchema = z.object({ id: z.string().min(1) });

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

const eventModerationSchema = z
  .object({
    action: z.enum(['suspend', 'unsuspend']),
    comment: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => requireSuspendComment(data, data.action === 'suspend', ctx));

/** Platform admin activity moderation under `/admin/activities/*`. */
export const registerAdminActivityModerationRoutes = (adminRouter: Router): void => {
  const adminActivitiesRouter = Router();

  adminActivitiesRouter.get('/moderation', async (req, res, next) => {
    try {
      const pg = paginationSchema.parse(req.query);
      const { items, total } = await listAdminActivityModerationPage({
        page: pg.page,
        pageSize: pg.pageSize,
      });
      res.json(paginatedResponse(items, total, pg));
    } catch (error) {
      next(error);
    }
  });

  adminActivitiesRouter.get(
    '/:id/engagement',
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const data = await loadAdminActivityEngagement(id);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  adminActivitiesRouter.get('/:id', validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const data = await loadAdminActivityModerationDetail(id);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  adminActivitiesRouter.patch(
    '/moderation/:id',
    validate({ params: idParamSchema, body: eventModerationSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { action, comment } = req.body as z.infer<typeof eventModerationSchema>;
        const result = await moderateAdminActivity({
          actorId: req.auth!.userId,
          activityId: id,
          action,
          comment,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  adminActivitiesRouter.patch(
    '/:id/featured',
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const result = await toggleAdminActivityFeatured({
          actorId: req.auth!.userId,
          activityId: id,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  mountActivityRoutes(adminRouter, adminActivitiesRouter);
};
