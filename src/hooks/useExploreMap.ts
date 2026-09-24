import { useQuery, type QueryClient } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const exploreMapQueryKey = ['explore', 'map'] as const;

export const reloadExploreMap = async (queryClient: QueryClient): Promise<void> => {
  await queryClient.invalidateQueries({ queryKey: exploreMapQueryKey });
  await queryClient.refetchQueries({ queryKey: exploreMapQueryKey, type: 'active' });
};

export const useExploreMap = () =>
  useQuery({
    queryKey: exploreMapQueryKey,
    queryFn: async (): Promise<ExploreMapItemDTO[]> => {
      const res = await api.getExploreMap();
      return res.data.items;
    },
    staleTime: 60_000,
  });
