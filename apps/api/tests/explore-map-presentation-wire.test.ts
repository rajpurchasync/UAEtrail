import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import { createPublishedEventFixture } from './helpers/fixtures.js';
import { bootstrapTestApp, configureTestEnv } from './helpers/bootstrap.js';
import { getMongoClient } from '../src/lib/mongo.js';

let app: Express;

beforeAll(async () => {
  configureTestEnv();
  app = await bootstrapTestApp();
});

describe('GET /api/explore/map card payload', () => {
  it('does not attach a second discoveryCard read model', async () => {
    const suffix = `disc-proj-${Date.now()}`;
    const fixture = await createPublishedEventFixture(suffix);
    await getMongoClient()!
      .db()
      .collection('activities')
      .updateOne(
        { _id: fixture.activityId },
        { $set: { meetingLat: 25.118, meetingLng: 55.201, joinMode: 'open' } }
      );
    await invalidateExploreMapCache();

    const res = await request(app).get('/api/explore/map').expect(200);
    const items = res.body.data.items as Array<{
      id: string;
      discoveryCard?: { path: string; headline: string; entityRef?: { kind: string; activityId?: string } };
    }>;
    const row = items.find((item) => item.id === `activity:${fixture.activityId}`);
    expect(row?.discoveryCard).toBeUndefined();
    expect(row && 'presentation' in row).toBe(true);
  });

  it('bbox page does not attach discoveryCard', async () => {
    process.env.EXPLORE_MAP_BBOX = '1';
    const suffix = `disc-bbox-${Date.now()}`;
    const fixture = await createPublishedEventFixture(suffix);
    await getMongoClient()!
      .db()
      .collection('activities')
      .updateOne(
        { _id: fixture.activityId },
        { $set: { meetingLat: 25.2, meetingLng: 55.2, joinMode: 'open' } }
      );
    await getMongoClient()!
      .db()
      .collection('locations')
      .updateOne({ _id: fixture.locationId }, { $set: { latitude: 25.2, longitude: 55.2 } });
    await invalidateExploreMapCache();

    const res = await request(app)
      .get('/api/explore/map')
      .query({ bbox: '55.15,25.15,55.25,25.25', limit: '50' })
      .expect(200);

    const items = res.body.data.items as Array<{ id: string; discoveryCard?: { headline: string } }>;
    const row = items.find((item) => item.id === `activity:${fixture.activityId}`);
    expect(row?.discoveryCard).toBeUndefined();
    expect(items.every((item) => !item.discoveryCard?.headline)).toBe(true);

    delete process.env.EXPLORE_MAP_BBOX;
  });
});
