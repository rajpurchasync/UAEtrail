import type { OutingCategory } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import {
  createWishlistItem,
  deleteWishlistItemById,
  updateWishlistItem,
} from '../lib/wishlist-store.js';

export const createMeWishlistItem = async (input: {
  userId: string;
  locationId?: string;
  activityId?: string;
  alertOnMatch?: boolean;
  watchOutingCategory?: OutingCategory | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
}) => {
  const item = await createWishlistItem({
    userId: input.userId,
    locationId: input.locationId,
    activityId: input.activityId,
    participantIntentId: undefined,
    productId: undefined,
    merchantId: undefined,
    tenantId: undefined,
    profileUserId: undefined,
    alertOnMatch: input.alertOnMatch,
    watchOutingCategory: input.watchOutingCategory ?? null,
    watchLatitude: input.watchLatitude ?? null,
    watchLongitude: input.watchLongitude ?? null,
  });
  return {
    id: item.id,
    locationId: item.locationId,
    activityId: item.activityId,
    alertOnMatch: item.alertOnMatch,
    watchOutingCategory: item.watchOutingCategory,
    watchLatitude: item.watchLatitude,
    watchLongitude: item.watchLongitude,
    createdAt: item.createdAt.toISOString(),
  };
};

export const updateMeWishlistAlert = async (input: {
  id: string;
  userId: string;
  alertOnMatch: boolean;
}) => {
  const updated = await updateWishlistItem({
    id: input.id,
    userId: input.userId,
    alertOnMatch: input.alertOnMatch,
  });
  if (!updated) {
    throw new ApiError(404, 'wishlist_not_found', 'Wishlist item not found.');
  }
  return { id: updated.id, alertOnMatch: updated.alertOnMatch };
};

export const deleteMeWishlistItem = async (input: { id: string; userId: string }) => {
  await deleteWishlistItemById({ id: input.id, userId: input.userId });
};
