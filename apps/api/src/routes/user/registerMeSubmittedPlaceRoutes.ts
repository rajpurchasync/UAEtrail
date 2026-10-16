import type { Router } from 'express';
import { z } from 'zod';
import { locationSubmitBodySchema } from '../../domain/location-submit.js';
import { createLocationRecord, listSubmittedLocationsByUser } from '../../lib/activities-store.js';
import { createAuditLog } from '../../lib/audit.js';
import { toLocationDto } from '../../lib/mappers.js';
import { registerPlaceAlias } from '../../lib/route-place-alias.js';
import { scheduleSideEffect } from '../../lib/schedule-side-effect.js';
import { validate } from '../../middleware/validate.js';
import { buildPlaceSubmitPayload } from '../../services/place-submit.js';
import { notifyAdminsCatalogSubmitted } from '../../services/catalog-submit-notifications.js';
import { findAuthUserById } from '../../lib/auth-users.js';
import { RewardAction } from '../../domain/enums.js';
import { fromPrismaActivityType } from '../../domain/activity-type.js';
import { awardPoints } from '../../services/rewards.js';
import { findPublishedAreaById } from '../../lib/areas-store.js';
import { ApiError } from '../../lib/api-error.js';

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
      const locations = await listSubmittedLocationsByUser(req.auth!.userId);
      res.json({ data: locations.map((l) => toLocationDto(l)) });
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
        const area = await findPublishedAreaById(body.areaId.trim());
        if (!area) {
          throw new ApiError(400, 'area_not_found', 'Choose a published area.');
        }

        const created = await createLocationRecord(buildPlaceSubmitPayload(body, req.auth!.userId));

        await createAuditLog({
          actorId: req.auth!.userId,
          action: 'place.submit',
          entityType: 'place',
          entityId: created.id,
        });
        await createAuditLog({
          actorId: req.auth!.userId,
          action: 'location.submit',
          entityType: 'location',
          entityId: created.id,
        });

        scheduleSideEffect(
          awardPoints({
            userId: req.auth!.userId,
            action: RewardAction.LOCATION_SUBMITTED,
            referenceId: created.id,
            label: `Submitted place: ${created.name}`,
          }),
          'member.place_submitted_rewards'
        );

        const submitter = await findAuthUserById(req.auth!.userId);
        const submitterLabel =
          submitter?.profile?.displayName?.trim() || submitter?.email || 'A member';
        notifyAdminsCatalogSubmitted({
          kind: 'place',
          entityId: created.id,
          name: created.name,
          catalogLabel: fromPrismaActivityType(created.activityType),
          submitterLabel,
        });

        res.status(201).json({ data: toLocationDto(created) });
      } catch (error) {
        next(error);
      }
    }
  );
};
