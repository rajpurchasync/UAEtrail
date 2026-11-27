import type { EntityFollowCheckDTO, EntityFollowDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const entityFollowApi = {
  getMeEntityFollows: () => apiRequest<{ data: EntityFollowDTO[] }>('/me/entity-follows', { auth: true }),

  checkEntityFollow: (target: { locationId?: string; tenantId?: string; shopId?: string }) => {
    const params = new URLSearchParams();
    if (target.locationId) params.set('locationId', target.locationId);
    if (target.tenantId) params.set('tenantId', target.tenantId);
    if (target.shopId) params.set('shopId', target.shopId);
    const q = params.toString();
    return apiRequest<{ data: EntityFollowCheckDTO }>(
      `/me/entity-follows/check${q ? `?${q}` : ''}`,
      { auth: true }
    );
  },

  followEntity: (payload: { locationId?: string; tenantId?: string; shopId?: string }) =>
    apiRequest<{ data: EntityFollowDTO }>('/me/entity-follows', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  unfollowEntity: (followId: string) =>
    apiRequest<{ ok: boolean }>(`/me/entity-follows/${encodeURIComponent(followId)}`, {
      method: 'DELETE',
      auth: true,
    }),
} as const;