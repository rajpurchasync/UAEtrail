import { beforeAll, describe, expect, it } from 'vitest';
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

describe('GET /api/v1/explore/map golden path', () => {
  it('includes a published open activity with map coordinates', async () => {
    const suffix = `explore-map-${Date.now()}`;
    const fixture = await createPublishedEventFixture(suffix);

    await getMongoClient()!
      .db()
      .collection('activities')
      .updateOne(
        { _id: fixture.activityId },
        { $set: { meetingLat: 25.118, meetingLng: 55.201, joinMode: 'open' } }
      );

    await invalidateExploreMapCache();

    const response = await request(app).get('/api/v1/explore/map');
    expect(response.status).toBe(200);

    const items = response.body.data.items as Array<{ id: string; latitude: number | null; longitude: number | null }>;
    const pin = items.find((item) => item.id === `activity:${fixture.activityId}`);

    expect(pin).toBeDefined();
    expect(pin?.latitude).toBe(25.118);
    expect(pin?.longitude).toBe(55.201);
  });

  it('excludes private published activities from the explore map', async () => {
    const suffix = `explore-private-${Date.now()}`;
    const fixture = await createPublishedEventFixture(suffix);

    await getMongoClient()!
      .db()
      .collection('activities')
      .updateOne(
        { _id: fixture.activityId },
        {
          $set: {
            meetingLat: 25.119,
            meetingLng: 55.202,
            joinMode: 'private',
            requirements: ['Private: group or invite only — approval required'],
          },
        }
      );

    await invalidateExploreMapCache();

    const response = await request(app).get('/api/v1/explore/map');
    expect(response.status).toBe(200);

    const items = response.body.data.items as Array<{ id: string }>;
    expect(items.some((item) => item.id === `activity:${fixture.activityId}`)).toBe(false);
  });
});
