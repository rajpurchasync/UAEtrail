import type { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  clearMemberGoal,
  getActiveMemberGoal,
  upsertMemberGoal,
} from '../../lib/member-goals-store.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const upsertGoalSchema = z.object({
  activityFilter: z.enum(['hiking', 'camping', 'all_outings']),
  targetCount: z.number().int().min(1).max(999),
  targetDate: isoDate.optional(),
  year: z.number().int().min(2020).max(2100).optional(),
});

export const registerMeGoalsRoutes = (router: Router): void => {
  router.get('/me/goals/active', requireAuth, async (req, res, next) => {
    try {
      const data = await getActiveMemberGoal(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.put(
    '/me/goals/active',
    requireAuth,
    validate({ body: upsertGoalSchema }),
    async (req, res, next) => {
      try {
        const data = await upsertMemberGoal(req.auth!.userId, req.body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete('/me/goals/active', requireAuth, async (req, res, next) => {
    try {
      await clearMemberGoal(req.auth!.userId);
      res.json({ data: null });
    } catch (error) {
      next(error);
    }
  });
};
