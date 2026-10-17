import type { Router } from 'express';
import { z } from 'zod';
import { locationSubmitBodySchema } from '../../domain/location-submit.js';
import { registerPlaceAlias } from '../../lib/route-place-alias.js';
import { ORG_ACTIVITY_EDIT_ROLES } from '../../lib/org-permissions.js';
import { requireOrgRole } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { submitOperatorLocation } from '../../services/operator-submitted-location-commands.js';
import { listOperatorSubmittedLocations } from '../../services/operator-submitted-location-read.js';

/** Tenant host: list and submit venue/place drafts (organisation console). */
export const registerOperatorSubmittedLocationRoutes = (operatorRouter: Router): void => {
  registerPlaceAlias(operatorRouter, 'get', '/places', async (req, res, next) => {
    try {
      const data = await listOperatorSubmittedLocations(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  registerPlaceAlias(
    operatorRouter,
    'post',
    '/places',
    requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ body: locationSubmitBodySchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof locationSubmitBodySchema>;
        const data = await submitOperatorLocation({
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
