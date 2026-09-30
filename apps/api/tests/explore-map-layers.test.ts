import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ActivityType, LocationStatus } from '../src/domain/enums.js';
import { createLocationRecord } from '../src/lib/activities-store.js';
import { createPublishedEventFixture } from './helpers/fixtures.js';
import { bootstrapTestApp, configureTestEnv } from './helpers/bootstrap.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';

let app: Express;

beforeAll(async () => {
  configureTestEnv();
  app = await bootstrapTestApp();
});

type ExploreMapItem = {
  id: string;
  kind: string;
  source: string;
  composeIntent?: string | null;
  outingCategory?: string | null;
};

describe('GET /api/v1/explore/map layer separation', () => {
  it('includes venue hiking and activity hiking as distinct sources', async () => {
    const suffix = `layers-${Date.now()}`;
    const fixture = await createPublishedEventFixture(suffix);

    await getMongoClient()!
      .db()
      .collection('activities')
      .updateOne(
        { _id: fixture.activityId },
        {
          $set: {
            activityType: ActivityType.HIKING,
            meetingLat: 25.12,
            meetingLng: 55.21,
            joinMode: 'open',
          },
        }
      );

    const venue = await createLocationRecord({
      name: `Smoke trail ${suffix}`,
      region: 'Dubai',
      activityType: ActivityType.HIKING,
      status: LocationStatus.ACTIVE,
      featured: false,
      latitude: 25.13,
      longitude: 55.22,
      countryCode: 'AE',
      images: [],
      tags: ['catalog-import', 'hiking'],
      registryListed: true,
      externalSource: 'catalog',
      externalId: `smoke-venue-${suffix}`,
    });

    await invalidateExploreMapCache();

    const response = await request(app).get('/api/v1/explore/map');
    expect(response.status).toBe(200);

    const items = response.body.data.items as ExploreMapItem[];
    const activity = items.find((item) => item.id === `activity:${fixture.activityId}`);
    const venueItem = items.find((item) => item.id === `venue:${venue.id}`);

    expect(activity?.source).toBe('activity');
    expect(activity?.kind).toBe('hiking');
    expect(activity?.composeIntent).toBe('organize');
    expect(activity?.outingCategory).toBe('hiking');
    expect(venueItem?.source).toBe('venue');
    expect(venueItem?.kind).toBe('hiking');
    expect(venueItem?.composeIntent).toBeNull();
    expect(venueItem?.outingCategory).toBeNull();
  });

  it('refreshes explore map after a new active location without manual cache clear', async () => {
    const suffix = `cache-${Date.now()}`;
    await invalidateExploreMapCache();

    const warm = await request(app).get('/api/v1/explore/map');
    expect(warm.status).toBe(200);

    const venue = await createLocationRecord({
      name: `Cache trail ${suffix}`,
      region: 'Dubai',
      activityType: ActivityType.HIKING,
      status: LocationStatus.ACTIVE,
      featured: false,
      latitude: 25.14,
      longitude: 55.23,
      countryCode: 'AE',
      images: [],
      tags: ['catalog-import', 'hiking'],
      registryListed: true,
      externalSource: 'catalog',
      externalId: `cache-venue-${suffix}`,
    });

    const after = await request(app).get('/api/v1/explore/map');
    expect(after.status).toBe(200);
    const items = after.body.data.items as ExploreMapItem[];
    expect(items.some((item) => item.id === `venue:${venue.id}`)).toBe(true);
  });
});
