import type { OutingCategory } from './explore-plan-projection.js';

/** Private save — venue (place) or scheduled activity the member wants to join later. */
export interface WishlistItemDTO {
  id: string;
  locationId?: string | null;
  activityId?: string | null;
  alertOnMatch?: boolean;
  watchOutingCategory?: OutingCategory | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
  createdAt?: string;
  location?: { id: string; name: string; images: string[]; activityType?: string | null } | null;
  activity?: { id: string; title: string; locationName: string | null } | null;
}

export type WishlistCheckDTO = {
  saved: boolean;
  wishlistItemId: string | null;
};

