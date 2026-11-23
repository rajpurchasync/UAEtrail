import type { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { followMemberForUser, unfollowMemberForUser } from '../../services/member-follow-commands.js';
import {
  listMeFollowingMembers,
  loadMeMemberFollowState,
  loadMeProfileEngagementStats,
} from '../../services/member-follow-read.js';
import { friendRelationshipParamSchema } from './schemas.js';

export const registerFollowRoutes = (router: Router): void => {
  router.get('/me/profile-stats', async (req, res, next) => {
    try {
      const data = await loadMeProfileEngagementStats(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get('/me/following', async (req, res, next) => {
    try {
      const data = await listMeFollowingMembers(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/me/follow-state/:userId',
    validate({ params: friendRelationshipParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof friendRelationshipParamSchema>;
        const data = await loadMeMemberFollowState(req.auth!.userId, userId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/following/:userId',
    validate({ params: friendRelationshipParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof friendRelationshipParamSchema>;
        const data = await followMemberForUser(req.auth!.userId, userId);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/me/following/:userId',
    validate({ params: friendRelationshipParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof friendRelationshipParamSchema>;
        const data = await unfollowMemberForUser(req.auth!.userId, userId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
