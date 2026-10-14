import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { runAgentDiscoverSearch } from '../lib/agent-discover.js';
import { buildAgentManifest } from '../lib/agent-manifest.js';
import { viewLimiter } from '../middleware/rate-limit-instances.js';
import { validate } from '../middleware/validate.js';

export const agentRouter = Router();

const discoverQuerySchema = z.object({
  q: z.string().trim().min(1).max(64),
  kind: z.enum(['all', 'activity', 'place']).default('all').optional(),
  region: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(25).default(10).optional(),
});

const resolveKinds = (kind: 'all' | 'activity' | 'place' | undefined): Array<'activity' | 'place'> => {
  if (kind === 'activity') return ['activity'];
  if (kind === 'place') return ['place'];
  return ['activity', 'place'];
};

agentRouter.get('/manifest.json', viewLimiter, (_req, res) => {
  const siteOrigin = env.APP_BASE_URL.replace(/\/$/, '');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(buildAgentManifest(siteOrigin));
});

agentRouter.get(
  '/discover',
  viewLimiter,
  validate({ query: discoverQuerySchema }),
  async (req, res, next) => {
    try {
      const q = req.query as unknown as z.infer<typeof discoverQuerySchema>;
      const siteOrigin = env.APP_BASE_URL.replace(/\/$/, '');
      const payload = await runAgentDiscoverSearch({
        siteOrigin,
        q: q.q,
        kinds: resolveKinds(q.kind),
        region: q.region,
        limit: q.limit ?? 10,
      });
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json(payload);
    } catch (error) {
      next(error);
    }
  }
);
