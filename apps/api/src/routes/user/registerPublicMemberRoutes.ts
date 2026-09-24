import type { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { findAuthUserById } from '../../lib/auth-users.js';
import { normalizeProfileVisibility } from '../../lib/media-access.js';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { validate } from '../../middleware/validate.js';
import { resolveProfileViewerAccess } from '../../services/profile-viewer-access.js';
import { userBriefParamSchema } from './schemas.js';

/** Public member brief + profile (`/member/:id`). */
export const registerPublicMemberRoutes = (router: Router): void => {
  router.get('/users/:userId/brief', optionalAuth, validate({ params: userBriefParamSchema }), async (req, res, next) => {
    try {
      const { userId } = req.params as z.infer<typeof userBriefParamSchema>;
      const user = await findAuthUserById(userId);
      if (!user) {
        throw new ApiError(404, 'user_not_found', 'User not found.');
      }

      const visibility = normalizeProfileVisibility(user.profile?.profileVisibility);
      const access = await resolveProfileViewerAccess({
        viewerUserId: req.auth?.userId ?? null,
        targetUserId: userId,
        targetVisibility: visibility,
        isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
      });

      if (visibility === 'private' && !access.canViewFullProfile) {
        res.json({
          data: {
            id: user._id,
            displayName: 'Private member',
            avatarUrl: null,
          },
        });
        return;
      }

      res.json({
        data: {
          id: user._id,
          displayName: user.profile.displayName ?? user.email.split('@')[0],
          avatarUrl: user.profile.avatarUrl ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/users/:userId/public-profile', optionalAuth, validate({ params: userBriefParamSchema }), async (req, res, next) => {
    try {
      const { userId } = req.params as z.infer<typeof userBriefParamSchema>;
      const { buildPublicMemberProfile } = await import('../../services/public-member-profile.js');
      const profile = await buildPublicMemberProfile(userId, {
        viewerUserId: req.auth?.userId ?? null,
        isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
      });
      if (!profile) {
        throw new ApiError(404, 'user_not_found', 'User not found.');
      }
      res.json({ data: profile });
    } catch (error) {
      next(error);
    }
  });
};
