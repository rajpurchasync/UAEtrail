import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { BWL_EXPLORE_MAP_SOURCE } from '@uaetrail/shared-types';
import { applyExploreMapOverlay } from '../explore/applyExploreMapOverlay';
import { fetchExploreMapItems, fetchExploreMapOverlayIfSignedIn, type ConditionalCatalog } from './exploreMapClientApi';

/** Fixed crew availability for People **Looking for** (explore map slice). */
export const fetchExploreAvailabilityCatalog = async (
  etag?: string | null
): Promise<ConditionalCatalog<ExploreMapItemDTO[]>> => {
  const result = await fetchExploreMapItems(
    { sources: BWL_EXPLORE_MAP_SOURCE.AVAILABILITY, projection: 'list' },
    etag
  );
  if (result.notModified) return { notModified: true, etag: result.etag };
  const overlay = await fetchExploreMapOverlayIfSignedIn();
  return {
    notModified: false,
    etag: result.etag,
    data: applyExploreMapOverlay(result.data, overlay),
  };
};