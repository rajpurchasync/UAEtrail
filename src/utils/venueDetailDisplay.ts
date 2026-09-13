import type { Season } from '../types';
import { placeDetailPath, venueLocationPath } from './placePaths';

export { placeDetailPath, venueLocationPath };

/** Auto-set on submit — not meaningful place metadata from contributors. */
export const isDefaultPlaceSeason = (season?: Season[]): boolean =>
  !season?.length || (season.length === 1 && season[0] === 'year-round');

/** @deprecated Use isDefaultPlaceSeason */
export const isDefaultVenueSeason = isDefaultPlaceSeason;

export const hasPositiveNumber = (value?: number | null): value is number =>
  value != null && value > 0;
