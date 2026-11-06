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
  // Bearer required for optionalAuth — without it the API keeps the guest 3+3 catalog cap.
  const mapPromise = apiRequestConditional<{ data: { items: ExploreMapItemDTO[] } }>(
    qs ? `/explore/map?${qs}` : '/explore/map',
    { etag: unscoped ? etag : null, auth: true }
  );
  const overlayPromise = fetchExploreMapOverlayIfSignedIn(params);
  const [result, overlay] = await Promise.all([mapPromise, overlayPromise]);
  if (result.notModified) return { notModified: true, etag: result.etag };
  return {
    notModified: false,
    etag: result.etag,
    data: applyExploreMapOverlay(result.body.data.items, overlay),
  };
};
