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

const WRITE_METHODS = new Set<HttpMethod>(['post', 'patch', 'delete']);

/** Register a handler on canonical `/places` paths and legacy `/locations` alias when applicable. */
export const registerPlaceAlias = (
  router: Router,
  method: HttpMethod,
  path: string,
  ...handlers: RequestHandler[]
): void => {
  router[method](path, ...handlers);
  const alias = placePathAlias(path);
  if (!alias || alias === path) return;
  if (WRITE_METHODS.has(method)) {
    router[method](alias, (_req, res) => {
      res.setHeader('Deprecation', 'true');
      res.status(410).json({
        error: 'gone',
        message: `${method.toUpperCase()} ${alias} is retired; use ${method.toUpperCase()} ${path}.`,
      });
    });
    return;
  }
  router[method](alias, ...handlers);
};
