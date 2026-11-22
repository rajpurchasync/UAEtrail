import type { Router } from 'express';
import { loadExploreCommunityDiscoverList } from '../../services/community-discover-read.js';

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
};