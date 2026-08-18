import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

/** Require bearer token in production; open in development/test. */
export const requireMetricsAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (env.NODE_ENV !== 'production') {
    next();
    return;
  }

  const expected = process.env.METRICS_TOKEN;
  if (!expected) {
    res.status(503).json({
      error: { code: 'metrics_unavailable', message: 'Metrics endpoint is not configured.' }
    });
    return;
  }

  const auth = req.headers.authorization;
  if (auth === `Bearer ${expected}`) {
    next();
    return;
  }

  res.status(401).json({ error: { code: 'unauthorized', message: 'Unauthorized' } });
};
