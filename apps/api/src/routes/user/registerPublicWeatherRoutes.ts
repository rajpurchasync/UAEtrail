import type { Router } from 'express';
import { z } from 'zod';
import { gccCalendarDate } from '@uaetrail/shared-types';
import { validate } from '../../middleware/validate.js';
import { weatherLimiter } from '../../middleware/rate-limit-instances.js';
import { loadPublicWeatherForecast } from '../../services/weather-forecast-read.js';

const weatherQuerySchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
  date: z
    .string()
    .min(8)
    .transform((value) => gccCalendarDate(value, 'AE'))
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

/** Cached public weather for detail pages (plan Prompt 5 — `weather_cache`, 60 min TTL). */
export const registerPublicWeatherRoutes = (router: Router): void => {
  router.get('/weather', weatherLimiter, validate({ query: weatherQuerySchema }), async (req, res, next) => {
    try {
      const q = req.query as unknown as z.infer<typeof weatherQuerySchema>;
      const data = await loadPublicWeatherForecast({
        lat: q.lat,
        lng: q.lng,
        date: q.date,
      });
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
