import type { Router } from 'express';
import { z } from 'zod';
import { hostApplicationBodySchema } from '../../domain/host-application.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  submitMyHostApplication,
  upsertMyHostDetails,
} from '../../services/host-application-me-commands.js';
import { loadMyHostApplication } from '../../services/host-application-me-read.js';
import { hostDetailsSchema } from './schemas.js';

export const registerHostApplicationRoutes = (router: Router): void => {
  router.patch(
    '/me/host-details',
    requireAuth,
    requireVerifiedEmail,
    validate({ body: hostDetailsSchema }),
    async (req, res, next) => {
      try {
        const data = await upsertMyHostDetails(req.auth!.userId, req.body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/host-application', requireAuth, async (req, res, next) => {
    try {
      const data = await loadMyHostApplication(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/me/host-application',
    requireAuth,
    validate({ body: hostApplicationBodySchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof hostApplicationBodySchema>;
        const data = await submitMyHostApplication({
          userId: req.auth!.userId,
          applicantEmail: req.auth!.email,
          body,
        });
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
