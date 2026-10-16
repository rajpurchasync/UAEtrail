import type { RequestHandler, Router } from 'express';

/** Legacy alias for a canonical member/catalog path (CPC-4: `/me/places` is canonical). */
export const placePathAlias = (path: string): string | null => {
  if (path.startsWith('/me/places')) {
    return path.replace(/^\/me\/places/, '/me/locations');
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
