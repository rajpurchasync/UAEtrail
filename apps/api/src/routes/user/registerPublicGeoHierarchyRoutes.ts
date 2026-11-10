import type { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  composeGeoSummary,
  geoTreeDto,
  listGeoActivities,
  listGeoFacilities,
  listGeoPlaces,
  loadGeoCountsByIds,
  loadGeoTree,
  resolveGeoRefForPin,
} from '../../services/geo-hierarchy-read.js';
import { geoCacheGet, geoCacheSet } from '../../lib/geo-read-cache.js';

const idParam = z.object({ id: z.string().min(1).max(200) });
const countsQuery = z.object({ ids: z.string().min(1).max(2000) });
const listQuery = z.object({
  type: z.string().max(40).optional(),
  kind: z.string().max(40).optional(),
  working: z.string().max(20).optional(),
  cursor: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});
const resolveQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const registerPublicGeoHierarchyRoutes = (router: Router): void => {
  router.get('/tree', async (req, res, next) => {
    try {
      const cached = await geoCacheGet<{ data: ReturnType<typeof geoTreeDto> }>('tree');
      if (cached) {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
        res.setHeader('ETag', cached.etag);
        if (req.headers['if-none-match'] === cached.etag) {
          res.status(304).end();
          return;
        }
        res.json(cached.payload);
        return;
      }
      const tree = await loadGeoTree();
      const etag = `"v${tree.version}"`;
      const payload = { data: geoTreeDto(tree) };
      await geoCacheSet('tree', etag, payload);
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
      res.setHeader('ETag', etag);
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
      }
      res.json(payload);
    } catch (error) {
      next(error);
    }
  });

  router.get('/counts', validate({ query: countsQuery }), async (req, res, next) => {
    try {
      const ids = (req.query as z.infer<typeof countsQuery>).ids.split(',').map((s) => s.trim()).filter(Boolean);
      const data = await loadGeoCountsByIds(ids);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get('/resolve', validate({ query: resolveQuery }), async (req, res, next) => {
    try {
      const { lat, lng } = req.query as unknown as z.infer<typeof resolveQuery>;
      const data = await resolveGeoRefForPin({ latitude: lat, longitude: lng });
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id/summary', validate({ params: idParam }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParam>;
      const tree = await loadGeoTree();
      const cacheKey = `summary:${id}:v${tree.version}`;
      const cached = await geoCacheGet<{ data: unknown }>(cacheKey);
      if (cached) {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('ETag', cached.etag);
        res.json(cached.payload);
        return;
      }
      const data = await composeGeoSummary(id, tree);
      if (!data) {
        res.status(404).json({ error: 'Geo node not found' });
        return;
      }
      const etag = `"v${tree.version}-rev${data.rev}-n${data.children.length}"`;
      await geoCacheSet(cacheKey, etag, { data });
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('ETag', etag);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/:id/facilities',
    validate({ params: idParam, query: listQuery }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParam>;
        const q = req.query as z.infer<typeof listQuery>;
        const data = await listGeoFacilities(id, q.type, q.cursor, q.limit);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/:id/places',
    validate({ params: idParam, query: listQuery }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParam>;
        const q = req.query as z.infer<typeof listQuery>;
        const data = await listGeoPlaces(id, q.kind, q.cursor, q.limit);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/:id/activities',
    validate({ params: idParam, query: listQuery }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParam>;
        const q = req.query as z.infer<typeof listQuery>;
        const data = await listGeoActivities(id, q.type, q.cursor, q.limit);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
