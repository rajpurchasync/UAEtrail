import type { Router } from 'express';
import { z } from 'zod';
import { locationSubmitBodySchema } from '../../domain/location-submit.js';
import { registerPlaceAlias } from '../../lib/route-place-alias.js';
import { validate } from '../../middleware/validate.js';
import { submitMyPlace } from '../../services/me-place-submit-commands.js';
import { listMySubmittedPlaces } from '../../services/me-place-submit-read.js';

const placeSubmitBodySchema = locationSubmitBodySchema.superRefine((body, ctx) => {
  if (body.facilityKind) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Use POST /me/facilities for amenity pins.',
      path: ['facilityKind'],
    });
  }
});

/**
 * Member **place catalog submit** (`POST /me/places`; `/me/locations` legacy alias).
 * HTTP surface: signed-in member — not `GET /me/status` / publish tier (`SYSTEM_COHERENCE` §5.1).
 * Domain: `place-submit` + `locations` place row (`SYSTEM_COHERENCE` §8.4.9).
 */
export const registerMeSubmittedPlaceRoutes = (router: Router): void => {
  registerPlaceAlias(router, 'get', '/me/places', async (req, res, next) => {
    try {
      const data = await listMySubmittedPlaces(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  registerPlaceAlias(
    router,
    'post',
    '/me/places',
    validate({ body: placeSubmitBodySchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof placeSubmitBodySchema>;
        const data = await submitMyPlace(req.auth!.userId, body);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
