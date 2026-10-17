import { keepPreviousData, useQuery, type QueryClient } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { fetchExploreMapItems } from './exploreMapClientApi';
import type { ExploreMapFetchScope } from '../explore/exploreMapBbox';
import { isExploreMapBboxEnabled } from '../explore/exploreMapBbox';
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
  /** When `VITE_EXPLORE_MAP_BBOX=1`, fetches a bbox subset from the API. Omit on `/list` for full catalog. */
  scope?: ExploreMapFetchScope | null;
};

export const useExploreMap = (options?: UseExploreMapOptions) => {
  const scope = options?.scope ?? null;
  const useVnextFetch = isExploreMapBboxEnabled() && scope != null;

  return useQuery({
    queryKey: exploreMapQueryKey(useVnextFetch ? scope : null),
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<ExploreMapItemDTO[]> => {
      if (useVnextFetch && scope) {
        return fetchExploreMapItems({
          bbox: scope.bbox,
          area: scope.area ?? undefined,
        });
      }
      return fetchExploreMapItems();
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    // Respect staleTime on remount — `always` refetched the full map on every /explore visit.
    refetchOnMount: true,
  });
};
