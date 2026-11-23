import { useQuery } from '@tanstack/react-query';
import type { MapExploreViewerGeo } from '@uaetrail/shared-types';
import { discoverRecommendationsApi } from '../api/domains/discoverRecommendations';

const roundGeo = (value: number) => Math.round(value * 100) / 100;

export const discoverMapRecommendationsQueryKey = (
  limit = 8,
  viewerGeo: MapExploreViewerGeo | null = null
) =>
  [
    'discover',
    'recommendations',
    'map',
    limit,
    viewerGeo ? roundGeo(viewerGeo.lat) : null,
    viewerGeo ? roundGeo(viewerGeo.lng) : null,
  ] as const;

/** Server-ranked map recommendations — optional auth boosts buddies (Discover layer). */
export const useDiscoverMapRecommendations = (
  enabled: boolean,
  limit = 8,
  viewerGeo: MapExploreViewerGeo | null = null
) =>
  useQuery({
    queryKey: discoverMapRecommendationsQueryKey(limit, viewerGeo),
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await discoverRecommendationsApi.getMapRecommendations({
        limit,
        lat: viewerGeo?.lat,
        lng: viewerGeo?.lng,
      });
      return res.data.rows;
    },
  });