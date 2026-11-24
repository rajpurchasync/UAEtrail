import type { OutingCategory } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findPublishedAreaById } from '../lib/areas-store.js';
import {
  createWishlistItem,
  deleteWishlistItemById,
  updateWishlistItem,
} from '../lib/wishlist-store.js';

export const createMeWishlistItem = async (input: {
  userId: string;
  locationId?: string;
  destinationId?: string;
  activityId?: string;
  alertOnMatch?: boolean;
  watchOutingCategory?: OutingCategory | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
}) => {
  let watchLatitude = input.watchLatitude ?? null;
  let watchLongitude = input.watchLongitude ?? null;
  if (input.destinationId) {
    const area = await findPublishedAreaById(input.destinationId);
    if (!area) {
      throw new ApiError(404, 'destination_not_found', 'Published destination not found.');
    }
    if (watchLatitude == null || watchLongitude == null) {
      watchLatitude = area.center.latitude;
      watchLongitude = area.center.longitude;
    }
  }

  const item = await createWishlistItem({
    userId: input.userId,
    locationId: input.locationId,
    destinationId: input.destinationId,
    activityId: input.activityId,
    alertOnMatch: input.alertOnMatch,
    watchOutingCategory: input.watchOutingCategory ?? null,
    watchLatitude,
    watchLongitude,
  });
  return {
    id: item.id,
    locationId: item.locationId,
    destinationId: item.destinationId,
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
