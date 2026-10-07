import type { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  clearMemberGoal,
  createMemberGoal,
  deleteMemberGoal,
  getActiveMemberGoal,
  listMemberGoals,
  updateMemberGoal,
  upsertMemberGoal,
} from '../../lib/member-goals-store.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const upsertGoalSchema = z.object({
  activityFilter: z.enum(['hiking', 'camping', 'all_outings']),
  countMode: z.enum(['join', 'host']).optional(),
  targetCount: z.number().int().min(1).max(999),
  targetDate: isoDate.optional(),
  year: z.number().int().min(2020).max(2100).optional(),
});

const idParamSchema = z.object({ id: z.string().min(1) });

export const registerMeGoalsRoutes = (router: Router): void => {
  router.get('/me/goals', requireAuth, async (req, res, next) => {
    try {
      const data = await listMemberGoals(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/me/goals',
    requireAuth,
    validate({ body: upsertGoalSchema }),
    async (req, res, next) => {
      try {
        const data = await createMemberGoal(req.auth!.userId, req.body);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.patch(
    '/me/goals/:id',
    requireAuth,
    validate({ params: idParamSchema, body: upsertGoalSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const data = await updateMemberGoal(req.auth!.userId, id, req.body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/me/goals/:id',
    requireAuth,
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        await deleteMemberGoal(req.auth!.userId, id);
        res.json({ data: null });
      } catch (error) {
        next(error);
      }
    }
  );

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
