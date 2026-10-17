import type { RequestHandler, Router } from 'express';

/**
 * Legacy read alias when handlers are registered on canonical `/me/pro-application`
 * and `/pro-applications` (admin) paths (MIG-COH-03).
 * New clients must use those paths only.
 */
export const proApplicationPathAlias = (path: string): string | null => {
  if (path.startsWith('/me/pro-application')) {
    return path.replace(/^\/me\/pro-application/, '/me/host-application');
  }
  if (path.startsWith('/pro-applications')) {
    return path.replace(/^\/pro-applications/, '/host-applications');
  }
  return null;
};

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

/** Register a handler on canonical Pro-application paths and legacy host-application alias. */
export const registerProApplicationAlias = (
  router: Router,
  method: HttpMethod,
  path: string,
  ...handlers: RequestHandler[]
): void => {
  router[method](path, ...handlers);
  const alias = proApplicationPathAlias(path);
  if (alias && alias !== path) {
    router[method](alias, ...handlers);
  }
};
