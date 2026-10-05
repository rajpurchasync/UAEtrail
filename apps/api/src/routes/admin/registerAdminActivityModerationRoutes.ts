import { ActivityStatus } from '../../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { mountActivityRoutes } from '../../lib/activity-routes.js';
import { createAuditLog } from '../../lib/audit.js';
import { ApiError } from '../../lib/api-error.js';
import { buildActivityDto } from '../../lib/mappers.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import {
  findAdminEventById,
  findAdminActivityDetailedById,
  listAdminModerationEventsPaged,
  toggleAdminEventFeatured,
  updateAdminActivityStatus,
} from '../../lib/admin-store.js';
import {
  listActivityParticipantsWithUsers,
  listActivityRequestsForActivity,
} from '../../lib/activity-engagement-store.js';
import { findAuthUsersByIds } from '../../lib/auth-users.js';
import { HOST_ACTIVITIES_PATH } from '../../lib/member-routes.js';
import { notifyUserAdminAction } from '../../services/admin-notifications.js';

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
      const { items: events, total } = await listAdminModerationEventsPaged({
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize,
      });
      res.json(
        paginatedResponse(
          events.map((event) => buildActivityDto(event)),
          total,
          pg
        )
      );
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
        const event = await findAdminEventById(id);
        if (!event) {
          throw new ApiError(404, 'activity_not_found', 'Activity not found.');
        }

        const [participants, requests] = await Promise.all([
          listActivityParticipantsWithUsers(id),
          listActivityRequestsForActivity(id),
        ]);

        const requestUserIds = [...new Set(requests.map((r) => r.userId))];
        const requestUsers =
          requestUserIds.length > 0 ? await findAuthUsersByIds(requestUserIds) : [];
        const requestUserMap = new Map(requestUsers.map((u) => [u._id, u]));

        res.json({
          data: {
            participants: participants.map((p) => ({
              id: p.id,
              userId: p.userId,
              checkedInAt: p.checkedInAt?.toISOString() ?? null,
              createdAt: p.createdAt.toISOString(),
              displayName: p.user.profile?.displayName ?? null,
              email: p.user.email,
            })),
            joinRequests: requests.map((r) => {
              const user = requestUserMap.get(r.userId);
              return {
                id: r.id,
                userId: r.userId,
                status: r.status.toLowerCase(),
                note: r.note ?? null,
                createdAt: r.createdAt.toISOString(),
                displayName: user?.profile.displayName ?? null,
                email: user?.email ?? '',
              };
            }),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  adminActivitiesRouter.get('/:id', validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const event = await findAdminActivityDetailedById(id);
      if (!event) {
        throw new ApiError(404, 'activity_not_found', 'Activity not found.');
      }
      res.json({ data: buildActivityDto(event) });
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
        const event = await findAdminEventById(id);
        if (!event) {
          throw new ApiError(404, 'activity_not_found', 'Activity not found.');
        }

        const status = action === 'suspend' ? ActivityStatus.SUSPENDED : ActivityStatus.PUBLISHED;
        await updateAdminActivityStatus(event.id, status);

        await createAuditLog({
          actorId: req.auth!.userId,
          action: `event.${action}`,
          entityType: 'activity',
          entityId: event.id,
          tenantId: event.tenantId,
          metadata: comment ? { comment } : undefined,
        });

        if (action === 'suspend' && event.createdById) {
          await notifyUserAdminAction({
            userId: event.createdById,
            title: 'Activity suspended',
            body: comment
              ? `Your activity "${event.title}" has been suspended. Reason: ${comment}`
              : `Your activity "${event.title}" has been suspended by an administrator.`,
            reason: comment,
            meta: { kind: 'activity_suspended', activityId: event.id, path: HOST_ACTIVITIES_PATH },
          });
        }

        res.json({ message: `Activity ${action}ed successfully.` });
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
        const event = await findAdminEventById(id);
        if (!event) {
          throw new ApiError(404, 'activity_not_found', 'Activity not found.');
        }

        const updated = await toggleAdminEventFeatured(event.id, !event.featured);

        await createAuditLog({
          actorId: req.auth!.userId,
          action: updated.featured ? 'activity.feature' : 'activity.unfeature',
          entityType: 'activity',
          entityId: event.id,
          tenantId: event.tenantId,
        });

        res.json({
          message: `Activity ${updated.featured ? 'featured' : 'unfeatured'} successfully.`,
          featured: updated.featured,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  mountActivityRoutes(adminRouter, adminActivitiesRouter);
};
