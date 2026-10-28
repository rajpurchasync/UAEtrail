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

export const reverseCommunityCity = async (
  lat: number,
  lng: number
): Promise<CommunityCityLabel | null> => {
  const response = await fetch(
    `/api/geo/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`
  );
  if (!response.ok) return null;
  const payload = (await response.json()) as { data?: CommunityCityLabel };
  const data = payload.data;
  if (!data?.community || !data.city || !data.label) return null;
  return data;
};

export const searchPlaces = async (query: string): Promise<PlaceSearchResult[]> => {
  const q = query.trim();
  if (q.length < 2) return [];

  const response = await fetch(`/api/geo/search?q=${encodeURIComponent(q)}`);
  if (!response.ok) return [];
  const payload = (await response.json()) as { data?: PlaceSearchResult[] };
  return Array.isArray(payload.data) ? payload.data : [];
};

export const resolvePlaceSelection = async (input: {
  placeId?: string;
  query?: string;
}): Promise<PlaceSearchResult | null> => {
  const response = await fetch('/api/geo/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { data?: PlaceSearchResult };
  return payload.data ?? null;
};
