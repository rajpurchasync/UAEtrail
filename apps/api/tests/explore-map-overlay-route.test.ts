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

describe('GET /api/explore/map vs GET /api/me/discover/overlay (COH-08)', () => {
  it('keeps the public map guest-level and puts host peek on the overlay', async () => {
    const suffix = `explore-overlay-${Date.now()}`;
    const fixture = await createPublishedEventFixture(suffix);

    await getMongoClient()!
      .db()
      .collection('activities')
      .updateOne(
        { _id: fixture.activityId },
        { $set: { meetingLat: 25.118, meetingLng: 55.201, joinMode: 'open' } }
      );

    await invalidateExploreMapCache();

    const pinId = `activity:${fixture.activityId}`;
    const publicMap = await request(app).get('/api/explore/map');
    expect(publicMap.status).toBe(200);
    const publicPin = (
      publicMap.body.data.items as Array<{ id: string; viewerAccess?: { level?: string } }>
    ).find((item) => item.id === pinId);
    expect(publicPin?.viewerAccess).toBeUndefined();

    const unauth = await request(app).get('/api/me/discover/overlay');
    expect(unauth.status).toBe(401);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: `org-${suffix}@test.local`, password: 'TestPass1' });
    expect(login.status).toBe(200);
    const token = login.body.tokens.accessToken as string;

    const signedMap = await request(app)
      .get('/api/explore/map')
      .set('Authorization', `Bearer ${token}`);
    expect(signedMap.status).toBe(200);
    const signedPin = (
      signedMap.body.data.items as Array<{ id: string; viewerAccess?: { level?: string } }>
    ).find((item) => item.id === pinId);
    expect(signedPin?.viewerAccess).toBeUndefined();

    const overlay = await request(app)
      .get('/api/me/discover/overlay')
      .set('Authorization', `Bearer ${token}`);
    expect(overlay.status).toBe(200);
    const overlayPin = (
      overlay.body.data.items as Array<{ id: string; viewerAccess?: { level?: string } }>
    ).find((item) => item.id === pinId);
    expect(overlayPin?.viewerAccess?.level).toBe('host');
  });
});
