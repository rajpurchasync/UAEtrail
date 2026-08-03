import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ActivityType, Difficulty, LocationStatus } from '../src/domain/enums.js';
import { createLocationRecord } from '../src/lib/events-store.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { bootstrapTestApp } from './helpers/bootstrap.js';

let app: Express;
let nearId = '';
let farId = '';

beforeAll(async () => {
  app = await bootstrapTestApp();

  const suffix = Date.now();
  const near = await createLocationRecord({
    name: `Geo Near ${suffix}`,
    region: 'Dubai',
    activityType: ActivityType.HIKING,
    description: 'Near Dubai Marina',
    difficulty: Difficulty.EASY,
    season: ['winter'],
    images: [],
    highlights: [],
    surfaceType: [],
    tags: [],
    accessibleBy: [],
    status: LocationStatus.ACTIVE,
    latitude: 25.08,
    longitude: 55.14
  });
  const far = await createLocationRecord({
    name: `Geo Far ${suffix}`,
    region: 'Abu Dhabi',
    activityType: ActivityType.HIKING,
    description: 'Far from search center',
    difficulty: Difficulty.EASY,
    season: ['winter'],
    images: [],
    highlights: [],
    surfaceType: [],
    tags: [],
    accessibleBy: [],
    status: LocationStatus.ACTIVE,
    latitude: 24.45,
    longitude: 54.37
  });
  nearId = near.id;
  farId = far.id;
});

afterAll(async () => {
  await getMongoClient()!
    .db()
    .collection('locations')
    .deleteMany({ _id: { $in: [nearId, farId] } });
});

describe('location geo filter', () => {
  it('returns only locations within the requested radius', async () => {
    const response = await request(app).get('/api/v1/locations').query({
      lat: 25.08,
      lng: 55.14,
      radius: 15,
      pageSize: 50
    });

    expect(response.status).toBe(200);
    const ids = (response.body.data as { id: string }[]).map((row) => row.id);
    expect(ids).toContain(nearId);
    expect(ids).not.toContain(farId);
  });
});
