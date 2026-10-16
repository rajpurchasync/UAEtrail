import type { Router } from 'express';
import type { FacilityKind } from '@uaetrail/shared-types';
import { z } from 'zod';
import { locationSubmitBodySchema } from '../../domain/location-submit.js';
import { createFacilityRecord } from '../../lib/facilities-store.js';
import { toFacilityDto } from '../../lib/facility-mappers.js';
import { validate } from '../../middleware/validate.js';
import { buildFacilitySubmitInput } from '../../services/facility-submit.js';
import { findPublishedAreaById } from '../../lib/areas-store.js';
import { ApiError } from '../../lib/api-error.js';
import { createAuditLog } from '../../lib/audit.js';
import { notifyAdminsCatalogSubmitted } from '../../services/catalog-submit-notifications.js';
import { findAuthUserById } from '../../lib/auth-users.js';
import { RewardAction } from '../../domain/enums.js';
import { awardPoints } from '../../services/rewards.js';
import { scheduleSideEffect } from '../../lib/schedule-side-effect.js';

const facilitySubmitBodySchema = locationSubmitBodySchema
  .extend({
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
        const area = await findPublishedAreaById(body.areaId.trim());
        if (!area) {
          throw new ApiError(400, 'area_not_found', 'Choose a published area.');
        }
        if (!body.facilityKind) {
          throw new ApiError(400, 'facility_kind_required', 'facilityKind is required.');
        }

        const facilityKind = body.facilityKind as FacilityKind;
        const facility = await createFacilityRecord(
          buildFacilitySubmitInput(
            {
              ...body,
              facilityKind,
              parentPlaceId: body.parentPlaceId ?? null,
            },
            req.auth!.userId
          )
        );

        await createAuditLog({
          actorId: req.auth!.userId,
          action: 'facility.submit',
          entityType: 'facility',
          entityId: facility.id,
        });

        const submitter = await findAuthUserById(req.auth!.userId);
        const submitterLabel =
          submitter?.profile?.displayName?.trim() || submitter?.email || 'A member';
        notifyAdminsCatalogSubmitted({
          kind: 'facility',
          entityId: facility.id,
          name: facility.name,
          catalogLabel: facility.facilityKind,
          submitterLabel,
        });

        scheduleSideEffect(
          awardPoints({
            userId: req.auth!.userId,
            action: RewardAction.LOCATION_SUBMITTED,
            referenceId: facility.id,
            label: `Submitted facility: ${facility.name}`,
          }),
          'member.facility_submitted_rewards'
        );

        res.status(201).json({ data: toFacilityDto(facility) });
      } catch (error) {
        next(error);
      }
    }
  );
};
