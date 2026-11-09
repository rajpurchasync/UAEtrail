import type {
  GeoRef,
  GeoSummaryDTO,
  GeoTreeDTO,
  SubmissionCandidate,
  SubmissionPublicDTO,
} from '@uaetrail/shared-types';
import { apiRequest, apiRequestConditional } from '../client';

export const GEO_CATALOG_PAGE_SIZE = 20;

export type GeoCatalogListQuery = {
  cursor?: string;
  limit?: number;
  type?: string;
  kind?: string;
};

export type GeoCatalogPlaceItem = {
  _id: string;
  name?: string;
  activityType?: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
  slug?: string;
  geoRef?: GeoRef | null;
};

export type GeoCatalogActivityItem = {
  _id: string;
  title?: string;
  activityType?: string;
  images?: string[];
  bannerUrl?: string | null;
  startAt?: string;
  meetingLat?: number;
  meetingLng?: number;
  startLat?: number;
  startLng?: number;
  geoRef?: GeoRef | null;
};

const geoListPath = (id: string, suffix: string, q?: GeoCatalogListQuery) => {
  const search = new URLSearchParams();
  if (q?.cursor) search.set('cursor', q.cursor);
  if (q?.limit) search.set('limit', String(q.limit));
  if (q?.type) search.set('type', q.type);
  if (q?.kind) search.set('kind', q.kind);
  const qs = search.toString();
  return `/geo/${encodeURIComponent(id)}/${suffix}${qs ? `?${qs}` : ''}`;
};

export const geoHierarchyApi = {
  getGeoTree: () => apiRequest<{ data: GeoTreeDTO }>('/geo/tree'),
  getGeoTreeConditional: (etag?: string | null) =>
    apiRequestConditional<{ data: GeoTreeDTO }>('/geo/tree', { etag }),
  getGeoSummary: (idOrPath: string) =>
    apiRequest<{ data: GeoSummaryDTO }>(`/geo/${encodeURIComponent(idOrPath)}/summary`),
  listGeoActivities: (id: string, q?: GeoCatalogListQuery) =>
    apiRequest<{
      data: {
        items: GeoCatalogActivityItem[];
        nextCursor: string | null;
      };
    }>(geoListPath(id, 'activities', q)),
  listGeoPlaces: (id: string, q?: GeoCatalogListQuery) =>
    apiRequest<{
      data: {
        items: GeoCatalogPlaceItem[];
        nextCursor: string | null;
      };
    }>(geoListPath(id, 'places', q)),
  listGeoFacilities: (id: string, q?: GeoCatalogListQuery) =>
    apiRequest<{ data: { items: Array<{ _id: string; name?: string }>; nextCursor: string | null } }>(
      geoListPath(id, 'facilities', q)
    ),
  getGeoCounts: (ids: string[]) =>
    apiRequest<{ data: Record<string, { fac?: Record<string, number>; pl?: Record<string, number>; act?: Record<string, number> }> }>(
      `/geo/counts?ids=${encodeURIComponent(ids.join(','))}`
    ),
  resolveGeo: (lat: number, lng: number) =>
    apiRequest<{ data: { geoRef: unknown; needsReview: boolean } }>(
      `/geo/resolve?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`
    ),
  listSubmissionCandidates: (q: {
    kind: string;
    lat: number;
    lng: number;
    name?: string;
    facilityType?: string;
    phone?: string;
    website?: string;
  }) => {
    const search = new URLSearchParams({
      kind: q.kind,
      lat: String(q.lat),
      lng: String(q.lng),
    });
    if (q.name) search.set('name', q.name);
    if (q.facilityType) search.set('facilityType', q.facilityType);
    if (q.phone) search.set('phone', q.phone);
    if (q.website) search.set('website', q.website);
    return apiRequest<{ data: SubmissionCandidate[] }>(`/me/submissions/candidates?${search}`, { auth: true });
  },
  createSubmission: (body: Record<string, unknown>) =>
    apiRequest<{ data: SubmissionPublicDTO }>('/me/submissions', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(body),
    }),
  secondSubmission: (id: string) =>
    apiRequest<{ data: { id: string; seconded: number } }>(`/me/submissions/${encodeURIComponent(id)}/second`, {
      method: 'POST',
      auth: true,
    }),
  listAdminSubmissions: () =>
    apiRequest<{ data: Array<SubmissionPublicDTO & { insisted?: { reason: string }; submittedBy: string }> }>(
      '/admin/submissions',
      { auth: true }
    ),
  reviewAdminSubmission: (id: string, action: 'approve' | 'reject' | 'merge', reason?: string) =>
    apiRequest<{ data: { id: string; status: string } }>(`/admin/submissions/${id}/review`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ action, reason }),
    }),
};
