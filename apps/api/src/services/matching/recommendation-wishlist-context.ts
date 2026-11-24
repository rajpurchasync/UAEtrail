import { listUserWishlistItems } from '../../lib/wishlist-store.js';

export type RecommendationWishlistContext = {
  locationIds: Set<string>;
  destinationIds: Set<string>;
};

export const loadRecommendationWishlistContext = async (
  userId: string
): Promise<RecommendationWishlistContext> => {
  const empty = { locationIds: new Set<string>(), destinationIds: new Set<string>() };
  const rows = await listUserWishlistItems(userId);
  if (rows.length === 0) return empty;
  const locationIds = new Set<string>();
  const destinationIds = new Set<string>();
  for (const row of rows) {
    if (row.locationId) locationIds.add(row.locationId);
    if (row.destinationId) destinationIds.add(row.destinationId);
  }
  return { locationIds, destinationIds };
};