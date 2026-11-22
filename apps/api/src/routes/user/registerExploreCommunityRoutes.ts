import { z } from 'zod';
import type { Router } from 'express';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { validate } from '../../middleware/validate.js';
import {
  loadExploreCommunityDiscoverDetail,
  loadExploreCommunityDiscoverList,
} from '../../services/community-discover-read.js';

const communitySlugParamSchema = z.object({ slug: z.string().min(1).max(120) });

/** Public discoverable communities (`MIG-COMMUNITY-DISCOVER`). */
export const registerExploreCommunityRoutes = (router: Router): void => {
  router.get('/explore/communities', async (_req, res, next) => {
    try {
      const data = await loadExploreCommunityDiscoverList();
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/explore/communities/:slug',
    optionalAuth,
    validate({ params: communitySlugParamSchema }),
    async (req, res, next) => {
      try {
        const { slug } = req.params as z.infer<typeof communitySlugParamSchema>;
        const data = await loadExploreCommunityDiscoverDetail(
          slug,
          req.auth ? { userId: req.auth.userId, email: req.auth.email } : null
        );
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};