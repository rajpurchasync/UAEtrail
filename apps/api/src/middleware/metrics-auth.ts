import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { isLoopbackAddress } from '../lib/demo-login-policy.js';

/** Require bearer token except in test or local dev loopback peers. */
export const requireMetricsAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (env.NODE_ENV === 'test') {
    next();
    return;
  }

  if (env.NODE_ENV === 'development' && isLoopbackAddress(req.socket?.remoteAddress)) {
    next();
    return;
  }

  const expected = process.env.METRICS_TOKEN?.trim();
  if (!expected) {
    res.status(503).json({
      error: { code: 'metrics_unavailable', message: 'Metrics endpoint is not configured.' },
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
