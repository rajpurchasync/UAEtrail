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
import {
  adminSetRideshareDestinationPlace,
  adminSetRideshareParentLink,
} from '../../services/admin-activity-rideshare-link-commands.js';

const idParamSchema = z.object({ id: z.string().min(1) });

const rideshareParentLinkSchema = z.object({
  parentActivityId: z.string().min(1).nullable(),
});

const ridesharePlaceLinkSchema = z.object({
  placeId: z.string().min(1).nullable(),
});

const parentLinkedRideshareSchema = z.object({
  rideshareActivityId: z.string().min(1).nullable(),
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

const eventModerationSchema = z
  .object({
    action: z.enum(['suspend', 'unsuspend']),
    comment: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => requireSuspendComment(data, data.action === 'suspend', ctx));

/** Platform admin activity moderation under `/admin/activities/*`. */
export const registerAdminActivityModerationRoutes = (adminRouter: Router): void => {
  const adminActivitiesRouter = Router();

  adminActivitiesRouter.get('/moderation', validate({ query: paginationSchema }), async (req, res, next) => {
    try {
      const pg = req.query as unknown as z.infer<typeof paginationSchema>;
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

  adminActivitiesRouter.patch(
    '/:id/rideshare-parent',
    validate({ params: idParamSchema, body: rideshareParentLinkSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { parentActivityId } = req.body as z.infer<typeof rideshareParentLinkSchema>;
        const result = await adminSetRideshareParentLink({
          actorId: req.auth!.userId,
          rideshareActivityId: id,
          parentActivityId,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /** Parent outing → set/clear primary linked rideshare. */
  adminActivitiesRouter.patch(
    '/:id/linked-rideshare',
    validate({ params: idParamSchema, body: parentLinkedRideshareSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { rideshareActivityId } = req.body as z.infer<typeof parentLinkedRideshareSchema>;
        if (!rideshareActivityId) {
          const parent = await loadAdminActivityModerationDetail(id);
          const current = parent.linkedRideshareActivityId ?? null;
          if (!current) {
            res.json({ message: 'No linked ride to clear.', data: parent });
            return;
          }
          const result = await adminSetRideshareParentLink({
            actorId: req.auth!.userId,
            rideshareActivityId: current,
            parentActivityId: null,
          });
          res.json(result);
          return;
        }
        const result = await adminSetRideshareParentLink({
          actorId: req.auth!.userId,
          rideshareActivityId,
          parentActivityId: id,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  adminActivitiesRouter.patch(
    '/:id/rideshare-place',
    validate({ params: idParamSchema, body: ridesharePlaceLinkSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { placeId } = req.body as z.infer<typeof ridesharePlaceLinkSchema>;
        const result = await adminSetRideshareDestinationPlace({
          actorId: req.auth!.userId,
          rideshareActivityId: id,
          placeId,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  mountActivityRoutes(adminRouter, adminActivitiesRouter);
};
