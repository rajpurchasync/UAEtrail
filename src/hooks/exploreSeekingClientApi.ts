import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

/** Published seeking outings for People **Looking for** (same wire as explore map items). */
export const fetchExploreSeekingActivities = async (): Promise<ExploreMapItemDTO[]> => {
  const res = await api.getExploreSeekingActivities();
  return res.data;
};
