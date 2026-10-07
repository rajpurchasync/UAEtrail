import type { FavoriteDTO } from '@uaetrail/shared-types';
import type { TripsHubLayer } from './tripsRouting';
import { favoriteIsDemandBookmark } from './favoriteDemandBookmark';

/** Personal wishlist (intent + alerts) — never demand participation bookmarks. */
export const favoriteIsPersonalWishlist = (item: FavoriteDTO): boolean => !favoriteIsDemandBookmark(item);

export const favoriteMatchesTripsHubLayer = (item: FavoriteDTO, layer: TripsHubLayer): boolean => {
  if (!favoriteIsPersonalWishlist(item)) return false;

  const isPlace = Boolean(item.locationId);
  const isShop = Boolean(item.merchantId || item.tenantId || item.productId);
  const isOutingPlan = Boolean(item.activityId || item.activity || item.event);

  if (layer === 'places') return isPlace;
  if (layer === 'shops') return isShop;
  return isOutingPlan || (!isPlace && !isShop && Boolean(item.profileUserId));
};
