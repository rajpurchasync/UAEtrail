import type { DiscoverCrewRecommendationsDTO, DiscoverMapRecommendationsDTO } from '@uaetrail/shared-types';
import type { DiscoverCrewRecommendationsQueryParams } from '@/crew-discovery/lib/crewRecommendationsQuery';
import { apiRequest } from '../client';

export type { DiscoverCrewRecommendationsQueryParams };

export type DiscoverMapRecommendationsResponse = {
  data: DiscoverMapRecommendationsDTO;
};

export type DiscoverCrewRecommendationsResponse = {
  data: DiscoverCrewRecommendationsDTO;
};

export const discoverRecommendationsApi = {
  getMapRecommendations: (options?: {
    limit?: number;
    lat?: number;
    lng?: number;
  }) => {
    const params = new URLSearchParams({ surface: 'map' });
    if (options?.limit != null) params.set('limit', String(options.limit));
    if (options?.lat != null && options?.lng != null) {
      params.set('lat', String(options.lat));
      params.set('lng', String(options.lng));
    }
    return apiRequest<DiscoverMapRecommendationsResponse>(
      `/discover/recommendations?${params.toString()}`
    );
  },
  getCrewRecommendations: (options: DiscoverCrewRecommendationsQueryParams) => {
    const params = new URLSearchParams({ surface: 'crew' });
    params.set('from', options.from);
    params.set('to', options.to);
    if (options.limit != null) params.set('limit', String(options.limit));
    if (options.date) params.set('date', options.date);
    if (options.destination) params.set('destination', options.destination);
    if (options.kind) params.set('kind', options.kind);
    return apiRequest<DiscoverCrewRecommendationsResponse>(
      `/discover/recommendations?${params.toString()}`,
      { auth: true }
    );
  },
} as const;