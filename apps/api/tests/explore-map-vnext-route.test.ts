import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp, configureTestEnv } from './helpers/bootstrap.js';
import { createPublishedEventFixture } from './helpers/fixtures.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';

let app: Express;

beforeAll(async () => {
  configureTestEnv();
  app = await bootstrapTestApp();
});

afterEach(() => {
  delete process.env.EXPLORE_MAP_VNEXT;
});

describe('GET /api/v1/explore/map vNext query (EXPLORE_MAP_VNEXT)', () => {
  it('rejects bbox when flag is off', async () => {
    const response = await request(app).get('/api/v1/explore/map').query({
      bbox: '55,25,56,26',
    });
    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe('explore_map_vnext_disabled');
  });

  it('returns subset inside bbox when flag is on', async () => {
    process.env.EXPLORE_MAP_VNEXT = '1';
    const suffix = `explore-vnext-${Date.now()}`;
    const fixture = await createPublishedEventFixture(suffix);

    await getMongoClient()!
      .db()
      .collection('activities')
      .updateOne(
        { _id: fixture.activityId },
        { $set: { meetingLat: 25.118, meetingLng: 55.201, joinMode: 'open' } }
      );

    await invalidateExploreMapCache();

    const bbox = '55.1,25.1,55.3,25.2';
    const response = await request(app).get('/api/v1/explore/map').query({ bbox });
    expect(response.status).toBe(200);

    const items = response.body.data.items as Array<{ id: string }>;
    const pin = items.find((item) => item.id === `activity:${fixture.activityId}`);
    expect(pin).toBeDefined();
    expect(response.body.data.region?.bbox).toMatchObject({
      west: 55.1,
      south: 25.1,
      east: 55.3,
      north: 25.2,
    });
    expect(response.body.data).toHaveProperty('nextCursor');
  });
});
