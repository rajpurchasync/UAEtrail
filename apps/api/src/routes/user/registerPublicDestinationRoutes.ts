import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  listPublishedDestinationsForPublic,
  loadPublishedDestinationDetailBySlug,
} from '../../services/destination-public-read.js';

const slugParamSchema = z.object({ slug: z.string().min(1).max(80) });

/** Public curated destinations (`GET /destinations`, `GET /destinations/:slug`). */
export const registerPublicDestinationRoutes = (router: Router): void => {
  router.get('/destinations', async (_req, res, next) => {
    try {
      const data = await listPublishedDestinationsForPublic();
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/destinations/:slug',
    validate({ params: slugParamSchema }),
    async (req, res, next) => {
      try {
        const { slug } = req.params as z.infer<typeof slugParamSchema>;
        const data = await loadPublishedDestinationDetailBySlug(slug);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};