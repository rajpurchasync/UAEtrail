import type { RequestHandler } from 'express';

/**
 * Rewrites `/host/*` to `/operator/*` on the API router so legacy clients keep working
 * without a separate `/host` mount (`legacyPublishingPathDeprecation` sets headers).
 */
export const legacyHostApiRewrite: RequestHandler = (req, _res, next) => {
  const pathOnly = req.path;
  if (pathOnly === '/host' || pathOnly.startsWith('/host/')) {
    const suffix = pathOnly === '/host' ? '' : pathOnly.slice('/host'.length);
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    req.url = `/operator${suffix}${query}`;
  }
  next();
};
