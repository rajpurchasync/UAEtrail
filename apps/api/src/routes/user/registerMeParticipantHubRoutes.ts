import type { Router } from 'express';
import { loadParticipantHubSnapshot } from '../../services/participant-hub-read.js';

export const registerMeParticipantHubRoutes = (router: Router): void => {
  router.get('/me/participant-hub', async (req, res, next) => {
    try {
      const data = await loadParticipantHubSnapshot(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
