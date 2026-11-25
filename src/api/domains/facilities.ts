import type { ActivityViewerAccessDTO, FacilityDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';
import { ADMIN_TABLE_PAGE_SIZE } from '../listAllPages';

export const facilityApi = {
  getPublicFacilityDetail: (id: string) =>
    apiRequest<{ data: FacilityDTO; viewerAccess: ActivityViewerAccessDTO }>(`/facilities/${id}`, {
      auth: true,
    }),

  submitUserFacility: (payload: {
    name: string;
    region: string;
    destinationId: string;
    placeHubLabel?: string | null;
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

  getAdminFacilities: (page = 1, pageSize = ADMIN_TABLE_PAGE_SIZE) =>
    apiRequest<{ data: FacilityDTO[]; meta?: { total: number } }>(
      `/admin/facilities?page=${page}&pageSize=${pageSize}`,
      { auth: true }
    ),

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

  submitFacilityAmenityReport: (
    facilityId: string,
    body: {
      amenityState: 'working' | 'not_working' | 'unknown';
      note?: string;
      photoUrl: string;
    }
  ) =>
    apiRequest<{ data: { id: string; status: string } }>(`/facilities/${facilityId}/condition-reports`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify(body),
    }),
} as const;
