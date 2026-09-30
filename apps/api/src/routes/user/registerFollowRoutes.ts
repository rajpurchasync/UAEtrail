import type { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  followUser,
  getFollowState,
  isFollowingUser,
  listFollowingForUser,
  unfollowUser,
} from '../../lib/follow-store.js';
import { notifyMemberFollowed } from '../../services/social-notifications.js';
import { buddyRelationshipParamSchema } from './schemas.js';

export const registerFollowRoutes = (router: Router): void => {
  router.get('/me/following', async (req, res, next) => {
    try {
      const data = await listFollowingForUser(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/me/follow-state/:userId',
    validate({ params: buddyRelationshipParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof buddyRelationshipParamSchema>;
        const data = await getFollowState(req.auth!.userId, userId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/following/:userId',
    validate({ params: buddyRelationshipParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof buddyRelationshipParamSchema>;
        const followerId = req.auth!.userId;
        const wasFollowing = await isFollowingUser(followerId, userId);
        const data = await followUser(followerId, userId);
        if (!wasFollowing) {
          await notifyMemberFollowed({ followerUserId: followerId, followingUserId: userId });
        }
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/me/following/:userId',
    validate({ params: buddyRelationshipParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof buddyRelationshipParamSchema>;
        const data = await unfollowUser(req.auth!.userId, userId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
