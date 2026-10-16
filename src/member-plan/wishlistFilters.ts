import type { WishlistItemDTO } from '@uaetrail/shared-types';
import type { PlanHubWishlistLayer } from './planHubRouting';
import { wishlistItemIsDemandBookmark } from './wishlistDemandBookmark';

/** Personal wishlist — never demand participation bookmarks. */
export const wishlistItemIsPersonal = (item: WishlistItemDTO): boolean => !wishlistItemIsDemandBookmark(item);

export const wishlistItemMatchesPlanWishlistLayer = (
  item: WishlistItemDTO,
  layer: PlanHubWishlistLayer
): boolean => {
  if (!wishlistItemIsPersonal(item)) return false;

  const isPlace = Boolean(item.locationId);
  const isOutingPlan = Boolean(item.activityId || item.activity);

  if (layer === 'places') return isPlace;
  if (layer === 'shops') return false;
  return isOutingPlan;
};

/** @deprecated Use {@link wishlistItemMatchesPlanWishlistLayer}. */
export const wishlistItemMatchesTripsHubLayer = wishlistItemMatchesPlanWishlistLayer;
