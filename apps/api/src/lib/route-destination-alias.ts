import type { RequestHandler } from 'express';

/** Legacy `GET /areas*` — canonical successor is `GET /destinations*` (MIG-DESTINATION-GEO P9). */
export const DEPRECATED_AREAS_API_PREFIX = '/areas' as const;
export const CANONICAL_DESTINATIONS_API_PREFIX = '/destinations' as const;

export const attachLegacyAreasApiDeprecationHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', `</api${CANONICAL_DESTINATIONS_API_PREFIX}>; rel="successor-version"`);
  next();
};