import type { WishlistItemDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

/** Private venue and activity saves (`GET/POST /me/wishlist`). */
export const wishlistApi = {
  getMeWishlist: () => apiRequest<{ data: WishlistItemDTO[] }>('/me/wishlist', { auth: true }),

  checkWishlist: (target: { locationId?: string; destinationId?: string; activityId?: string }) => {
    const params = new URLSearchParams();
    if (target.locationId) params.set('locationId', target.locationId);
    if (target.destinationId) params.set('destinationId', target.destinationId);
    if (target.activityId) params.set('activityId', target.activityId);
    return apiRequest<{ data: { saved: boolean; wishlistItemId: string | null } }>(
      `/me/wishlist/check?${params.toString()}`,
      { auth: true }
    );
  },

  addWishlistItem: (payload: {
    locationId?: string;
    destinationId?: string;
    activityId?: string;
    alertOnMatch?: boolean;
    watchOutingCategory?: string | null;
    watchLatitude?: number | null;
    watchLongitude?: number | null;
  }) =>
    apiRequest<{ data: WishlistItemDTO }>('/me/wishlist', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  removeWishlistItem: (id: string) =>
    apiRequest(`/me/wishlist/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),

  patchWishlistAlerts: (id: string, alertOnMatch: boolean) =>
    apiRequest<{ data: { id: string; alertOnMatch: boolean } }>(
      `/me/wishlist/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ alertOnMatch }),
      }
    ),
} as const;
