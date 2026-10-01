import type { Router } from 'express';
import { getRewardSummary } from '../../services/rewards.js';

/** Authenticated rewards summary (`/me/rewards`). */
export const registerMeRewardsRoutes = (router: Router): void => {
  router.get('/me/rewards', async (req, res, next) => {
    try {
      const data = await getRewardSummary(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
