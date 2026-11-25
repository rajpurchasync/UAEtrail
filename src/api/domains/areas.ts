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

/** Admin destination CRUD (`/admin/destinations`; `/admin/areas` API compat). */
export const areasApi = {
  listAdminAreas: () => apiRequest<{ data: AreaDTO[] }>('/admin/destinations', { auth: true }),
  createAdminArea: (
    payload: Omit<AreaDTO, 'id' | 'createdAt' | 'updatedAt' | 'bounds'> & { bounds?: AreaBoundsRing }
  ) =>
    apiRequest<{ data: AreaDTO }>('/admin/destinations', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  updateAdminArea: (id: string, payload: Partial<AreaDTO>) =>
    apiRequest<{ data: AreaDTO }>(`/admin/destinations/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),
  deleteAdminArea: (id: string) =>
    apiRequest(`/admin/destinations/${id}`, { method: 'DELETE', auth: true }),
};