/**
 * Wishlist display helpers.
 *
 * Seeking posts (`activityMode: seeking`) are public map participation — never wishlist rows.
 * Wishlist is private venue + activity saves (`GET/POST /me/wishlist`) with optional nearby alerts.
 */

import type { WishlistItemDTO } from '@uaetrail/shared-types';
import { activityDetailPath, placeDetailPath } from '@uaetrail/shared-types';

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
