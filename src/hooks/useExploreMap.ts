import { keepPreviousData, useQuery, type QueryClient } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { useAuth } from '../context/AuthContext';
import { catalogFreshQueryOptions, catalogSnapshots, loadCachedCatalog } from '../lib/catalogSnapshot';
import { fetchExploreMapItems } from './exploreMapClientApi';
import {
  isExploreMapBboxEnabled,
  type ExploreMapFetchScope,
} from '../discovery/discoveryPortExploreMapBbox';
import { crewDiscoveryAvailabilityCatalogQueryKey } from '../crew-discovery/hooks/useCrewDiscoveryAvailabilityCatalog';
import { exploreMapQueryKey, exploreMapQueryKeyPrefix } from './exploreMapQuery';

export { exploreMapQueryKey, exploreMapQueryKeyPrefix } from './exploreMapQuery';
export {
  patchExploreMapItemInCache,
  readExploreMapItemsFromCache,
} from './exploreMapQuery';

export const reloadExploreMap = async (queryClient: QueryClient): Promise<void> => {
  catalogSnapshots.clearPrefix(exploreMapQueryKeyPrefix);
  catalogSnapshots.clearPrefix(crewDiscoveryAvailabilityCatalogQueryKey());
  await queryClient.invalidateQueries({ queryKey: exploreMapQueryKeyPrefix });
  await queryClient.invalidateQueries({ queryKey: crewDiscoveryAvailabilityCatalogQueryKey() });
  await queryClient.refetchQueries({ queryKey: exploreMapQueryKeyPrefix, type: 'active' });
};

type UseExploreMapOptions = {
  enabled?: boolean;
  /** When `VITE_EXPLORE_MAP_BBOX=1`, fetches a bbox subset from the API. Omit on `/list` for full catalog. */
  scope?: ExploreMapFetchScope | null;
  /** `/list` uses the same Redis catalog with a lighter item projection. */
  projection?: 'list';
  /** Home map layer. Omit for the full catalog (`/list`). */
  sources?: string;
  includeRideshare?: boolean;
};

export const useExploreMap = (options?: UseExploreMapOptions) => {
  const { user, initializing } = useAuth();
  const scope = options?.scope ?? null;
  const projection = options?.projection;
  const sources = options?.sources;
  const includeRideshare = options?.includeRideshare ?? false;
  const useVnextFetch = isExploreMapBboxEnabled() && scope != null;
  const catalogKey = [
    ...exploreMapQueryKey(useVnextFetch ? scope : null),
    ...(projection ? [projection] : []),
    ...(sources ? [sources, includeRideshare ? 'rides' : 'no-rides'] : []),
  ];
  const queryKey = user?.id ? [...catalogKey, user.id] : catalogKey;
  const authSessionReady = !user || !initializing;

  return useQuery({
    queryKey,
    enabled: (options?.enabled ?? true) && authSessionReady,
    queryFn: (): Promise<ExploreMapItemDTO[]> =>
      loadCachedCatalog(queryKey, (etag) =>
        useVnextFetch && scope
          ? fetchExploreMapItems(
              {
                bbox: scope.bbox,
                destination: scope.destination ?? undefined,
                projection,
                sources,
                includeRideshare,
              },
              etag
            )
          : fetchExploreMapItems(
              sources || projection
                ? { projection, sources, includeRideshare }
                : undefined,
              etag
            )
      ),
    placeholderData: user?.id ? undefined : keepPreviousData,
    refetchOnMount: true,
    ...catalogFreshQueryOptions<ExploreMapItemDTO[]>(queryKey),
  });
};
