import { Router } from 'express';
import { z } from 'zod';
import { resolvePlaceSelection, searchPlaces } from '../lib/place-search.js';
import {
  resolveRideshareDestinationRow,
  searchRideshareDestinations,
} from '../lib/rideshare-destination-search.js';
import { optionalAuth } from '../middleware/optional-auth.js';
import { validate } from '../middleware/validate.js';

const searchQuerySchema = z.object({
  q: z.string().min(2).max(200),
});

export const geoSearchRouter = Router();

geoSearchRouter.get('/search', optionalAuth, validate({ query: searchQuerySchema }), async (req, res, next) => {
  try {
    const { q } = req.query as z.infer<typeof searchQuerySchema>;
    const data = await searchPlaces(q);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

const resolveBodySchema = z.object({
  placeId: z.string().min(1).max(300).optional(),
  query: z.string().min(2).max(200).optional(),
});

geoSearchRouter.get(
  '/rideshare-destinations',
  optionalAuth,
  validate({ query: searchQuerySchema }),
  async (req, res, next) => {
    try {
      const { q } = req.query as z.infer<typeof searchQuerySchema>;
      const userId = req.auth?.userId ?? null;
      const data = await searchRideshareDestinations(q, userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);

const rideshareDestinationResolveSchema = z.object({
  kind: z.enum(['activity_meeting', 'catalog_place', 'pending_place']),
  id: z.string().min(1).max(200),
});

geoSearchRouter.post(
  '/rideshare-destinations/resolve',
  optionalAuth,
  validate({ body: rideshareDestinationResolveSchema }),
  async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof rideshareDestinationResolveSchema>;
      const data = await resolveRideshareDestinationRow(body.kind, body.id, req.auth?.userId ?? null);
      if (!data) {
        res.status(404).json({ error: 'Destination not found' });
        return;
      }
      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);

geoSearchRouter.post('/resolve', optionalAuth, validate({ body: resolveBodySchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof resolveBodySchema>;
    if (!body.placeId && !body.query) {
      res.status(400).json({ error: 'placeId or query required' });
      return;
    }
    const data = await resolvePlaceSelection(body);
    if (!data) {
      res.status(404).json({ error: 'Place not found' });
      return;
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
