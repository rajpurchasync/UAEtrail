import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExploreMapFetchScope } from '../explore/exploreMapBbox';

/** Prefix for all explore map item queries (legacy + bbox scopes). */
export const exploreMapQueryKeyPrefix = ['explore', 'map'] as const;

export const exploreMapQueryKey = (scope?: ExploreMapFetchScope | null): QueryKey =>
  scope ? [...exploreMapQueryKeyPrefix, scope] : [...exploreMapQueryKeyPrefix];

export const readExploreMapItemsFromCache = (
  queryClient: QueryClient
): ExploreMapItemDTO[] | undefined => {
  for (const [, data] of queryClient.getQueriesData<ExploreMapItemDTO[]>({
    queryKey: exploreMapQueryKeyPrefix,
  })) {
    if (data?.length) return data;
  }
  for (const [, data] of queryClient.getQueriesData<ExploreMapItemDTO[]>({
    queryKey: exploreMapQueryKeyPrefix,
  })) {
    if (data) return data;
  }
  return undefined;
};

export const patchExploreMapItemInCache = (
  queryClient: QueryClient,
  exploreItemId: string,
  patch: (item: ExploreMapItemDTO) => ExploreMapItemDTO
): void => {
  for (const [key] of queryClient.getQueriesData<ExploreMapItemDTO[]>({
    queryKey: exploreMapQueryKeyPrefix,
  })) {
    queryClient.setQueryData<ExploreMapItemDTO[]>(key, (old) => {
      if (!old?.length) return old;
      let changed = false;
      const next = old.map((item) => {
        if (item.id !== exploreItemId) return item;
        changed = true;
        return patch(item);
      });
      return changed ? next : old;
    });
  }
};
