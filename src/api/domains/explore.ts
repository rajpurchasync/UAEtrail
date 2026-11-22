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
  /** Slim list projection vs default pin projection. */
  projection?: 'list';
  /** Comma-separated map sources (home map filter). Omitted = full catalog. */
  sources?: string;
  /** When true, sends `includeRideshare=1` on the wire. */
  includeRideshare?: boolean;
};

/** Canonical query string for `GET /explore/map` and overlay (shared filters). */
export const buildExploreMapQueryString = (params?: ExploreMapQueryParams): string => {
  const search = new URLSearchParams();
  if (params?.bbox) search.set('bbox', params.bbox);
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.area) search.set('area', params.area);
  if (params?.q) search.set('q', params.q);
  if (params?.country) search.set('country', params.country);
  if (params?.venue) search.set('venue', params.venue);
  if (params?.projection) search.set('projection', params.projection);
  if (params?.sources) search.set('sources', params.sources);
  if (params?.includeRideshare) search.set('includeRideshare', '1');
  return search.toString();
};

export const exploreMapHttpPath = (params?: ExploreMapQueryParams): string => {
  const qs = buildExploreMapQueryString(params);
  return qs ? `/explore/map?${qs}` : '/explore/map';
};

const exploreOverlayHttpPath = (params?: ExploreMapQueryParams): string => {
  const qs = buildExploreMapQueryString(params);
  return qs ? `/me/discover/overlay?${qs}` : '/me/discover/overlay';
};

export const exploreApi = {
  /** Public catalog — guest viewerAccess. Signed-in peek is `getExploreMapOverlay`. */
  getExploreMap: (params?: ExploreMapQueryParams) =>
    apiRequest<{ data: { items: ExploreMapItemDTO[] } }>(exploreMapHttpPath(params)),

  /** Per-viewer peek/engagement for the public map catalog. */
  getExploreMapOverlay: (params?: ExploreMapQueryParams) =>
    apiRequest<{ data: ExploreMapOverlayDTO }>(exploreOverlayHttpPath(params), { auth: true }),
} as const;