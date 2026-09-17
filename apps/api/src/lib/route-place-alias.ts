import type { RequestHandler, Router } from 'express';

/** Map legacy `/locations` wire paths to domain `/places` aliases. */
export const placePathAlias = (path: string): string | null => {
  if (path.startsWith('/me/locations')) {
    return path.replace(/^\/me\/locations/, '/me/places');
  }
  if (path.startsWith('/locations')) {
    return path.replace(/^\/locations/, '/places');
  }
  return null;
};

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

/** Register a handler on both legacy and `/places` paths when applicable. */
export const registerPlaceAlias = (
  router: Router,
  method: HttpMethod,
  path: string,
  ...handlers: RequestHandler[]
): void => {
  router[method](path, ...handlers);
  const alias = placePathAlias(path);
  if (alias && alias !== path) {
    router[method](alias, ...handlers);
  }
};
