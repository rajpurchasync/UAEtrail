import type { Location } from '../domain/types.js';

const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
};

const FILLABLE_KEYS: (keyof Location)[] = [
  'areaLabel',
  'areaId',
  'difficulty',
  'distance',
  'duration',
  'elevation',
  'accessibility',
  'childFriendly',
  'maxGroupSize',
  'campingType',
  'surfaceType',
  'accessibleBy',
  'season',
  'images',
  'parkingLat',
  'parkingLng',
  'parkingLink',
  'highlights',
  'tags',
];

/** Copy non-empty enriched fields into a location when the stored row is missing them. */
export const fillMissingLocationFields = (target: Location, source: Location): Location => {
  const next = { ...target };
  for (const key of FILLABLE_KEYS) {
    if (isEmpty(next[key]) && !isEmpty(source[key])) {
      (next as Record<string, unknown>)[key] = source[key];
    }
  }
  return next;
};
