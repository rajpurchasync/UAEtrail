import { keepPreviousData, useQuery, type QueryClient } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { useAuth } from '../context/AuthContext';
import { catalogFreshQueryOptions, catalogSnapshots, loadCachedCatalog } from '../lib/catalogSnapshot';
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
  catalogSnapshots.clearPrefix(exploreMapQueryKeyPrefix);
  catalogSnapshots.clearPrefix(['people-discovery', 'seeking-activities']);
  await queryClient.invalidateQueries({ queryKey: exploreMapQueryKeyPrefix });
  await queryClient.invalidateQueries({ queryKey: ['people-discovery', 'seeking-activities'] });
  await queryClient.refetchQueries({ queryKey: exploreMapQueryKeyPrefix, type: 'active' });
};

type UseExploreMapOptions = {
  enabled?: boolean;
  /** When `VITE_EXPLORE_MAP_BBOX=1`, fetches a bbox subset from the API. Omit on `/list` for full catalog. */
  scope?: ExploreMapFetchScope | null;
};

export const useExploreMap = (options?: UseExploreMapOptions) => {
  const { user } = useAuth();
  const scope = options?.scope ?? null;
  const useVnextFetch = isExploreMapBboxEnabled() && scope != null;
  const catalogKey = exploreMapQueryKey(useVnextFetch ? scope : null);
  const queryKey = user?.id ? [...catalogKey, user.id] : catalogKey;

  return useQuery({
    queryKey,
    enabled: options?.enabled ?? true,
    queryFn: (): Promise<ExploreMapItemDTO[]> =>
      loadCachedCatalog(queryKey, (etag) =>
        useVnextFetch && scope
          ? fetchExploreMapItems({ bbox: scope.bbox, area: scope.area ?? undefined }, etag)
          : fetchExploreMapItems(undefined, etag)
      ),
    placeholderData: keepPreviousData,
    refetchOnMount: true,
    ...catalogFreshQueryOptions<ExploreMapItemDTO[]>(queryKey),
  });
};
