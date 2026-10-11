import { RewardAction } from '../../domain/enums.js';
import type { Router } from 'express';
import { z } from 'zod';
import { registerPlaceAlias } from '../../lib/route-place-alias.js';
import { createAuditLog } from '../../lib/audit.js';
import { toLocationDto } from '../../lib/mappers.js';
import { validate } from '../../middleware/validate.js';
import { requireOrgRole } from '../../middleware/tenant.js';
import { ORG_ACTIVITY_EDIT_ROLES } from '../../lib/org-permissions.js';
import { awardPoints } from '../../services/rewards.js';
import { buildLocationCreateData } from '../../services/location-submit.js';
import { locationSubmitBodySchema } from '../../domain/location-submit.js';
import { createLocationRecord, listSubmittedLocationsByUser } from '../../lib/activities-store.js';
import { findPublishedAreaById } from '../../lib/areas-store.js';
import { ApiError } from '../../lib/api-error.js';

/** Tenant host: list and submit venue/place drafts (organisation console). */
export const registerHostSubmittedLocationRoutes = (hostRouter: Router): void => {
  registerPlaceAlias(hostRouter, 'get', '/locations', async (req, res, next) => {
    try {
      const locations = await listSubmittedLocationsByUser(req.auth!.userId);
      res.json({ data: locations.map((l) => toLocationDto(l)) });
    } catch (error) {
      next(error);
    }
  });

  registerPlaceAlias(
    hostRouter,
    'post',
    '/locations',
    requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ body: locationSubmitBodySchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof locationSubmitBodySchema>;
        const area = await findPublishedAreaById(body.areaId.trim());
        if (!area) {
          throw new ApiError(400, 'area_not_found', 'Choose a published area.');
        }

        const created = await createLocationRecord(buildLocationCreateData(body, req.auth!.userId));

        await createAuditLog({
          actorId: req.auth!.userId,
          action: 'location.submit',
          entityType: 'location',
          entityId: created.id,
          tenantId: req.tenantContext!.tenantId,
        });

        void awardPoints({
          userId: req.auth!.userId,
          action: RewardAction.LOCATION_SUBMITTED,
          referenceId: created.id,
          label: `Submitted location: ${created.name}`,
        }).catch(() => undefined);

        res.status(201).json({ data: toLocationDto(created) });
      } catch (error) {
        next(error);
      }
    }
  );
};
