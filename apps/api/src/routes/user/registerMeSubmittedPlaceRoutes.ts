import type { Router } from 'express';
import { z } from 'zod';
import { RewardAction } from '../../domain/enums.js';
import { locationSubmitBodySchema } from '../../domain/location-submit.js';
import { createLocationRecord, listSubmittedLocationsByUser } from '../../lib/activities-store.js';
import { createAuditLog } from '../../lib/audit.js';
import { toLocationDto } from '../../lib/mappers.js';
import { registerPlaceAlias } from '../../lib/route-place-alias.js';
import { validate } from '../../middleware/validate.js';
import { buildLocationCreateData } from '../../services/location-submit.js';
import { awardPoints } from '../../services/rewards.js';
import { notifyAdminsLocationSubmitted } from '../../services/platform-admin-events.js';
import { findAuthUserById } from '../../lib/auth-users.js';
import { fromPrismaActivityType } from '../../domain/activity-type.js';

/** Signed-in place submission (`/me/locations`). Requires prior auth middleware. */
export const registerMeSubmittedPlaceRoutes = (router: Router): void => {
  registerPlaceAlias(router, 'get', '/me/locations', async (req, res, next) => {
    try {
      const locations = await listSubmittedLocationsByUser(req.auth!.userId);
      res.json({ data: locations.map((l) => toLocationDto(l)) });
    } catch (error) {
      next(error);
    }
  });

  registerPlaceAlias(router, 'post', '/me/locations', validate({ body: locationSubmitBodySchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof locationSubmitBodySchema>;

      const created = await createLocationRecord(buildLocationCreateData(body, req.auth!.userId));

      await createAuditLog({
        actorId: req.auth!.userId,
        action: 'location.submit',
        entityType: 'location',
        entityId: created.id,
      });

      void awardPoints({
        userId: req.auth!.userId,
        action: RewardAction.LOCATION_SUBMITTED,
        referenceId: created.id,
        label: `Submitted location: ${created.name}`,
      }).catch(() => undefined);

      const submitter = await findAuthUserById(req.auth!.userId);
      const submitterLabel =
        submitter?.profile?.displayName?.trim() || submitter?.email || 'A member';
      notifyAdminsLocationSubmitted({
        locationId: created.id,
        name: created.name,
        activityType: fromPrismaActivityType(created.activityType),
        submitterLabel,
      });

      res.status(201).json({ data: toLocationDto(created) });
    } catch (error) {
      next(error);
    }
  });
};
