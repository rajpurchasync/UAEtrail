import { apiRequest } from '../client';
import type {
  ActivityDTO,
  AreaBoundsRing,
  AreaDTO,
  AreaPublicDTO,
  LocationDTO,
} from '@uaetrail/shared-types';

export type AreaDetailPayload = {
  area: AreaPublicDTO;
  counts: { activities: number; places: number; seeking: number };
  preview: {
    activities: ActivityDTO[];
    places: LocationDTO[];
    operators: Array<{
      id: string;
      name: string;
      slug: string;
      profileKind: 'agency' | 'pro_guide';
      path: string;
    }>;
  };
};

export const areasApi = {
  listPublishedAreas: () =>
    apiRequest<{ data: AreaPublicDTO[] }>('/areas'),
  getAreaBySlug: (slug: string) =>
    apiRequest<{ data: AreaDetailPayload }>(`/areas/${encodeURIComponent(slug)}`),
  listAdminAreas: () => apiRequest<{ data: AreaDTO[] }>('/admin/areas', { auth: true }),
  createAdminArea: (
    payload: Omit<AreaDTO, 'id' | 'createdAt' | 'updatedAt' | 'bounds'> & { bounds?: AreaBoundsRing }
  ) =>
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
