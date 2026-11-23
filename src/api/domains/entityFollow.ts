import type { EntityFollowCheckDTO, EntityFollowDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

/** Follow a place, shop, or host brand — not member follow (`friendsApi`). */
export const entityFollowApi = {
  getMeEntityFollows: () => apiRequest<{ data: EntityFollowDTO[] }>('/me/entity-follows', { auth: true }),

  checkEntityFollow: (target: { locationId?: string; tenantId?: string; merchantId?: string }) => {
    const params = new URLSearchParams();
    if (target.locationId) params.set('locationId', target.locationId);
    if (target.tenantId) params.set('tenantId', target.tenantId);
    if (target.merchantId) params.set('merchantId', target.merchantId);
    return apiRequest<{ data: EntityFollowCheckDTO }>(
      `/me/entity-follows/check?${params.toString()}`,
      { auth: true }
    );
  },

  followEntity: (payload: { locationId?: string; tenantId?: string; merchantId?: string }) =>
    apiRequest<{ data: EntityFollowDTO }>('/me/entity-follows', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  unfollowEntity: (id: string) =>
    apiRequest(`/me/entity-follows/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
} as const;
