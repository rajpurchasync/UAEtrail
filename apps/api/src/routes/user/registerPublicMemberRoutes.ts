import type { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { findAuthUserById } from '../../lib/auth-users.js';
import { normalizeProfileVisibility } from '../../lib/media-access.js';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { validate } from '../../middleware/validate.js';
import { listPublishedUpcomingActivitiesByMember } from '../../lib/activities-store.js';
import { buildActivityDto } from '../../lib/mappers.js';
import { resolveProfileViewerAccess } from '../../services/profile-viewer-access.js';
import { recordMemberProfileView } from '../../lib/member-profile-views-store.js';
import { assertAndRecordMemberDiscoveryProfileOpen } from '../../services/member-discovery-quota.js';
import { resolveMemberStatus } from '../../services/member-status.js';
import { buildPublicMemberProfile } from '../../services/public-member-profile.js';
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
      const viewerUserId = req.auth?.userId ?? null;
      const fromDiscover =
        req.query.from === 'discover' || req.query.discover === '1' || req.query.discover === 'true';

      const profile = await buildPublicMemberProfile(userId, {
        viewerUserId,
        isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
      });
      if (!profile) {
        throw new ApiError(404, 'user_not_found', 'User not found.');
      }

      const mayCountView =
        viewerUserId &&
        viewerUserId !== userId &&
        (profile.viewerAccess.exposure === 'public' || profile.viewerAccess.exposure === 'full');

      if (fromDiscover && mayCountView && viewerUserId) {
        const hostStatus = await resolveMemberStatus(viewerUserId);
        await assertAndRecordMemberDiscoveryProfileOpen({
          viewerUserId,
          profileUserId: userId,
          hostStatus,
        });
      } else if (mayCountView && !fromDiscover) {
        void recordMemberProfileView({ profileUserId: userId, viewerUserId: viewerUserId! }).catch(
          () => undefined
        );
      }
      res.json({ data: profile.data, viewerAccess: profile.viewerAccess });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/users/:userId/upcoming-activities',
    optionalAuth,
    validate({ params: userBriefParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof userBriefParamSchema>;
        const profile = await buildPublicMemberProfile(userId, {
          viewerUserId: req.auth?.userId ?? null,
          isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
        });
        if (!profile) {
          throw new ApiError(404, 'user_not_found', 'User not found.');
        }
        if (profile.viewerAccess.exposure !== 'full') {
          res.json({ data: [] });
          return;
        }

        const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);
        const events = await listPublishedUpcomingActivitiesByMember(userId, limit);
        res.json({ data: events.map((event) => buildActivityDto(event)) });
      } catch (error) {
        next(error);
      }
    }
  );
};
