import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export type ExploreMapQueryParams = {
  bbox?: string;
  cursor?: string | null;
  limit?: number;
  area?: string | null;
};

export const exploreApi = {
  getExploreMap: (params?: ExploreMapQueryParams) => {
    const search = new URLSearchParams();
    if (params?.bbox) search.set('bbox', params.bbox);
    if (params?.cursor) search.set('cursor', params.cursor);
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.area) search.set('area', params.area);
    const qs = search.toString();
    return apiRequest<{ data: { items: ExploreMapItemDTO[] } }>(
      qs ? `/explore/map?${qs}` : '/explore/map'
    );
  },

  /** Published seeking outings — activity-discovery read for people **Looking for** (optional auth). */
  getExploreSeekingActivities: () =>
    apiRequest<{ data: ExploreMapItemDTO[] }>('/explore/seeking-activities'),
} as const;
