import { env } from '../config/env.js';

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

const UAE_CENTER = { lat: 25.2048, lng: 55.2708 };
/** GCC + UAE view for biasing free search (minLon, minLat, maxLon, maxLat). */
const UAE_BBOX = '51.0,22.5,56.5,26.5';
const AUTOCOMPLETE_LIMIT = 8;
const NOMINATIM_USER_AGENT = `UAETrail/${env.NODE_ENV} (place-search; contact@uaetrail.com)`;

const mapsKey = (): string | undefined =>
  (process.env.GOOGLE_MAPS_API_KEY ?? env.GOOGLE_MAPS_API_KEY)?.trim() || undefined;

const dedupeResults = (rows: PlaceSearchResult[]): PlaceSearchResult[] => {
  const seen = new Set<string>();
  const out: PlaceSearchResult[] = [];
  for (const row of rows) {
    if (row.lat == null || row.lng == null) continue;
    const key = `${row.mainText.toLowerCase()}|${row.lat.toFixed(4)}|${row.lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= AUTOCOMPLETE_LIMIT) break;
  }
  return out;
};

type PhotonProperties = {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  district?: string;
  osm_id?: number;
  osm_type?: string;
  type?: string;
};

const formatPhotonRow = (
  props: PhotonProperties,
  lat: number,
  lng: number
): PlaceSearchResult | null => {
  const mainText =
    props.name?.trim() ||
    props.street?.trim() ||
    props.city?.trim() ||
    props.district?.trim() ||
    null;
  if (!mainText) return null;

  const secondaryParts = [props.district, props.city, props.state, props.country]
    .map((part) => part?.trim())
    .filter((part, index, list) => part && list.indexOf(part) === index) as string[];
  const secondaryText = secondaryParts.join(', ');
  const label = secondaryText ? `${mainText} · ${secondaryText}` : mainText;
  const placeId =
    props.osm_id != null && props.osm_type
      ? `photon:${props.osm_type}:${props.osm_id}`
      : undefined;

  return {
    label,
    mainText,
    secondaryText,
    lat,
    lng,
    provider: 'photon',
    kind: 'place',
    placeId,
  };
};

const searchPhoton = async (query: string, useBbox: boolean): Promise<PlaceSearchResult[]> => {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('lat', String(UAE_CENTER.lat));
  url.searchParams.set('lon', String(UAE_CENTER.lng));
  url.searchParams.set('limit', String(AUTOCOMPLETE_LIMIT));
  url.searchParams.set('lang', 'en');
  if (useBbox) {
    url.searchParams.set('bbox', UAE_BBOX);
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return [];

  const payload = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: PhotonProperties;
    }>;
  };

  return (payload.features ?? [])
    .map((feature) => {
      const coords = feature.geometry?.coordinates;
      const lng = coords?.[0];
      const lat = coords?.[1];
      if (typeof lat !== 'number' || typeof lng !== 'number' || !feature.properties) return null;
      return formatPhotonRow(feature.properties, lat, lng);
    })
    .filter((item): item is PlaceSearchResult => item !== null);
};

const searchNominatim = async (query: string): Promise<PlaceSearchResult[]> => {
  const fetchRows = async (q: string, bounded: boolean): Promise<PlaceSearchResult[]> => {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('q', q);
    url.searchParams.set('countrycodes', 'ae');
    url.searchParams.set('limit', String(AUTOCOMPLETE_LIMIT));
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('viewbox', UAE_BBOX);
    url.searchParams.set('bounded', bounded ? '1' : '0');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': NOMINATIM_USER_AGENT,
      },
    });
    if (!response.ok) return [];

    const rows = (await response.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
      osm_id?: number;
      osm_type?: string;
      address?: {
        building?: string;
        road?: string;
        suburb?: string;
        city?: string;
        state?: string;
        country?: string;
      };
    }>;

    return rows.flatMap((row) => {
        const lat = Number(row.lat);
        const lng = Number(row.lon);
        const label = row.display_name?.trim();
        if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];

        const addr = row.address;
        const mainText =
          addr?.building?.trim() ||
          label.split(',')[0]?.trim() ||
          label;
        const secondaryParts = [addr?.suburb, addr?.city, addr?.state, addr?.country]
          .map((part) => part?.trim())
          .filter(Boolean) as string[];
        const secondaryText =
          secondaryParts.length > 0 ? secondaryParts.join(', ') : label.split(',').slice(1).join(',').trim();

        const placeId =
          row.osm_id != null && row.osm_type
            ? `nominatim:${row.osm_type}:${row.osm_id}`
            : undefined;

        return [
          {
            label,
            mainText,
            secondaryText,
            lat,
            lng,
            provider: 'nominatim' as const,
            kind: 'place' as const,
            placeId,
          },
        ];
      });
  };

  let results = await fetchRows(query, true);
  if (results.length === 0) {
    results = await fetchRows(query, false);
  }
  if (results.length === 0 && !/\buae\b/i.test(query) && !/\bdubai\b/i.test(query)) {
    results = await fetchRows(`${query}, UAE`, false);
  }
  return results;
};

const searchFreePlaces = async (query: string): Promise<PlaceSearchResult[]> => {
  const photonUae = await searchPhoton(query, true);
  const photonWide = photonUae.length > 0 ? [] : await searchPhoton(query, false);
  const nominatim = await searchNominatim(query);
  return dedupeResults([...photonUae, ...photonWide, ...nominatim]);
};

// --- Optional Google (paid) when API key is configured ---

type AutocompletePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

const fetchLegacyAutocomplete = async (query: string, restrictAe: boolean): Promise<AutocompletePrediction[]> => {
  const key = mapsKey();
  if (!key) return [];

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', query);
  url.searchParams.set('key', key);
  url.searchParams.set('language', 'en');
  url.searchParams.set('location', `${UAE_CENTER.lat},${UAE_CENTER.lng}`);
  url.searchParams.set('radius', '200000');
  if (restrictAe) {
    url.searchParams.set('components', 'country:ae');
  }

  const response = await fetch(url.toString());
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    status?: string;
    predictions?: AutocompletePrediction[];
  };
  if (payload.status !== 'OK' || !Array.isArray(payload.predictions)) return [];
  return payload.predictions.slice(0, AUTOCOMPLETE_LIMIT);
};

const fetchLegacyPlaceDetails = async (
  placeId: string
): Promise<{ lat: number; lng: number; label: string } | null> => {
  const key = mapsKey();
  if (!key) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'geometry,formatted_address,name');
  url.searchParams.set('key', key);

  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    status?: string;
    result?: {
      formatted_address?: string;
      name?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
    };
  };
  if (payload.status !== 'OK' || !payload.result) return null;

  const lat = payload.result.geometry?.location?.lat;
  const lng = payload.result.geometry?.location?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const label =
    payload.result.formatted_address?.trim() ||
    payload.result.name?.trim() ||
    'Selected place';

  return { lat, lng, label };
};

const predictionToResult = async (prediction: AutocompletePrediction): Promise<PlaceSearchResult | null> => {
  const mainText = prediction.structured_formatting?.main_text?.trim() || prediction.description;
  const secondaryText = prediction.structured_formatting?.secondary_text?.trim() || '';

  const details = await fetchLegacyPlaceDetails(prediction.place_id);
  if (!details) return null;

  return {
    label: details.label,
    mainText,
    secondaryText,
    lat: details.lat,
    lng: details.lng,
    provider: 'google',
    kind: 'place',
    placeId: prediction.place_id,
  };
};

const searchGooglePlaces = async (query: string): Promise<PlaceSearchResult[]> => {
  if (!mapsKey()) return [];

  let predictions = await fetchLegacyAutocomplete(query, true);
  if (predictions.length === 0) {
    predictions = await fetchLegacyAutocomplete(query, false);
  }
  if (predictions.length === 0) return [];

  const settled = await Promise.all(predictions.map((row) => predictionToResult(row)));
  return settled.filter((item): item is PlaceSearchResult => item !== null);
};

const PLACE_SEARCH_TTL_MS = 60_000;
const PLACE_SEARCH_CACHE_MAX = 80;
const placeSearchCache = new Map<string, { at: number; rows: PlaceSearchResult[] }>();

export const clearPlaceSearchCache = (): void => {
  placeSearchCache.clear();
};

const readPlaceSearchCache = (key: string): PlaceSearchResult[] | null => {
  const hit = placeSearchCache.get(key);
  if (!hit || Date.now() - hit.at > PLACE_SEARCH_TTL_MS) return null;
  return hit.rows;
};

const rememberPlaceSearch = (key: string, rows: PlaceSearchResult[]): void => {
  if (rows.length === 0) return;
  placeSearchCache.set(key, { at: Date.now(), rows });
  if (placeSearchCache.size <= PLACE_SEARCH_CACHE_MAX) return;
  const oldest = placeSearchCache.keys().next().value;
  if (oldest) placeSearchCache.delete(oldest);
};

export const searchPlaces = async (query: string): Promise<PlaceSearchResult[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const key = trimmed.toLowerCase();
  const cached = readPlaceSearchCache(key);
  if (cached) return cached;

  const free = await searchFreePlaces(trimmed);
  if (free.length > 0) {
    rememberPlaceSearch(key, free);
    return free;
  }

  const google = await searchGooglePlaces(trimmed);
  rememberPlaceSearch(key, google);
  return google;
};

export const resolvePlaceSelection = async (input: {
  placeId?: string;
  query?: string;
}): Promise<PlaceSearchResult | null> => {
  const placeId = input.placeId?.trim();
  const query = input.query?.trim();

  if (placeId && !placeId.startsWith('photon:') && !placeId.startsWith('nominatim:')) {
    const legacy = await fetchLegacyPlaceDetails(placeId);
    if (legacy) {
      return {
        label: legacy.label,
        mainText: legacy.label.split(',')[0]?.trim() || legacy.label,
        secondaryText: legacy.label.split(',').slice(1).join(',').trim(),
        lat: legacy.lat,
        lng: legacy.lng,
        provider: 'google',
        kind: 'place',
        placeId,
      };
    }
  }

  if (!query || query.length < 2) return null;

  const free = await searchFreePlaces(query);
  if (free[0]) return free[0];

  const google = await searchGooglePlaces(query);
  return google[0] ?? null;
};
