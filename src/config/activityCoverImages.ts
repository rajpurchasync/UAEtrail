/**
 * Default cover art for scheduled activities without uploaded photos.
 * Unsplash License — https://unsplash.com/license
 *
 * Three+ images per kind — UAE/GCC rocky hills, desert, and outdoor groups
 * (not alpine snow or temperate forest). Landing carousels cycle by index.
 */
import type { ScheduledActivityType } from '@uaetrail/shared-types';

const unsplashPhoto = (photoId: string, width = 800) =>
  `https://images.unsplash.com/${photoId}?w=${width}&fit=crop&q=80`;

/** Placeholder pools — at least three distinct images per activity kind. */
export const ACTIVITY_TYPE_COVER_IMAGE_POOLS: Record<ScheduledActivityType, readonly string[]> = {
  hiking: [
    unsplashPhoto('photo-1680425982087-9f6f25861db1'), // Jebel Jais ridges, RAK
    unsplashPhoto('photo-1646641678252-52aee3025261'), // Hatta Dam & Hajar mountains
    unsplashPhoto('photo-1683028135155-7638f285b662'), // Hajar mountains meet Gulf of Oman, Fujairah
  ],
  camping: [
    unsplashPhoto('photo-1509316785289-025f5b846b35'), // Desert rock formations, Sharjah
    unsplashPhoto('photo-1753703986788-2ac0aa05b728'), // Al Ain sand dunes
    unsplashPhoto('photo-1683028135155-7638f285b662'), // Dibba beach camp beneath Hajar peaks
  ],
  event: [
    unsplashPhoto('photo-1529156069898-49953e39b3ac'), // Outdoor community gathering
    unsplashPhoto('photo-1646641678252-52aee3025261'), // Hatta Dam group outing setting
    unsplashPhoto('photo-1753703986788-2ac0aa05b728'), // Desert sunset meetup dunes
  ],
  rideshare: [
    unsplashPhoto('photo-1449965408869-eaa3f722e40d'), // Car on open road
    unsplashPhoto('photo-1680425982087-9f6f25861db1'), // Jebel Jais winding mountain road
    unsplashPhoto('photo-1753703986788-2ac0aa05b728'), // Desert highway dunes
  ],
};

const pickFromPool = (pool: readonly string[], key: string): string => {
  if (pool.length === 1) return pool[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
};

/** Prefer uploaded photos; otherwise pick a kind-specific placeholder from the pool. */
export const resolveActivityTypeCoverImage = (
  activityType: ScheduledActivityType,
  uploadedImages?: string[] | null,
  options?: { activityId?: string; variantIndex?: number }
): string => {
  const uploaded = uploadedImages?.find((url) => typeof url === 'string' && url.trim().length > 0);
  if (uploaded) return uploaded.trim();

  const pool = ACTIVITY_TYPE_COVER_IMAGE_POOLS[activityType];
  if (pool.length === 0) return '';

  if (options?.variantIndex !== undefined) {
    return pool[options.variantIndex % pool.length];
  }

  if (options?.activityId) {
    return pickFromPool(pool, options.activityId);
  }

  return pool[0];
};
