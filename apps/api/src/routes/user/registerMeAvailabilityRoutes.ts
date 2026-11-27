import type { Router } from 'express';
import { z } from 'zod';
import {
  AVAILABILITY_KINDS,
  AVAILABILITY_PRICING_KINDS,
  AVAILABILITY_SLOT_CAPACITIES,
  AVAILABILITY_TOUR_SHAPES,
  MAX_AVAILABILITY_DESTINATION_REGIONS,
  type AvailabilityKind,
} from '@uaetrail/shared-types';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { upsertMyMemberAvailability } from '../../services/me-availability-commands.js';
import {
  loadMyMemberAvailability,
  loadMyMemberAvailabilityMatchPreview,
} from '../../services/me-availability-read.js';

const availabilityKindEnum = z.enum(
  AVAILABILITY_KINDS as unknown as [AvailabilityKind, ...AvailabilityKind[]]
);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const engagementTermsSchema = z
  .object({
    pricingKind: z.enum(
      AVAILABILITY_PRICING_KINDS as unknown as [
        (typeof AVAILABILITY_PRICING_KINDS)[number],
        ...(typeof AVAILABILITY_PRICING_KINDS)[number][],
      ]
    ),
    rate: z.number().min(0).optional().nullable(),
    tourShape: z
      .enum(
        AVAILABILITY_TOUR_SHAPES as unknown as [
          (typeof AVAILABILITY_TOUR_SHAPES)[number],
          ...(typeof AVAILABILITY_TOUR_SHAPES)[number][],
        ]
      )
      .optional()
      .nullable(),
    minParticipants: z.number().int().min(1).optional().nullable(),
    maxParticipants: z.number().int().min(1).optional().nullable(),
  })
  .optional()
  .nullable();

const slotSchema = z.object({
  slotId: z.string().max(80).optional().nullable(),
  scheduleKind: z.enum(['open', 'fixed']).optional().nullable(),
  startDate: isoDate,
  endDate: isoDate,
  timeBand: z.enum(['morning', 'afternoon', 'evening', 'any']).optional().nullable(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  locationId: z.string().max(80).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  locationPrecision: z.enum(['general', 'specific']).optional().nullable(),
  capacity: z.enum(AVAILABILITY_SLOT_CAPACITIES as unknown as ['participant', 'guide']).optional().nullable(),
  /** Validated in `validateMemberAvailabilityWrite` (guide is forbidden as modality). */
  modalities: z.array(z.string().max(32)).max(8).optional().nullable(),
  engagementTerms: engagementTermsSchema,
  destinationRegions: z.array(z.string().max(80)).max(MAX_AVAILABILITY_DESTINATION_REGIONS).optional().nullable(),
  partySize: z.number().int().min(1).max(99).optional().nullable(),
  transportMode: z.string().max(32).optional().nullable(),
  vehicleType: z.string().max(32).optional().nullable(),
  carpoolSeatsNeeded: z.number().int().min(1).max(20).optional().nullable(),
  destinationLatitude: z.number().min(-90).max(90).optional().nullable(),
  destinationLongitude: z.number().min(-180).max(180).optional().nullable(),
  destinationPrecision: z.enum(['general', 'specific']).optional().nullable(),
});

const upsertSchema = z.object({
  /** @deprecated ignored on write — server derives from slots (MIG-SG-B1). */
  kinds: z.array(availabilityKindEnum).optional(),
  visibility: z.enum(['public', 'friends', 'hidden']),
  region: z.string().max(80).optional().nullable(),
  destinationId: z.string().max(80).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  slots: z.array(slotSchema).default([]),
});

/** Signed-in member availability calendar (`GET` / `PUT /me/availability`). */
export const registerMeAvailabilityRoutes = (router: Router): void => {
  router.get('/me/availability', requireAuth, async (req, res, next) => {
    try {
      const data = await loadMyMemberAvailability(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get('/me/availability/match-preview', requireAuth, async (req, res, next) => {
    try {
      const data = await loadMyMemberAvailabilityMatchPreview(req.auth!.userId);
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
        const data = await upsertMyMemberAvailability(req.auth!.userId, req.body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
