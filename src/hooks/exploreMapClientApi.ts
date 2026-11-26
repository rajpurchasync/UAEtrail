import type { ExploreMapItemDTO, ExploreMapOverlayDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { apiRequestConditional, getStoredSession } from '../api/client';
import { type ExploreMapQueryParams, exploreMapHttpPath } from '../api/domains/explore';
import { applyExploreMapOverlay } from '../discovery/discoveryPortExploreMapOverlay';

export type ConditionalCatalog<T> =
  | { notModified: true; etag: string | null }
  | { notModified: false; etag: string | null; data: T };

export const fetchExploreMapOverlayIfSignedIn = async (
  params?: Pick<ExploreMapQueryParams, 'bbox' | 'destination'>
): Promise<ExploreMapOverlayDTO | null> => {
  if (!getStoredSession()) return null;
  try {
    const res = await api.getExploreMapOverlay({
      bbox: params?.bbox,
      destination: params?.destination ?? undefined,
    });
    return res.data;
  } catch {
    return null;
  }
};

export const fetchExploreMapItems = async (
  params?: ExploreMapQueryParams,
  etag?: string | null
): Promise<ConditionalCatalog<ExploreMapItemDTO[]>> => {
  const path = exploreMapHttpPath(params);
  const unscoped = !params?.bbox && !params?.destination && !params?.projection && !params?.sources;
  // Bearer required for optionalAuth — without it the API keeps the guest 3+3 catalog cap.
  const mapPromise = apiRequestConditional<{ data: { items: ExploreMapItemDTO[] } }>(path, {
    etag: unscoped ? etag : null,
    auth: true,
  });
  const overlayPromise = fetchExploreMapOverlayIfSignedIn(params);
  const [result, overlay] = await Promise.all([mapPromise, overlayPromise]);
  if (result.notModified) return { notModified: true, etag: result.etag };
  return {
    notModified: false,
    etag: result.etag,
    data: applyExploreMapOverlay(result.body.data.items, overlay),
  };
};