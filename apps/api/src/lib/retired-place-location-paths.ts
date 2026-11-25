import type { Request, Response, Router } from 'express';

const toCanonicalPlacePath = (inboundPath: string): string => {
  if (inboundPath.startsWith('/me/locations')) {
    return inboundPath.replace(/^\/me\/locations/, '/me/places');
  }
  if (inboundPath.startsWith('/locations')) {
    return inboundPath.replace(/^\/locations/, '/places');
  }
  return inboundPath;
};

const toRouterRelativePath = (req: Request): string => {
  const mounted = `${req.baseUrl}${req.path}`.replace(/\/$/, '') || req.path;
  return mounted.replace(/^\/api(?=\/|$)/, '') || mounted;
};

const retirePlaceLocationAliasRequest = (req: Request, res: Response): void => {
  const inboundPath = toRouterRelativePath(req);
  const canonicalPath = toCanonicalPlacePath(inboundPath);
  res.setHeader('Deprecation', 'true');
  res.status(410).json({
    error: 'gone',
    message: `${req.method} ${inboundPath} is retired; use ${req.method} ${canonicalPath}.`,
  });
};

/** Catch-all 410 for retired `/locations` and `/me/locations` HTTP aliases (MIG-COH-02 / W2). */
export const mountRetiredPlaceLocationPaths = (router: Router): void => {
  router.use('/locations', retirePlaceLocationAliasRequest);
  router.use('/me/locations', retirePlaceLocationAliasRequest);
};