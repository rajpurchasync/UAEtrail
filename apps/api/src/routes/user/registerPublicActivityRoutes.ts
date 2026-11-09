import type { Router } from 'express';
import { z } from 'zod';
import { registerActivityRoute } from '../../lib/activity-routes.js';
import { ApiError } from '../../lib/api-error.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { withdrawReasonSchema } from '../../lib/withdraw-reasons.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  cancelPublicActivityJoinRequest,
  submitPublicActivityJoinRequest,
  submitPublicActivityRsvp,
  updatePublicActivityJoinRequestNote,
  updatePublicActivityJoinRequestParty,
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

const updateRequestPartySchema = z
  .object({
    note: z.string().max(500).optional(),
    adults: z.coerce.number().int().min(1).max(20).optional(),
    kids: z.coerce.number().int().min(0).max(20).optional(),
  })
  .refine((body) => body.note !== undefined || body.adults !== undefined || body.kids !== undefined, {
    message: 'At least one field is required.',
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
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const payload = await loadPublicActivityDetail({
          activityId: id,
          viewerUserId: null,
          isPlatformAdmin: false,
        });
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
        res.json(payload);
      } catch (error) {
        next(error);
      }
    }
  );

  registerActivityRoute(
    router,
    'get',
    '/:id/me/state',
    requireAuth,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const payload = await loadPublicActivityDetail({
          activityId: id,
          viewerUserId: req.auth!.userId,
          isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
        });
        res.setHeader('Cache-Control', 'private, no-store');
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
        const { note, packingCheckedIds, packingSignature, adults, kids } = req.body as z.infer<
          typeof createRequestSchema
        >;
        const data = await submitPublicActivityJoinRequest({
          activityId: id,
          userId: req.auth!.userId,
          isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
          note,
          packingCheckedIds,
          packingSignature,
          adults,
          kids,
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
        const { note, packingCheckedIds, packingSignature, adults, kids } = req.body as z.infer<typeof rsvpSchema>;
        const data = await submitPublicActivityRsvp({
          activityId: id,
          userId: req.auth!.userId,
          isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
          note,
          packingCheckedIds,
          packingSignature,
          adults,
          kids,
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
    validate({
      params: requestIdParamSchema,
      body: z.union([updateRequestNoteSchema, updateRequestPartySchema]),
    }),
    async (req, res, next) => {
      try {
        const { requestId } = req.params as z.infer<typeof requestIdParamSchema>;
        const body = req.body as z.infer<typeof updateRequestNoteSchema> &
          z.infer<typeof updateRequestPartySchema>;
        if (body.adults !== undefined || body.kids !== undefined) {
          const data = await updatePublicActivityJoinRequestParty({
            requestId,
            userId: req.auth!.userId,
            note: body.note,
            adults: body.adults,
            kids: body.kids,
          });
          res.json({ data });
          return;
        }
        const { note } = body;
        if (note === undefined) {
          throw new ApiError(400, 'invalid_body', 'Note is required.');
        }
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
