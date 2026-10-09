import { apiRequest } from '../client';
import type { AreaDTO, AreaPublicDTO } from '@uaetrail/shared-types';

export type AreaDetailPayload = {
  area: AreaPublicDTO;
  counts: { activities: number; places: number; seeking: number };
};

export const areasApi = {
  listPublishedAreas: () =>
    apiRequest<{ data: AreaPublicDTO[] }>('/areas'),
  getAreaBySlug: (slug: string) =>
    apiRequest<{ data: AreaDetailPayload }>(`/areas/${encodeURIComponent(slug)}`),
  listAdminAreas: () => apiRequest<{ data: AreaDTO[] }>('/admin/areas', { auth: true }),
  createAdminArea: (payload: Omit<AreaDTO, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiRequest<{ data: AreaDTO }>('/admin/areas', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  updateAdminArea: (id: string, payload: Partial<AreaDTO>) =>
    apiRequest<{ data: AreaDTO }>(`/admin/areas/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),
  deleteAdminArea: (id: string) =>
    apiRequest(`/admin/areas/${id}`, { method: 'DELETE', auth: true }),
};
