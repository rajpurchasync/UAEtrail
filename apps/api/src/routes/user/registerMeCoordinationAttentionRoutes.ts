import type { Router } from 'express';
import { loadMemberCoordinationAttention } from '../../services/member-coordination-attention.js';

export const registerMeCoordinationAttentionRoutes = (router: Router): void => {
  router.get('/me/coordination-attention', async (req, res, next) => {
    try {
      const data = await loadMemberCoordinationAttention(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
