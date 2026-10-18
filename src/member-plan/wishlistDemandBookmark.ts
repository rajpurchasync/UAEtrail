/**
 * Demand vs wishlist — do not mix.
 *
 * **Demand (Looking for):** Public participation on Explore (`activities` with `activityMode: seeking`).
 * Create, discover, message, host-fulfill — not stored as wishlist rows.
 *
 * **Wishlist:** Private venue + activity saves (`GET/POST /me/wishlist`) with optional
 * match alerts when new public plans appear nearby.
 */

import type { WishlistItemDTO } from '@uaetrail/shared-types';
import { activityDetailPath, placeDetailPath } from '@uaetrail/shared-types';

/** Demand is never wishlist — API rejects demand targets on create. */
export const wishlistItemIsDemandBookmark = (_item: WishlistItemDTO): boolean => false;

export const wishlistItemTitle = (item: WishlistItemDTO): string => {
  const fromActivity = item.activity?.title?.trim();
  if (fromActivity) return fromActivity;
  const fromPlace = item.location?.name?.trim();
  if (fromPlace) return fromPlace;
  return 'Saved item';
};

export const resolveWishlistItemPath = (item: WishlistItemDTO): string | null => {
  const activityId = item.activityId ?? item.activity?.id;
  if (activityId) return activityDetailPath(activityId);
  const placeId = item.locationId ?? item.location?.id;
  if (placeId) {
    const activityType = item.location?.activityType ?? 'hiking';
    return placeDetailPath(activityType, placeId);
  }
  return null;
};
