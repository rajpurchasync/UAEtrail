import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { COLLECTIONS } from '../src/lib/collections.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { weatherCacheKey } from '../src/lib/weather-cache-store.js';
import { bootstrapTestApp, configureTestEnv } from './helpers/bootstrap.js';

let app: Express;
const originalFetch = globalThis.fetch;

afterAll(() => {
  globalThis.fetch = originalFetch;
});

beforeAll(async () => {
  configureTestEnv();
  app = await bootstrapTestApp();
});

describe('GET /weather', () => {
  it('returns 400 for bad date format', async () => {
    const res = await request(app).get('/api/weather').query({ lat: 25.1, lng: 55.2, date: 'not-a-date' });
    expect(res.status).toBe(400);
  });

  it('caches forecast in weather_cache and returns normalized daily', async () => {
    const lat = 25.123456;
    const lng = 55.987654;
    const date = '2030-06-15';

    await getMongoClient()!
      .db()
      .collection(COLLECTIONS.WEATHER_CACHE)
      .deleteMany({ _id: weatherCacheKey({ lat: 25.1235, lng: 55.9877, date }) });

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('open-meteo')) {
        const daily = {
          time: ['2030-06-14', '2030-06-15', '2030-06-16'],
          weathercode: [0, 3, 61],
          temperature_2m_max: [38, 39, 37],
          temperature_2m_min: [28, 29, 27],
          precipitation_probability_max: [5, 20, 40],
        };
        return {
          ok: true,
          json: async () => ({ daily }),
        } as Response;
      }
      if (url.includes('photon.komoot.io') || url.includes('nominatim.openstreetmap.org')) {
        return {
          ok: true,
          json: async () => ({
            features: [{ properties: { city: 'Dubai', state: 'Dubai' } }],
          }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    }) as typeof fetch;

    const first = await request(app).get('/api/weather').query({ lat, lng, date });
    expect(first.status).toBe(200);
    expect(first.body.data?.date).toBe(date);
    expect(first.body.data?.daily?.tempMaxC).toBe(39);
    expect(first.body.data?.provider).toBe('open-meteo');
    expect(first.body.data?.locationName).toBe('Dubai');
    expect(globalThis.fetch.mock.calls.filter((c) => String(c[0]).includes('open-meteo'))).toHaveLength(1);

    const cacheId = weatherCacheKey({ lat: 25.1235, lng: 55.9877, date });
    const row = await getMongoClient()!.db().collection(COLLECTIONS.WEATHER_CACHE).findOne({ _id: cacheId });
    expect(row).toBeTruthy();

    const second = await request(app).get('/api/weather').query({ lat, lng, date });
    expect(second.status).toBe(200);
    expect(second.body.data?.daily?.tempMaxC).toBe(39);
    expect(globalThis.fetch.mock.calls.filter((c) => String(c[0]).includes('open-meteo'))).toHaveLength(1);
  });
});
