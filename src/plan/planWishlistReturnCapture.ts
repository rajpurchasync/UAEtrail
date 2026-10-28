import { captureLeavingView, viewReturnPathKey } from '../utils/viewReturnMemory';

export const planWishlistSavedFocusId = (wishlistItemId: string): string =>
  `plan-wishlist-saved-${wishlistItemId}`;

export const planWishlistMatchFocusId = (wishlistItemId: string): string =>
  `plan-wishlist-match-${wishlistItemId}`;

/** Call before navigating to entity detail — snapshot scroll while Plan list is still mounted. */
export const capturePlanWishlistViewReturn = (pathname: string, search: string): void => {
  captureLeavingView(viewReturnPathKey(pathname, search));
};
