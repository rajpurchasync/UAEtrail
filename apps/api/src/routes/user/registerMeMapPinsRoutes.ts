import type { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createManualMemberMapPin,
  deleteMemberMapPin,
  updateMemberMapPin,
} from '../../lib/member-map-pins-store.js';
import { MEMBER_MAP_PIN_ACTIVITY_TYPES } from '@uaetrail/shared-types';
import { buildMemberJourneyMap } from '../../services/member-journey-map.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const activityTypeSchema = z.enum(MEMBER_MAP_PIN_ACTIVITY_TYPES);

const createPinSchema = z.object({
  kind: z.enum(['wishlist', 'visited']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  title: z.string().max(200).optional(),
  placeDate: isoDate.optional(),
  notes: z.string().max(2000).nullable().optional(),
  activityType: activityTypeSchema.optional(),
});

const updatePinSchema = z.object({
  title: z.string().max(200).optional(),
  placeDate: isoDate.optional(),
  notes: z.string().max(2000).nullable().optional(),
  kind: z.enum(['wishlist', 'visited']).optional(),
  activityType: activityTypeSchema.nullable().optional(),
});

const idParamSchema = z.object({ id: z.string().min(1) });

export const registerMeMapPinsRoutes = (router: Router): void => {
  router.get('/me/journey-map', requireAuth, async (req, res, next) => {
    try {
      const data = await buildMemberJourneyMap(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post('/me/map-pins', requireAuth, validate({ body: createPinSchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof createPinSchema>;
      const pin = await createManualMemberMapPin(req.auth!.userId, body);
      res.status(201).json({ data: pin });
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    '/me/map-pins/:id',
    requireAuth,
    validate({ params: idParamSchema, body: updatePinSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const pin = await updateMemberMapPin(req.auth!.userId, id, req.body);
        res.json({ data: pin });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete('/me/map-pins/:id', requireAuth, validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      await deleteMemberMapPin(req.auth!.userId, id);
      res.json({ data: null });
    } catch (error) {
      next(error);
    }
  });
};
