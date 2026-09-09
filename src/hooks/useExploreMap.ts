import { useQuery } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';

export const exploreMapQueryKey = ['explore', 'map'] as const;

export const useExploreMap = () =>
  useQuery({
    queryKey: exploreMapQueryKey,
    queryFn: async (): Promise<ExploreMapItemDTO[]> => {
      const res = await api.getExploreMap();
      return res.data.items;
    },
    staleTime: 60_000,
  });
