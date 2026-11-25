import type { Router } from 'express';
import type { FacilityKind } from '@uaetrail/shared-types';
import { z } from 'zod';
import { locationSubmitBodySchema } from '../../domain/location-submit.js';
import { validate } from '../../middleware/validate.js';
import { submitMyFacility } from '../../services/me-facility-submit-commands.js';

const facilitySubmitBodySchema = locationSubmitBodySchema
  .extend({
    onSiteId: z.string().min(1).max(80).optional(),
    /** @deprecated inbound alias — use `onSiteId`. */
    parentPlaceId: z.string().min(1).max(80).optional(),
  })
  .superRefine((body, ctx) => {
    if (!body.facilityKind) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'facilityKind is required.',
        path: ['facilityKind'],
      });
    }
  });

/**
 * Member **facility catalog submit** (`POST /me/facilities`).
 * HTTP surface: signed-in member — not `GET /me/status` / publish tier (`SYSTEM_COHERENCE` §5.1).
 * Storage: `facilities` only (CPC-7).
 */
export const registerMeFacilityRoutes = (router: Router): void => {
  router.post(
    '/me/facilities',
    validate({ body: facilitySubmitBodySchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof facilitySubmitBodySchema>;
        const data = await submitMyFacility(req.auth!.userId, {
          ...body,
          facilityKind: body.facilityKind as FacilityKind,
          onSiteId: body.onSiteId ?? body.parentPlaceId ?? null,
        });
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
