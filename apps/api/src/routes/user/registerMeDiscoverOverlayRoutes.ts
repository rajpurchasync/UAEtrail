import type { Router } from 'express';
import { loadExploreMapOverlayForViewer } from '../../services/explore-map-overlay-read.js';

/** Authenticated explore overlay — per-viewer peek (`GET /me/discover/overlay`). */
export const registerMeDiscoverOverlayRoutes = (router: Router): void => {
  router.get('/me/discover/overlay', async (req, res, next) => {
    try {
      const query = req.query as Record<string, string | undefined>;
      const data = await loadExploreMapOverlayForViewer({
        query: {
          bbox: query.bbox,
          cursor: query.cursor,
          limit: query.limit,
          destination: query.destination,
        },
        viewerUserId: req.auth!.userId,
        userRole: req.auth!.role ?? null,
      });
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
