import { apiRequest } from '../client';
import type {
  ActivityDTO,
  AreaBoundsRing,
  AreaDTO,
  DestinationPublicDTO,
  LocationDTO,
} from '@uaetrail/shared-types';

export type DestinationDetailPayload = {
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

export const destinationsApi = {
  listPublishedDestinations: () =>
    apiRequest<{ data: DestinationPublicDTO[] }>('/destinations'),
  getDestinationBySlug: (slug: string) =>
    apiRequest<{ data: DestinationDetailPayload }>(
      `/destinations/${encodeURIComponent(slug)}`
    ),
  listAdminDestinations: () => apiRequest<{ data: AreaDTO[] }>('/admin/destinations', { auth: true }),
  createAdminDestination: (
    payload: Omit<AreaDTO, 'id' | 'createdAt' | 'updatedAt' | 'bounds'> & { bounds?: AreaBoundsRing }
  ) =>
    apiRequest<{ data: AreaDTO }>('/admin/destinations', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  updateAdminDestination: (id: string, payload: Partial<AreaDTO>) =>
    apiRequest<{ data: AreaDTO }>(`/admin/destinations/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),
  deleteAdminDestination: (id: string) =>
    apiRequest(`/admin/destinations/${id}`, { method: 'DELETE', auth: true }),
};

export type { ActivityDTO, LocationDTO };