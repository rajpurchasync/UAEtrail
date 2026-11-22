import type { WishlistItemDTO } from '@uaetrail/shared-types';
import type { PlanHubWishlistLayer } from '../plan/planRouting';

/** Wishlist rows are private saves — seeking posts are never stored here. */
export const wishlistItemIsPersonal = (_item: WishlistItemDTO): boolean => true;

export const wishlistItemMatchesPlanWishlistLayer = (
  item: WishlistItemDTO,
  layer: PlanHubWishlistLayer
): boolean => {
  const isPlace = Boolean(item.locationId || item.areaId);
  const isOutingPlan = Boolean(item.activityId || item.activity);

  if (layer === 'places') return isPlace;
  if (layer === 'shops') return false;
  return isOutingPlan;
};
