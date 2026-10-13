import { useQuery, type QueryClient } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const exploreMapQueryKey = ['explore', 'map'] as const;

export const reloadExploreMap = async (queryClient: QueryClient): Promise<void> => {
  await queryClient.invalidateQueries({ queryKey: exploreMapQueryKey });
  await queryClient.refetchQueries({ queryKey: exploreMapQueryKey, type: 'active' });
};

type UseExploreMapOptions = {
  enabled?: boolean;
};

export const useExploreMap = (options?: UseExploreMapOptions) =>
  useQuery({
    queryKey: exploreMapQueryKey,
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<ExploreMapItemDTO[]> => {
      const res = await api.getExploreMap();
      return res.data.items;
    },
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
