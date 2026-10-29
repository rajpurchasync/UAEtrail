import {
  ActivityDTO,
  LocationDTO,
  PlaceDTO,
  LocationDetailResponse,
  LocationGuideDTO,
  LocationPremiumSummaryDTO,
} from '@uaetrail/shared-types';
import { apiRequest, downloadAuthenticatedFile } from '../client';
import { ADMIN_TABLE_PAGE_SIZE, LIST_PAGE_SIZE, fetchAllPages } from '../listAllPages';

const listAllPublicPlaces = async (countryCode?: string) => {
  const data = await fetchAllPages((page, pageSize) => {
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) });
    if (countryCode) params.set('countryCode', countryCode);
    return apiRequest<{ data: LocationDTO[]; meta?: { total: number } }>(`/places?${params.toString()}`);
  });
  return { data };
};

const getPlacesPage = (page = 1, pageSize = LIST_PAGE_SIZE, countryCode?: string) => {
  const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) });
  if (countryCode) params.set('countryCode', countryCode);
  return apiRequest<{ data: LocationDTO[]; meta?: { total: number } }>(`/places?${params.toString()}`);
};

/** Place API — public browse, premium, admin CRUD, host submission. */
export const placeApi = {
  getPublicPlaces: listAllPublicPlaces,
  getPlacesPage,
  getPublicPlaceDetail: (id: string) => apiRequest<LocationDetailResponse>(`/places/${id}`, { auth: true }),
  getPlaceGuide: (id: string) =>
    apiRequest<{ data: LocationGuideDTO }>(`/places/${id}/premium/guide`, { auth: true }),
  checkoutPlacePremium: (id: string) =>
    apiRequest<{
      data: {
        url?: string | null;
        sessionId?: string;
        alreadyUnlocked?: boolean;
        premium?: LocationPremiumSummaryDTO;
      };
      message?: string;
    }>(`/places/${id}/premium/checkout`, {
      method: 'POST',
      auth: true,
    }),
  downloadPlaceRouteMap: (id: string) => downloadAuthenticatedFile(`/places/${id}/premium/map/download`),
  downloadPlaceGuidePdf: (id: string) => downloadAuthenticatedFile(`/places/${id}/premium/guide/pdf`),
  getPlaceActivities: (placeId: string) =>
    apiRequest<{ data: ActivityDTO[] }>(`/places/${placeId}/activities`),
  getPopularPlaces: (limit = 6) => apiRequest<{ data: LocationDTO[] }>(`/places/popular?limit=${limit}`),
  trackPlaceView: (id: string) => apiRequest('/places/' + id + '/view', { method: 'POST' }),

  getAdminPlaces: (page = 1, pageSize = ADMIN_TABLE_PAGE_SIZE) =>
    apiRequest<{ data: LocationDTO[]; meta?: { total: number } }>(
      `/admin/places?page=${page}&pageSize=${pageSize}`,
      { auth: true }
    ),
  createAdminPlace: (payload: Partial<PlaceDTO>) =>
    apiRequest<{ data: PlaceDTO }>('/admin/places', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  updateAdminPlace: (id: string, payload: Partial<PlaceDTO>) =>
    apiRequest<{ data: PlaceDTO }>(`/admin/places/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),
  deleteAdminPlace: (id: string) =>
    apiRequest(`/admin/places/${id}`, {
      method: 'DELETE',
      auth: true,
    }),

  submitUserPlace: (payload: Partial<PlaceDTO>) =>
    apiRequest<{ data: PlaceDTO }>('/me/places', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  getMySubmittedPlaces: () => apiRequest<{ data: LocationDTO[] }>('/me/places', { auth: true }),
} as const;
