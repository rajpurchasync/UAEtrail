import { apiRequest } from '../client';

export type PlaceSearchProvider = 'photon' | 'nominatim' | 'google';

export type PlaceSearchResult = {
  label: string;
  mainText: string;
  secondaryText: string;
  lat: number | null;
  lng: number | null;
  provider: PlaceSearchProvider;
  kind: 'place' | 'query';
  placeId?: string;
};

export type CommunityCityLabel = {
  community: string;
  city: string;
  label: string;
};

export type RideshareDestinationSearchRow = {
  kind: 'activity_meeting' | 'catalog_place' | 'pending_place';
  id: string;
  mainText: string;
  secondaryText: string;
  lat: number;
  lng: number;
  activityType?: string;
  pendingApproval?: boolean;
  placeName?: string;
};

export const geoSearchApi = {
  searchPlaces: (query: string) =>
    apiRequest<{ data: PlaceSearchResult[] }>(
      `/geo/search?q=${encodeURIComponent(query)}`
    ),

  resolvePlaceSelection: (input: { placeId?: string; query?: string }) =>
    apiRequest<{ data: PlaceSearchResult }>('/geo/resolve', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  reverseCommunityCity: (lat: number, lng: number) =>
    apiRequest<{ data: CommunityCityLabel }>(
      `/geo/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`
    ),

  searchRideshareDestinations: (query: string, signal?: AbortSignal) =>
    apiRequest<{ data: RideshareDestinationSearchRow[] }>(
      `/geo/rideshare-destinations?q=${encodeURIComponent(query)}`,
      { signal }
    ),
} as const;