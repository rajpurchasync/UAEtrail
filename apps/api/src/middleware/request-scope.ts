import type { RequestHandler } from 'express';
import { runWithRequestScope } from '../lib/request-scope-cache.js';

/** Memoize per-request async work (e.g. profile viewer access) across parallel route services. */
export const requestScopeMiddleware: RequestHandler = (_req, _res, next) => {
  runWithRequestScope(() => next());
};
