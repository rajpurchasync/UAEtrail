import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchExploreMapItems = async (params?: {
  bbox?: string;
  area?: string | null;
}): Promise<ExploreMapItemDTO[]> => {
  const res = await api.getExploreMap({
    bbox: params?.bbox,
    area: params?.area ?? undefined,
  });
  return res.data.items;
};
