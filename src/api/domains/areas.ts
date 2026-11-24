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
  counts: { activities: number; places: number; availability: number };
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

/** @deprecated Public reads — use `destinationsApi` (`GET /destinations`). Admin CRUD below stays on `/admin/areas`. */
export const areasApi = {
  listPublishedAreas: () =>
    apiRequest<{ data: AreaPublicDTO[] }>('/destinations'),
  getAreaBySlug: async (slug: string) => {
    const res = await apiRequest<{
      data: { destination: AreaPublicDTO; counts: AreaDetailPayload['counts']; preview: AreaDetailPayload['preview'] };
    }>(`/destinations/${encodeURIComponent(slug)}`);
    return {
      data: {
        area: res.data.destination,
        counts: res.data.counts,
        preview: res.data.preview,
      },
    };
  },
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
