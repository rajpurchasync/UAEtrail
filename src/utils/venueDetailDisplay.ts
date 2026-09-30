import type { Season } from '../types';
import { placeDetailPath, venueLocationPath } from './placePaths';

export { placeDetailPath, venueLocationPath };

const NAME_AR_TAG_PREFIX = 'name-ar:';
const NAME_EN_TAG_PREFIX = 'name-en:';

/** English label on venue catalog tags (`name-en:…`). */
export const readPlaceEnglishName = (tags?: string[] | null): string | null => {
  if (!tags) return null;
  const entry = tags.find((tag) => tag.startsWith(NAME_EN_TAG_PREFIX));
  if (!entry) return null;
  const value = entry.slice(NAME_EN_TAG_PREFIX.length).trim();
  return value.length >= 2 ? value : null;
};

/** Arabic label on venue catalog tags (`name-ar:…`). */
export const readPlaceArabicName = (tags?: string[] | null): string | null => {
  if (!tags) return null;
  const entry = tags.find((tag) => tag.startsWith(NAME_AR_TAG_PREFIX));
  if (!entry) return null;
  const value = entry.slice(NAME_AR_TAG_PREFIX.length).trim();
  return value.length >= 2 ? value : null;
};

export const resolvePlaceDisplayTitle = (storedName: string, tags?: string[] | null): string =>
  readPlaceEnglishName(tags) || storedName.trim() || 'Place';

/** Auto-set on submit — not meaningful place metadata from contributors. */
export const isDefaultPlaceSeason = (season?: Season[]): boolean =>
  !season?.length || (season.length === 1 && season[0] === 'year-round');

/** @deprecated Use isDefaultPlaceSeason */
export const isDefaultVenueSeason = isDefaultPlaceSeason;

export const hasPositiveNumber = (value?: number | null): value is number =>
  value != null && value > 0;
