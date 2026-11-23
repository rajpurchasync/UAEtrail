import { listUserWishlistItems } from '../../lib/wishlist-store.js';

export type RecommendationWishlistContext = {
  locationIds: Set<string>;
  areaIds: Set<string>;
};

/** Plan-layer wishlist ids used to boost Discover map recommendations (signed-in only). */
export const loadRecommendationWishlistContext = async (
  viewerUserId: string | null | undefined
): Promise<RecommendationWishlistContext> => {
  const empty = { locationIds: new Set<string>(), areaIds: new Set<string>() };
  if (!viewerUserId) return empty;
  const rows = await listUserWishlistItems(viewerUserId);
  const locationIds = new Set<string>();
  const areaIds = new Set<string>();
  for (const row of rows) {
    if (row.locationId) locationIds.add(row.locationId);
    if (row.areaId) areaIds.add(row.areaId);
  }
  return { locationIds, areaIds };
};