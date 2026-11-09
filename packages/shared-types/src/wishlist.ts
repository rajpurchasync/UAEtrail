import type { OutingCategory } from './explore-plan-projection.js';

/** Private save — venue (place), curated area, or scheduled activity the member wants to join later. */
export interface WishlistItemDTO {
  id: string;
  locationId?: string | null;
  areaId?: string | null;
  activityId?: string | null;
  alertOnMatch?: boolean;
  watchOutingCategory?: OutingCategory | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
  createdAt?: string;
  location?: { id: string; name: string; images: string[]; activityType: string } | null;
  area?: { id: string; slug: string; name: string; imageUrl?: string | null } | null;
  activity?: { id: string; title: string; locationName: string | null; activityType: string } | null;
}

export type WishlistCheckDTO = {
  saved: boolean;
  wishlistItemId: string | null;
};

