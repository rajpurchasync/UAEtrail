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
  delete process.env.EXPLORE_MAP_BBOX;
});

describe('GET /api/explore/map bbox query (EXPLORE_MAP_BBOX)', () => {
  it('rejects bbox when flag is off', async () => {
    const response = await request(app).get('/api/explore/map').query({
      bbox: '55,25,56,26',
    });
    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe('explore_map_bbox_disabled');
  });

  it('returns subset inside bbox when flag is on', async () => {
    process.env.EXPLORE_MAP_BBOX = '1';
    const suffix = `explore-bbox-${Date.now()}`;
    const fixture = await createPublishedEventFixture(suffix);

    const soonStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await getMongoClient()!
      .db()
      .collection('activities')
      .updateOne(
        { _id: fixture.activityId },
        {
          $set: {
            meetingLat: 25.118,
            meetingLng: 55.201,
            joinMode: 'open',
            startAt: soonStart,
            endAt: new Date(soonStart.getTime() + 4 * 60 * 60 * 1000),
          },
        }
      );

    await invalidateExploreMapCache();

    const bbox = '55.195,25.112,55.207,25.124';
    const response = await request(app).get('/api/explore/map').query({ bbox, limit: 50 });
    expect(response.status).toBe(200);

    const items = response.body.data.items as Array<{ id: string }>;
    const pin = items.find((item) => item.id === `activity:${fixture.activityId}`);
    expect(pin).toBeDefined();
    expect(response.body.data.region?.bbox).toMatchObject({
      west: 55.195,
      south: 25.112,
      east: 55.207,
      north: 25.124,
    });
    expect(response.body.data).toHaveProperty('nextCursor');
  });
});
