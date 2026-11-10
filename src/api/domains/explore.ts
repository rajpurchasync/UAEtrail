import type { ExploreMapItemDTO, ExploreMapOverlayDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export type ExploreMapQueryParams = {
  bbox?: string;
  cursor?: string | null;
  limit?: number;
  area?: string | null;
  q?: string | null;
  country?: string | null;
  venue?: string | null;
};

const exploreMapSearch = (params?: ExploreMapQueryParams): string => {
  const search = new URLSearchParams();
  if (params?.bbox) search.set('bbox', params.bbox);
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.area) search.set('area', params.area);
  if (params?.q) search.set('q', params.q);
  if (params?.country) search.set('country', params.country);
  if (params?.venue) search.set('venue', params.venue);
  return search.toString();
};

export const exploreApi = {
  /** Public catalog — guest viewerAccess. Signed-in peek is `getExploreMapOverlay`. */
  getExploreMap: (params?: ExploreMapQueryParams) => {
    const qs = exploreMapSearch(params);
    return apiRequest<{ data: { items: ExploreMapItemDTO[] } }>(
      qs ? `/explore/map?${qs}` : '/explore/map'
    );
  },

  /** Per-viewer peek/engagement for the public map catalog. */
  getExploreMapOverlay: (params?: ExploreMapQueryParams) => {
    const qs = exploreMapSearch(params);
    return apiRequest<{ data: ExploreMapOverlayDTO }>(
      qs ? `/me/discover/overlay?${qs}` : '/me/discover/overlay',
      { auth: true }
    );
  },

  /** Published seeking outings — public catalog for people **Looking for**. */
  getExploreSeekingActivities: () =>
    apiRequest<{ data: ExploreMapItemDTO[] }>('/explore/seeking-activities'),
} as const;
