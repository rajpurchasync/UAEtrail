import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  listPublishedAreasForPublic,
  loadPublishedAreaDetailBySlug,
} from '../../services/area-public-read.js';

const slugParamSchema = z.object({ slug: z.string().min(1).max(80) });

/** Public curated area cards (`GET /areas`, `GET /areas/:slug`). */
export const registerPublicAreaRoutes = (router: Router): void => {
  router.get('/areas', async (_req, res, next) => {
    try {
      const data = await listPublishedAreasForPublic();
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/areas/:slug',
    validate({ params: slugParamSchema }),
    async (req, res, next) => {
      try {
        const { slug } = req.params as z.infer<typeof slugParamSchema>;
        const data = await loadPublishedAreaDetailBySlug(slug);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
