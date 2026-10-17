import type { ExploreMapItemDTO, ExploreMapOverlayDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { getStoredSession } from '../api/client';
import { applyExploreMapOverlay } from '../explore/applyExploreMapOverlay';

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

export const fetchExploreMapItems = async (params?: {
  bbox?: string;
  area?: string | null;
}): Promise<ExploreMapItemDTO[]> => {
  const res = await api.getExploreMap({
    bbox: params?.bbox,
    area: params?.area ?? undefined,
  });
  const overlay = await fetchExploreMapOverlayIfSignedIn(params);
  return applyExploreMapOverlay(res.data.items, overlay);
};
