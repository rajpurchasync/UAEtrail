import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { applyExploreMapOverlay } from '../explore/applyExploreMapOverlay';
import { fetchExploreMapOverlayIfSignedIn } from './exploreMapClientApi';

/** Published seeking outings for People **Looking for** (same wire as explore map items). */
export const fetchExploreSeekingActivities = async (): Promise<ExploreMapItemDTO[]> => {
  const res = await api.getExploreSeekingActivities();
  const overlay = await fetchExploreMapOverlayIfSignedIn();
  return applyExploreMapOverlay(res.data, overlay);
};
