import type { ExploreMapItemDTO, ExploreMapOverlayDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { apiRequestConditional, getStoredSession } from '../api/client';
import { applyExploreMapOverlay } from '../explore/applyExploreMapOverlay';

export type ConditionalCatalog<T> =
  | { notModified: true; etag: string | null }
  | { notModified: false; etag: string | null; data: T };

export const fetchExploreMapOverlayIfSignedIn = async (params?: {
  bbox?: string;
  area?: string | null;
}): Promise<ExploreMapOverlayDTO | null> => {
  if (!getStoredSession()) return null;
  try {
    const res = await api.getExploreMapOverlay({
      bbox: params?.bbox,
      area: params?.area ?? undefined,
    });
    return res.data;
  } catch {
    return null;
  }
};

export const fetchExploreMapItems = async (
  params?: {
    bbox?: string;
    area?: string | null;
    projection?: 'list';
  },
  etag?: string | null
): Promise<ConditionalCatalog<ExploreMapItemDTO[]>> => {
  const search = new URLSearchParams();
  if (params?.bbox) search.set('bbox', params.bbox);
  if (params?.area) search.set('area', params.area);
  if (params?.projection) search.set('projection', params.projection);
  const qs = search.toString();
  const unscoped = !params?.bbox && !params?.area && !params?.projection;
  const result = await apiRequestConditional<{ data: { items: ExploreMapItemDTO[] } }>(
    qs ? `/explore/map?${qs}` : '/explore/map',
    { etag: unscoped ? etag : null }
  );
  if (result.notModified) return { notModified: true, etag: result.etag };
  const overlay = await fetchExploreMapOverlayIfSignedIn(params);
  return {
    notModified: false,
    etag: result.etag,
    data: applyExploreMapOverlay(result.body.data.items, overlay),
  };
};
