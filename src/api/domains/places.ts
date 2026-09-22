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

  /** @deprecated Use {@link placeApi.getPublicPlaces} */
  getPublicLocations: listAllPublicPlaces,
  /** @deprecated Use {@link placeApi.getPlacesPage} */
  getLocationsPage: getPlacesPage,
  /** @deprecated Use {@link placeApi.getPublicPlaceDetail} */
  getPublicLocationDetail: (id: string) => apiRequest<LocationDetailResponse>(`/places/${id}`, { auth: true }),
  /** @deprecated Use {@link placeApi.getPlaceGuide} */
  getLocationGuide: (id: string) =>
    apiRequest<{ data: LocationGuideDTO }>(`/places/${id}/premium/guide`, { auth: true }),
  /** @deprecated Use {@link placeApi.checkoutPlacePremium} */
  checkoutLocationPremium: (id: string) =>
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
  /** @deprecated Use {@link placeApi.downloadPlaceRouteMap} */
  downloadLocationRouteMap: (id: string) => downloadAuthenticatedFile(`/places/${id}/premium/map/download`),
  /** @deprecated Use {@link placeApi.downloadPlaceGuidePdf} */
  downloadLocationGuidePdf: (id: string) => downloadAuthenticatedFile(`/places/${id}/premium/guide/pdf`),
  /** @deprecated Use {@link placeApi.getPlaceActivities} */
  getLocationActivities: (placeId: string) =>
    apiRequest<{ data: ActivityDTO[] }>(`/places/${placeId}/activities`),
  /** @deprecated Use {@link placeApi.getPopularPlaces} */
  getPopularLocations: (limit = 6) => apiRequest<{ data: LocationDTO[] }>(`/places/popular?limit=${limit}`),
  /** @deprecated Use {@link placeApi.trackPlaceView} */
  trackLocationView: (id: string) => apiRequest('/places/' + id + '/view', { method: 'POST' }),

  getAdminPlaces: () => apiRequest<{ data: LocationDTO[] }>('/admin/places?pageSize=100', { auth: true }),
  /** @deprecated Use {@link placeApi.getAdminPlaces} */
  getAdminLocations: () => apiRequest<{ data: LocationDTO[] }>('/admin/locations?pageSize=100', { auth: true }),
  createAdminPlace: (payload: Partial<PlaceDTO>) =>
    apiRequest<{ data: PlaceDTO }>('/admin/places', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  /** @deprecated Use {@link placeApi.createAdminPlace} */
  createAdminLocation: (payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>('/admin/locations', {
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
  /** @deprecated Use {@link placeApi.updateAdminPlace} */
  updateAdminLocation: (id: string, payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>(`/admin/locations/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),
  submitHostPlace: (tenantId: string, payload: Partial<PlaceDTO>) =>
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
  getHostSubmittedPlaces: (tenantId: string) =>
    apiRequest<{ data: LocationDTO[] }>('/host/places', {
      auth: true,
      headers: organisationRequestHeaders(tenantId),
    }),
  /** @deprecated Use {@link placeApi.submitHostPlace} */
  submitLocation: (tenantId: string, payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>('/host/locations', {
      method: 'POST',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify(payload),
    }),
  /** @deprecated Use {@link placeApi.submitUserPlace} */
  submitUserLocation: (payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>('/me/locations', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  /** @deprecated Use {@link placeApi.getMySubmittedPlaces} */
  getMySubmittedLocations: () => apiRequest<{ data: LocationDTO[] }>('/me/locations', { auth: true }),
  /** @deprecated Use {@link placeApi.getHostSubmittedPlaces} */
  getHostSubmittedLocations: (tenantId: string) =>
    apiRequest<{ data: LocationDTO[] }>('/host/locations', {
      auth: true,
      headers: organisationRequestHeaders(tenantId),
    }),
  deleteAdminPlace: (id: string) =>
    apiRequest(`/admin/places/${id}`, {
      method: 'DELETE',
      auth: true,
    }),
  /** @deprecated Use {@link placeApi.deleteAdminPlace} */
  deleteAdminLocation: (id: string) =>
    apiRequest(`/admin/locations/${id}`, {
      method: 'DELETE',
      auth: true,
    }),
} as const;
