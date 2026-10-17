import { findWishlistItem, listWishlistItemsWithDetails } from '../lib/wishlist-store.js';

type WishlistRow = Awaited<ReturnType<typeof listWishlistItemsWithDetails>>[number];

export const toWishlistItemDto = (row: WishlistRow) => ({
  id: row.id,
  locationId: row.locationId,
  activityId: row.activityId,
  alertOnMatch: row.alertOnMatch,
  watchOutingCategory: row.watchOutingCategory,
  watchLatitude: row.watchLatitude,
  watchLongitude: row.watchLongitude,
  createdAt: row.createdAt.toISOString(),
  location: row.location
    ? {
        id: row.location.id,
        name: row.location.name,
        images: row.location.images,
      }
    : null,
  activity: row.activity
    ? { id: row.activity.id, title: row.activity.title, locationName: row.activity.locationName }
    : null,
});

export const listMeWishlist = async (userId: string) => {
  const rows = await listWishlistItemsWithDetails(userId);
  return rows.filter((row) => row.locationId || row.activityId).map(toWishlistItemDto);
};

export const checkMeWishlistTarget = async (input: {
  userId: string;
  locationId?: string;
  activityId?: string;
}) => {
  const item = await findWishlistItem({
    userId: input.userId,
    locationId: input.locationId,
    activityId: input.activityId,
    participantIntentId: undefined,
    productId: undefined,
    merchantId: undefined,
    tenantId: undefined,
    profileUserId: undefined,
  });
  return {
    saved: Boolean(item),
    wishlistItemId: item?.id ?? null,
  };
};
