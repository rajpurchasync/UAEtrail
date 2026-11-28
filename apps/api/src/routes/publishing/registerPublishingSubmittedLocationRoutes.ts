import type { Router } from 'express';
import { z } from 'zod';
import { locationSubmitBodySchema } from '../../domain/location-submit.js';
import { mountRetiredPlaceLocationPaths } from '../../lib/retired-place-location-paths.js';
import { ORG_ACTIVITY_EDIT_ROLES } from '../../lib/org-permissions.js';
import { requireMembershipRole } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { submitPublishingLocation } from '../../services/publishing-submitted-location-commands.js';
import { listPublishingSubmittedLocations } from '../../services/publishing-submitted-location-read.js';

/** Tenant host: list and submit venue/place drafts (operator desk). */
export const registerPublishingSubmittedLocationRoutes = (publishingRouter: Router): void => {
  mountRetiredPlaceLocationPaths(publishingRouter);

  publishingRouter.get('/places', async (req, res, next) => {
    try {
      const data = await listPublishingSubmittedLocations(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  publishingRouter.post(
    '/places',
    requireMembershipRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ body: locationSubmitBodySchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof locationSubmitBodySchema>;
        const data = await submitPublishingLocation({
          userId: req.auth!.userId,
          tenantId: req.tenantContext!.tenantId,
          body,
        });
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
