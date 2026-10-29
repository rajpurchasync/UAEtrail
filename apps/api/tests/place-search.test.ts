import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  clearPlaceSearchCache,
  communityCityLabel,
  resolvePlaceSelection,
  reverseCommunityCity,
  reversePlaceLocality,
  searchPlaces,
} from '../src/lib/place-search.js';

describe('searchPlaces', () => {
  afterEach(() => {
    clearPlaceSearchCache();
    vi.unstubAllGlobals();
    delete process.env.GOOGLE_MAPS_API_KEY;
  });

  it('returns photon results without any API key', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('photon.komoot.io')) {
        return {
          ok: true,
          json: async () => ({
            features: [
              {
                geometry: { coordinates: [55.14, 25.08] },
                properties: {
                  name: 'Dubai Marina',
                  city: 'Dubai',
                  country: 'United Arab Emirates',
                  osm_id: 1,
                  osm_type: 'N',
                },
              },
            ],
          }),
        };
      }
      if (url.includes('nominatim.openstreetmap.org')) {
        return { ok: true, json: async () => [] };
      }
      return { ok: false, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchPlaces('Dubai Marina');
    expect(results).toHaveLength(1);
    expect(results[0]?.mainText).toBe('Dubai Marina');
    expect(results[0]?.provider).toBe('photon');
    expect(results[0]?.lat).toBe(25.08);
  });

  it('falls back to nominatim when photon is empty', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('photon.komoot.io')) {
        return { ok: true, json: async () => ({ features: [] }) };
      }
      if (url.includes('nominatim.openstreetmap.org')) {
        return {
          ok: true,
          json: async () => [
            {
              display_name: 'Hatta, Dubai, UAE',
              lat: '24.8200',
              lon: '56.1300',
              osm_id: 2,
              osm_type: 'way',
            },
          ],
        };
      }
      return { ok: false, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchPlaces('Hatta');
    expect(results).toHaveLength(1);
    expect(results[0]?.provider).toBe('nominatim');
  });

  it('uses Google only when free providers return nothing and key is set', async () => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-key';

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('photon.komoot.io')) {
        return { ok: true, json: async () => ({ features: [] }) };
      }
      if (url.includes('nominatim.openstreetmap.org')) {
        return { ok: true, json: async () => [] };
      }
      if (url.includes('place/autocomplete')) {
        return {
          ok: true,
          json: async () => ({
            status: 'OK',
            predictions: [
              {
                description: 'Axis Silver, Dubai',
                place_id: 'place-axis',
                structured_formatting: { main_text: 'Axis Silver', secondary_text: 'Dubai' },
              },
            ],
          }),
        };
      }
      if (url.includes('place/details')) {
        return {
          ok: true,
          json: async () => ({
            status: 'OK',
            result: {
              formatted_address: 'Axis Silver, Dubai',
              geometry: { location: { lat: 25.117, lng: 55.383 } },
            },
          }),
        };
      }
      return { ok: false, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchPlaces('axis silver');
    expect(results).toHaveLength(1);
    expect(results[0]?.provider).toBe('google');
  });
});

describe('resolvePlaceSelection', () => {
  afterEach(() => {
    clearPlaceSearchCache();
    vi.unstubAllGlobals();
    delete process.env.GOOGLE_MAPS_API_KEY;
  });

  it('resolves by re-running free search on query', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('photon.komoot.io')) {
        return {
          ok: true,
          json: async () => ({
            features: [
              {
                geometry: { coordinates: [55.38, 25.11] },
                properties: { name: 'Axis Silver', city: 'Dubai', osm_id: 9, osm_type: 'N' },
              },
            ],
          }),
        };
      }
      if (url.includes('nominatim.openstreetmap.org')) {
        return { ok: true, json: async () => [] };
      }
      return { ok: false, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', fetchMock);

    const resolved = await resolvePlaceSelection({ query: 'Axis Silver Dubai' });
    expect(resolved?.mainText).toBe('Axis Silver');
    expect(resolved?.provider).toBe('photon');
  });
});

describe('communityCityLabel', () => {
  it('joins the community and the city', () => {
    expect(communityCityLabel(['Al Barsha', 'Dubai'], ['Dubai'])).toEqual({
      community: 'Al Barsha',
      city: 'Dubai',
      label: 'Al Barsha, Dubai',
    });
  });

  it('returns null when the community is missing', () => {
    expect(communityCityLabel(['Dubai'], ['Dubai'])).toBeNull();
  });
});

describe('reverseCommunityCity', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the caller coordinates and names the community from photon', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                district: 'Al Barsha',
                city: 'Dubai',
                state: 'Dubai',
                name: 'Al Barsha Pond Park',
              },
            },
          ],
        }),
      }))
    );

    await expect(reverseCommunityCity(25.112, 55.196)).resolves.toEqual({
      community: 'Al Barsha',
      city: 'Dubai',
      label: 'Al Barsha, Dubai',
    });
  });
});

describe('reversePlaceLocality', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tags city from a pin even when community is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          features: [{ properties: { city: 'Hatta', state: 'Dubai' } }],
        }),
      }))
    );

    await expect(reversePlaceLocality(24.82, 56.13)).resolves.toEqual({
      city: 'Hatta',
      community: null,
      state: 'Dubai',
    });
  });
});
