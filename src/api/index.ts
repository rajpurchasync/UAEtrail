/**
 * Canonical frontend API surface.
 * Implementation lives in `domains/*` (HTTP paths) and `services.ts` (merged `api` facade + domain aliases).
 */
export { api } from './services';
export * from './types';
export { apiRequest } from './client';
export * from './public';
