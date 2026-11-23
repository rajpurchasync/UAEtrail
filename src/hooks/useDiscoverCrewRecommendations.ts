import { useQuery } from '@tanstack/react-query';
import type { DiscoverCrewRecommendationsQueryParams } from '@/crew-discovery/lib/crewRecommendationsQuery';
import { discoverRecommendationsApi } from '../api/domains/discoverRecommendations';

export const discoverCrewRecommendationsQueryKey = (params: DiscoverCrewRecommendationsQueryParams) =>
  ['discover', 'recommendations', 'crew', params] as const;

/** Server-ranked Recommended crew tab — requires auth (Discover layer). */
export const useDiscoverCrewRecommendations = (
  enabled: boolean,
  params: DiscoverCrewRecommendationsQueryParams
) =>
  useQuery({
    queryKey: discoverCrewRecommendationsQueryKey(params),
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await discoverRecommendationsApi.getCrewRecommendations(params);
      return res.data.rows;
    },
  });