import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { apiRequestConditional } from '../api/client';
import { applyExploreMapOverlay } from '../explore/applyExploreMapOverlay';
import { fetchExploreMapOverlayIfSignedIn, type ConditionalCatalog } from './exploreMapClientApi';

/** Published seeking outings for People **Looking for** (same wire as explore map items). */
export const fetchExploreSeekingActivities = async (
  etag?: string | null
): Promise<ConditionalCatalog<ExploreMapItemDTO[]>> => {
  const result = await apiRequestConditional<{ data: ExploreMapItemDTO[] }>('/explore/seeking-activities', { etag });
  if (result.notModified) return { notModified: true, etag: result.etag };
  const overlay = await fetchExploreMapOverlayIfSignedIn();
  return {
    notModified: false,
    etag: result.etag,
    data: applyExploreMapOverlay(result.body.data, overlay),
  };
};
