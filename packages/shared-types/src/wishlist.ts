import type { OutingCategory } from './explore-plan-projection.js';

/** Private save — venue (place), curated destination hub, or scheduled activity. */
export interface WishlistItemDTO {
  id: string;
  locationId?: string | null;
  destinationId?: string | null;
  activityId?: string | null;
  alertOnMatch?: boolean;
  watchOutingCategory?: OutingCategory | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
  createdAt?: string;
  location?: { id: string; name: string; images: string[]; activityType: string } | null;
  destination?: { id: string; slug: string; name: string; imageUrl?: string | null } | null;
  activity?: { id: string; title: string; locationName: string | null; activityType: string } | null;
}

export type WishlistCheckDTO = {
  saved: boolean;
  wishlistItemId: string | null;
};