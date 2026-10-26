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
