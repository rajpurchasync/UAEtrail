import type { SocialPeopleSegment } from '@uaetrail/shared-types';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { loadSocialPeople, loadSocialPeoplePreview } from '../../services/social-people.js';

const segmentSchema = z.object({
  segment: z.enum(['all', 'friends', 'followed']).default('all'),
});

export const registerSocialPeopleRoutes = (router: Router): void => {
  router.get(
    '/people/preview',
    requireAuth,
    requireVerifiedEmail,
    async (req, res, next) => {
      try {
        const data = await loadSocialPeoplePreview({
          viewerUserId: req.auth!.userId,
          userRole: req.auth!.role,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/people',
    requireAuth,
    requireVerifiedEmail,
    validate({ query: segmentSchema }),
    async (req, res, next) => {
      try {
        const { segment } = req.query as unknown as { segment: SocialPeopleSegment };
        const data = await loadSocialPeople({
          viewerUserId: req.auth!.userId,
          userRole: req.auth!.role,
          segment,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
