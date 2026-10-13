import type { Router } from 'express';
import { z } from 'zod';
import { AVAILABILITY_KINDS, type AvailabilityKind } from '@uaetrail/shared-types';

const availabilityKindEnum = z.enum(
  AVAILABILITY_KINDS as unknown as [AvailabilityKind, ...AvailabilityKind[]]
);
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  getMemberAvailability,
  upsertMemberAvailability,
} from '../../lib/member-availability-store.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const slotSchema = z.object({
  startDate: isoDate,
  endDate: isoDate,
  timeBand: z.enum(['morning', 'afternoon', 'evening', 'any']).optional().nullable(),
});

const upsertSchema = z.object({
  kinds: z.array(availabilityKindEnum).default([]),
  visibility: z.enum(['public', 'buddies', 'hidden']),
  region: z.string().max(80).optional().nullable(),
  areaId: z.string().max(80).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  slots: z.array(slotSchema).default([]),
});

/** Signed-in member availability calendar (`GET` / `PUT /me/availability`). */
export const registerMeAvailabilityRoutes = (router: Router): void => {
  router.get('/me/availability', requireAuth, async (req, res, next) => {
    try {
      const data = await getMemberAvailability(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.put(
    '/me/availability',
    requireAuth,
    validate({ body: upsertSchema }),
    async (req, res, next) => {
      try {
        const data = await upsertMemberAvailability(req.auth!.userId, req.body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
