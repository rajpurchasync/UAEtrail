import type { RequestHandler, Router } from 'express';

/**
 * Legacy read alias when handlers are registered on canonical `/places` paths (MIG-COH-02).
 * New clients must use `/places` and `/me/places` only.
 */
export const placePathAlias = (path: string): string | null => {
  if (path.startsWith('/me/places')) {
    return path.replace(/^\/me\/places/, '/me/locations');
  }
  if (path.startsWith('/places')) {
    return path.replace(/^\/places/, '/locations');
  }
  return null;
};

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

/** Register a handler on canonical `/places` paths and legacy `/locations` alias when applicable. */
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
