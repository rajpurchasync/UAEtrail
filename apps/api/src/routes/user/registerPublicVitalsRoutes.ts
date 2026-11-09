import type { Router } from 'express';
import { z } from 'zod';
import { enqueueWebVital, flushWebVitalsBatchToMongo } from '../../lib/web-vitals-buffer.js';

const vitalBody = z
  .object({
    n: z.string().min(1).max(32),
    v: z.number(),
    path: z.string().max(200).optional(),
    d: z.string().max(32).optional(),
    conn: z.string().max(32).optional(),
  })
  .strict();

export const registerPublicVitalsRoutes = (router: Router): void => {
  router.post('/vitals', (req, res) => {
    const parsed = vitalBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'invalid_payload', message: 'Invalid vital payload.' } });
      return;
    }
    enqueueWebVital(parsed.data, flushWebVitalsBatchToMongo);
    res.status(202).json({ status: 'accepted' });
  });
};
