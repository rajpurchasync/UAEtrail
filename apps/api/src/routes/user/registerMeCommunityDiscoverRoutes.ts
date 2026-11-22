import { z } from 'zod';
import type { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { joinDiscoverableCommunity } from '../../services/community-discover-commands.js';

const communityIdParamSchema = z.object({ communityId: z.string().min(1) });

export const registerMeCommunityDiscoverRoutes = (router: Router): void => {
  router.post(
    '/me/communities/:communityId/join',
    validate({ params: communityIdParamSchema }),
    async (req, res, next) => {
      try {
        const { communityId } = req.params as z.infer<typeof communityIdParamSchema>;
        const data = await joinDiscoverableCommunity(req.auth!.userId, communityId);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};