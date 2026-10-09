import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { validate } from '../../middleware/validate.js';
import {
  findAreaBySlug,
  listPublishedAreas,
  toAreaPublicDto,
} from '../../lib/areas-store.js';
import { COLLECTIONS } from '../../lib/collections.js';
import { getMongoClient } from '../../lib/mongo.js';
import { ActivityStatus, LocationStatus } from '../../domain/enums.js';

const slugParamSchema = z.object({ slug: z.string().min(1).max(80) });

const countByAreaId = async (areaId: string) => {
  const db = getMongoClient()!.db();
  const [activities, places, seeking] = await Promise.all([
    db.collection(COLLECTIONS.ACTIVITIES).countDocuments({
      areaId,
      status: ActivityStatus.PUBLISHED,
    }),
    db.collection(COLLECTIONS.LOCATIONS).countDocuments({
      areaId,
      status: LocationStatus.ACTIVE,
    }),
    db.collection(COLLECTIONS.PARTICIPANT_INTENTS).countDocuments({
      areaId,
      status: 'active',
    }),
  ]);
  return { activities, places, seeking };
};

/** Public curated area cards (`GET /areas`, `GET /areas/:slug`). */
export const registerPublicAreaRoutes = (router: Router): void => {
  router.get('/areas', async (_req, res, next) => {
    try {
      const areas = await listPublishedAreas();
      res.json({ data: areas.map(toAreaPublicDto) });
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
        const area = await findAreaBySlug(slug);
        if (!area || area.status !== 'published') {
          throw new ApiError(404, 'area_not_found', 'Area not found.');
        }
        const counts = await countByAreaId(area.id);
        res.json({
          data: {
            area: toAreaPublicDto(area),
            counts,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
};
