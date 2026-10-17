import type { Router } from 'express';
import type { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { validate } from '../../middleware/validate.js';
import { buildPublicMemberProfile } from '../../services/public-member-profile.js';
import { getAuthenticatedMemberProfile } from '../../services/me-profile-read.js';
import {
  completeAuthenticatedSignupProfile,
  confirmAuthenticatedEmailChange,
  patchAuthenticatedMemberProfile,
  requestAuthenticatedEmailChange,
  switchAuthenticatedMemberRole,
} from '../../services/me-profile-commands.js';
import { completeSignupProfileSchema } from '../../domain/user-profile.js';
import {
  confirmEmailChangeSchema,
  requestEmailChangeSchema,
  roleSwitchSchema,
  updateProfileSchema,
} from './schemas.js';

export const registerProfileRoutes = (router: Router): void => {
  router.get('/me/profile-public-preview', async (req, res, next) => {
    try {
      const userId = req.auth!.userId;
      const profile = await buildPublicMemberProfile(userId, {
        viewerUserId: userId,
        previewAsPublic: true,
      });
      if (!profile) {
        throw new ApiError(404, 'user_not_found', 'User not found.');
      }
      res.json({ data: profile.data, viewerAccess: profile.viewerAccess });
    } catch (error) {
      next(error);
    }
  });

  router.get('/me/profile', async (req, res, next) => {
    try {
      const data = await getAuthenticatedMemberProfile(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/me/profile', validate({ body: updateProfileSchema }), async (req, res, next) => {
    try {
      const data = await patchAuthenticatedMemberProfile(
        req.auth!.userId,
        req.body as z.infer<typeof updateProfileSchema>
      );
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    '/me/profile/signup-details',
    validate({ body: completeSignupProfileSchema }),
    async (req, res, next) => {
      try {
        const data = await completeAuthenticatedSignupProfile(
          req.auth!.userId,
          req.body as z.infer<typeof completeSignupProfileSchema>
        );
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/email/change/request',
    validate({ body: requestEmailChangeSchema }),
    async (req, res, next) => {
      try {
        const result = await requestAuthenticatedEmailChange(
          req.auth!.userId,
          req.body as z.infer<typeof requestEmailChangeSchema>
        );
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/email/change/confirm',
    validate({ body: confirmEmailChangeSchema }),
    async (req, res, next) => {
      try {
        const result = await confirmAuthenticatedEmailChange(
          req.auth!.userId,
          req.body as z.infer<typeof confirmEmailChangeSchema>
        );
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post('/me/role/switch', validate({ body: roleSwitchSchema }), async (req, res, next) => {
    try {
      const result = await switchAuthenticatedMemberRole(
        req.auth!.userId,
        req.body as z.infer<typeof roleSwitchSchema>
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
};
