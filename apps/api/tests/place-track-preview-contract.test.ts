import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ActivityType, LocationStatus } from '../src/domain/enums.js';
import { createLocationRecord } from '../src/lib/activities-store.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { bootstrapTestApp, configureTestEnv } from './helpers/bootstrap.js';
import { registerVerifiedVisitor } from './helpers/fixtures.js';

let app: Express;

beforeAll(async () => {
  configureTestEnv();
  app = await bootstrapTestApp();
});

describe('GET /places/:id/track (public track preview)', () => {
  it('returns bbox and polyline without gpxKey when place_tracks has preview data', async () => {
    const suffix = `ptp-${Date.now()}`;
    const place = await createLocationRecord({
      name: `Track preview trail ${suffix}`,
      region: 'Dubai',
      activityType: ActivityType.HIKING,
      status: LocationStatus.ACTIVE,
      featured: false,
      latitude: 25.1,
      longitude: 55.2,
      countryCode: 'AE',
      images: ['https://example.com/trail-track.jpg'],
      tags: [],
      registryListed: true,
      areaId: 'area-test-dubai',
      description: 'Contract place for public track preview.',
      gpxKey: 'places/test-route.gpx',
    });

    await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PLACE_TRACKS)
      .updateOne(
        { _id: place.id },
        {
          $set: {
            gpxKey: 'places/test-route.gpx',
            bbox: [55.19, 25.09, 55.21, 25.11] as [number, number, number, number],
            polyline: '_p~iF~ps|U',
            profile: [
              [0, 100],
              [1000, 350],
            ] as [number, number][],
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

    const visitor = await registerVerifiedVisitor(app, `${suffix}-track`);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: visitor.email, password: visitor.password });
    const token = login.body.tokens.accessToken as string;

    const response = await request(app)
      .get(`/api/places/${place.id}/track`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      bbox: [55.19, 25.09, 55.21, 25.11],
      polyline: '_p~iF~ps|U',
      profile: [
        [0, 100],
        [1000, 350],
      ],
    });
    expect(response.body.data?.gpxKey).toBeUndefined();
  });
});
