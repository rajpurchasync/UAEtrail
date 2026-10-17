import type { Router } from 'express';
import { z } from 'zod';
import { registerActivityRoute } from '../../lib/activity-routes.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { withdrawReasonSchema } from '../../lib/withdraw-reasons.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { validate } from '../../middleware/validate.js';
import {
  cancelPublicActivityJoinRequest,
  submitPublicActivityJoinRequest,
  submitPublicActivityRsvp,
  updatePublicActivityJoinRequestNote,
} from '../../services/activity-participation-commands.js';
import {
  listFeaturedActivitiesPublic,
  listPublishedActivitiesPublic,
  loadPublicActivityDetail,
} from '../../services/activity-public-read.js';
import { createRequestSchema, eventIdParamSchema, requestIdParamSchema, rsvpSchema } from './schemas.js';

const updateRequestNoteSchema = z.object({
  note: z.string().max(500),
});

/** Public activity browse, detail, join request, and RSVP. */
export const registerPublicActivityRoutes = (router: Router): void => {
  registerActivityRoute(router, 'get', '/featured', async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 6, 20);
      const data = await listFeaturedActivitiesPublic(limit);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  registerActivityRoute(router, 'get', '', async (req, res, next) => {
    try {
      const pg = paginationSchema.parse(req.query);
      const whenRaw = typeof req.query.when === 'string' ? req.query.when : 'upcoming';
      const when = whenRaw === 'past' || whenRaw === 'all' ? whenRaw : 'upcoming';
      const { items, total } = await listPublishedActivitiesPublic({
        page: pg.page,
        pageSize: pg.pageSize,
        when,
      });

      res.json(paginatedResponse(items, total, pg));
    } catch (error) {
      next(error);
    }
  });

  registerActivityRoute(
    router,
    'get',
    '/:id',
    optionalAuth,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const payload = await loadPublicActivityDetail({
          activityId: id,
          viewerUserId: req.auth?.userId ?? null,
          isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
        });
        res.json(payload);
      } catch (error) {
        next(error);
      }
    }
  );

  registerActivityRoute(
    router,
    'post',
    '/:id/requests',
    requireAuth,
    requireVerifiedEmail,
    validate({ params: eventIdParamSchema, body: createRequestSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const { note } = req.body as z.infer<typeof createRequestSchema>;
        const data = await submitPublicActivityJoinRequest({
          activityId: id,
          userId: req.auth!.userId,
          isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
          note,
        });
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerActivityRoute(
    router,
    'post',
    '/:id/rsvp',
    requireAuth,
    requireVerifiedEmail,
    validate({ params: eventIdParamSchema, body: rsvpSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const data = await submitPublicActivityRsvp({
          activityId: id,
          userId: req.auth!.userId,
          isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
        });
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerActivityRoute(
    router,
    'patch',
    '/:id/requests/:requestId/cancel',
    requireAuth,
    requireVerifiedEmail,
    validate({ params: requestIdParamSchema, body: withdrawReasonSchema }),
    async (req, res, next) => {
      try {
        const { requestId } = req.params as z.infer<typeof requestIdParamSchema>;
        const { reason, message } = req.body as z.infer<typeof withdrawReasonSchema>;
        await cancelPublicActivityJoinRequest({
          requestId,
          userId: req.auth!.userId,
          reason,
          message,
        });
        res.json({ message: 'Request cancelled successfully.' });
      } catch (error) {
        next(error);
      }
    }
  );

  registerActivityRoute(
    router,
    'patch',
    '/:id/requests/:requestId',
    requireAuth,
    requireVerifiedEmail,
    validate({ params: requestIdParamSchema, body: updateRequestNoteSchema }),
    async (req, res, next) => {
      try {
        const { requestId } = req.params as z.infer<typeof requestIdParamSchema>;
        const { note } = req.body as z.infer<typeof updateRequestNoteSchema>;
        const data = await updatePublicActivityJoinRequestNote({
          requestId,
          userId: req.auth!.userId,
          note,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
