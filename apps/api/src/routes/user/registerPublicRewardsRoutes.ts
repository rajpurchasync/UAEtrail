import type { Router } from 'express';
import { EARN_OPPORTUNITIES, MEMBERSHIP_TIERS, REWARD_POINTS } from '../../lib/rewards-config.js';
import { getLeaderboard, getRewardStats } from '../../services/rewards.js';

/** Public Trail Points catalog and leaderboard. */
export const registerPublicRewardsRoutes = (router: Router): void => {
  router.get('/rewards/catalog', (_req, res) => {
    res.json({
      data: {
        currencyName: 'Trail Points',
        membershipTiers: MEMBERSHIP_TIERS.map(({ key, name, minPoints, emoji, tagline, benefits }) => ({
          key,
          name,
          minPoints,
          emoji,
          tagline,
          benefits,
        })),
        /** @deprecated use membershipTiers */
        levels: MEMBERSHIP_TIERS.map(({ key, name, minPoints }) => ({ key, name, minPoints })),
        earnOpportunities: EARN_OPPORTUNITIES.map((item) => ({
          action: item.action,
          title: item.title,
          description: item.description,
          points: item.points,
        })),
        pointValues: REWARD_POINTS,
      },
    });
  });

  router.get('/rewards/stats', async (_req, res, next) => {
    try {
      const data = await getRewardStats();
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get('/rewards/leaderboard', async (_req, res, next) => {
    try {
      const data = await getLeaderboard(10);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
