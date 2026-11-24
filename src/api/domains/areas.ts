import { apiRequest } from '../client';
import type {
  ActivityDTO,
  AreaBoundsRing,
  AreaDTO,
  DestinationPublicDTO,
  LocationDTO,
} from '@uaetrail/shared-types';

export type AreaDetailPayload = {
  destination: DestinationPublicDTO;
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

/** Admin destination CRUD (`/admin/areas` store until admin route rename). */
export const areasApi = {
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