import { useQuery, type QueryClient } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { ExploreMapFetchScope } from '../explore/exploreMapVnext';
import { isExploreMapVnextEnabled } from '../explore/exploreMapVnext';
import { exploreMapQueryKey, exploreMapQueryKeyPrefix } from './exploreMapQuery';

export { exploreMapQueryKey, exploreMapQueryKeyPrefix } from './exploreMapQuery';
export {
  patchExploreMapItemInCache,
  readExploreMapItemsFromCache,
} from './exploreMapQuery';

export const reloadExploreMap = async (queryClient: QueryClient): Promise<void> => {
  await queryClient.invalidateQueries({ queryKey: exploreMapQueryKeyPrefix });
  await queryClient.refetchQueries({ queryKey: exploreMapQueryKeyPrefix, type: 'active' });
};

type UseExploreMapOptions = {
  enabled?: boolean;
  /** When `VITE_EXPLORE_MAP_VNEXT=1`, fetches a bbox subset from the API. Omit on `/list` for full catalog. */
  scope?: ExploreMapFetchScope | null;
};

export const useExploreMap = (options?: UseExploreMapOptions) => {
  const scope = options?.scope ?? null;
  const useVnextFetch = isExploreMapVnextEnabled() && scope != null;

  return useQuery({
    queryKey: exploreMapQueryKey(useVnextFetch ? scope : null),
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<ExploreMapItemDTO[]> => {
      if (useVnextFetch && scope) {
        const res = await api.getExploreMap({
          bbox: scope.bbox,
          area: scope.area ?? undefined,
        });
        return res.data.items;
      }
      const res = await api.getExploreMap();
      return res.data.items;
    },
    staleTime: 60_000,
  });
};
