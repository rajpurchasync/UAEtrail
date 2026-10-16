import type { ActivityViewerAccessDTO, FacilityDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const facilityApi = {
  getPublicFacilityDetail: (id: string) =>
    apiRequest<{ data: FacilityDTO; viewerAccess: ActivityViewerAccessDTO }>(`/facilities/${id}`, {
      auth: true,
    }),

  submitUserFacility: (payload: {
    name: string;
    region: string;
    areaId: string;
    areaLabel?: string | null;
    facilityKind: FacilityDTO['facilityKind'];
    parentPlaceId?: string | null;
    description: string;
    latitude?: number;
    longitude?: number;
    images: string[];
    countryCode?: string;
    activityType?: string;
    emirate?: string;
  }) =>
    apiRequest<{ data: FacilityDTO }>('/me/facilities', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  getAdminFacilities: () =>
    apiRequest<{ data: FacilityDTO[] }>('/admin/facilities?pageSize=250', { auth: true }),

  createAdminFacility: (payload: Partial<FacilityDTO> & { facilityKind: FacilityDTO['facilityKind'] }) =>
    apiRequest<{ data: FacilityDTO }>('/admin/facilities', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  updateAdminFacility: (id: string, payload: Partial<FacilityDTO>) =>
    apiRequest<{ data: FacilityDTO }>(`/admin/facilities/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),

  deleteAdminFacility: (id: string) =>
    apiRequest(`/admin/facilities/${id}`, { method: 'DELETE', auth: true }),
} as const;
