import type { Location } from '../domain/types.js';

/** Active catalog / map registry rows must ship a cover URL (`images[0]`). */
export const locationHasRegistryCoverImage = (location: Pick<Location, 'images'>): boolean =>
  Boolean(location.images?.[0]?.trim());

/** Mongo filter fragment — merge into public catalog list queries. */
export const registryCoverImageMongoFilter = (): Record<string, unknown> => ({
  'images.0': { $exists: true, $nin: [null, ''] },
});
