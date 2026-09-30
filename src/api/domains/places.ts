import {
  ActivityDTO,
  LocationDTO,
  PlaceDTO,
  LocationDetailResponse,
  LocationGuideDTO,
  LocationPremiumSummaryDTO,
} from '@uaetrail/shared-types';
import { apiRequest, downloadAuthenticatedFile } from '../client';
import { organisationRequestHeaders } from '../orgHeaders';

const listAllPublicPlaces = async (countryCode?: string) => {
  const pageSize = 100;
  const all: LocationDTO[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (all.length < total && page <= 20) {
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) });
    if (countryCode) params.set('countryCode', countryCode);
    const response = await apiRequest<{ data: LocationDTO[]; meta?: { total: number } }>(
      `/places?${params.toString()}`
    );
    all.push(...response.data);
    total = response.meta?.total ?? response.data.length;
    if (response.data.length === 0) break;
    page += 1;
  }

  return { data: all };
};

const getPlacesPage = (page = 1, pageSize = 100, countryCode?: string) => {
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

  getAdminPlaces: () => apiRequest<{ data: LocationDTO[] }>('/admin/places?pageSize=250', { auth: true }),
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

  submitOrganisationPlace: (tenantId: string, payload: Partial<PlaceDTO>) =>
    apiRequest<{ data: PlaceDTO }>('/host/places', {
      method: 'POST',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify(payload),
    }),
  submitUserPlace: (payload: Partial<PlaceDTO>) =>
    apiRequest<{ data: PlaceDTO }>('/me/places', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  getMySubmittedPlaces: () => apiRequest<{ data: LocationDTO[] }>('/me/places', { auth: true }),
  /** Legacy `/me/locations` list — prefer {@link placeApi.getMySubmittedPlaces}. */
  getMySubmittedLocations: () => apiRequest<{ data: LocationDTO[] }>('/me/locations', { auth: true }),
  getOrganisationSubmittedPlaces: (tenantId: string) =>
    apiRequest<{ data: LocationDTO[] }>('/host/places', {
      auth: true,
      headers: organisationRequestHeaders(tenantId),
    }),

  /** Legacy HTTP path `/host/locations` — prefer {@link placeApi.submitOrganisationPlace}. */
  submitLocation: (tenantId: string, payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>('/host/locations', {
      method: 'POST',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify(payload),
    }),
  /** Legacy HTTP path `/me/locations` — prefer {@link placeApi.submitUserPlace}. */
  submitUserLocation: (payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>('/me/locations', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  /** Legacy HTTP path `/host/locations` — prefer {@link placeApi.getOrganisationSubmittedPlaces}. */
  getHostSubmittedLocations: (tenantId: string) =>
    apiRequest<{ data: LocationDTO[] }>('/host/locations', {
      auth: true,
      headers: organisationRequestHeaders(tenantId),
    }),
} as const;
