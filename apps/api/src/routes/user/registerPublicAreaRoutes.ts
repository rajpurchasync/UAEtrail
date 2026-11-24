import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  listPublishedDestinationsForPublic,
  loadPublishedDestinationDetailBySlug,
} from '../../services/destination-public-read.js';
import { attachLegacyAreasApiDeprecationHeaders } from '../../lib/route-destination-alias.js';

const slugParamSchema = z.object({ slug: z.string().min(1).max(80) });

/**
 * Legacy public area cards (`GET /areas`, `GET /areas/:slug`).
 * Same data as `/destinations*` — response keeps legacy `area` key on detail until P10.
 */
export const registerPublicAreaRoutes = (router: Router): void => {
  router.get('/areas', attachLegacyAreasApiDeprecationHeaders, async (_req, res, next) => {
    try {
      const data = await listPublishedDestinationsForPublic();
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/areas/:slug',
    attachLegacyAreasApiDeprecationHeaders,
    validate({ params: slugParamSchema }),
    async (req, res, next) => {
      try {
        const { slug } = req.params as z.infer<typeof slugParamSchema>;
        const payload = await loadPublishedDestinationDetailBySlug(slug);
        res.json({
          data: {
            area: payload.destination,
            counts: payload.counts,
            preview: payload.preview,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
};