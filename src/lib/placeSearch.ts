import {
  geoSearchApi,
  type CommunityCityLabel,
  type PlaceSearchProvider,
  type PlaceSearchResult,
} from '../api/domains/geoSearch';

export type { PlaceSearchProvider, PlaceSearchResult, CommunityCityLabel };

export const reverseCommunityCity = async (
  lat: number,
  lng: number
): Promise<CommunityCityLabel | null> => {
  try {
    const payload = await geoSearchApi.reverseCommunityCity(lat, lng);
    const data = payload.data;
    if (!data?.community || !data.city || !data.label) return null;
    return data;
  } catch {
    return null;
  }
};

export const searchPlaces = async (query: string): Promise<PlaceSearchResult[]> => {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const payload = await geoSearchApi.searchPlaces(q);
    return Array.isArray(payload.data) ? payload.data : [];
  } catch {
    return [];
  }
};

export const resolvePlaceSelection = async (input: {
  placeId?: string;
  query?: string;
}): Promise<PlaceSearchResult | null> => {
  try {
    const payload = await geoSearchApi.resolvePlaceSelection(input);
    return payload.data ?? null;
  } catch {
    return null;
  }
};