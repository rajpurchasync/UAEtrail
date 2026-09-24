/**
 * Canonical frontend API surface.
 * Implementation lives in `domains/*` (HTTP paths) and `services.ts` (merged `api` facade).
 * App code should import `{ api }` from `./index` or `./api/index`, not `./services`.
 */
export { api } from './services';
export * from './types';
export { apiRequest } from './client';
export * from './public';
