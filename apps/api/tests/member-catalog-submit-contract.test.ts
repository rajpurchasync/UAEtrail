import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp, configureTestEnv } from './helpers/bootstrap.js';
import { registerVerifiedVisitor } from './helpers/fixtures.js';
import { defaultTestAreaId, ensureCuratedAreasSeeded } from './helpers/test-seed.js';
import { getMongoClient } from '../src/lib/mongo.js';

let app: Express;

beforeAll(async () => {
  configureTestEnv();
  app = await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});

const placeSubmitBody = (suffix: string) => ({
  name: `Member trail ${suffix}`,
  countryCode: 'AE',
  emirate: 'Dubai',
  region: 'Dubai',
  areaId: defaultTestAreaId(),
  activityType: 'hiking',
  description: 'Member-submitted hiking place for catalog submit contract coverage.',
  latitude: 25.1,
  longitude: 55.2,
  images: ['https://example.com/trail-member.jpg'],
});

describe('member catalog submit (CPC-4)', () => {
  it('accepts POST /me/places and legacy POST /me/locations alias', async () => {
    const suffix = `mcs-${Date.now()}`;
    const member = await registerVerifiedVisitor(app, suffix);

    const canonical = await request(app)
      .post('/api/me/places')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send(placeSubmitBody(`${suffix}-canonical`));
    expect(canonical.status).toBe(201);
    expect(canonical.body.data.id).toBeTruthy();

    const legacy = await request(app)
      .post('/api/me/locations')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send(placeSubmitBody(`${suffix}-legacy`));
    expect(legacy.status).toBe(201);
    expect(legacy.body.data.id).toBeTruthy();
  });

  it('rejects facilityKind on POST /me/places', async () => {
    const suffix = `mcs-fac-${Date.now()}`;
    const member = await registerVerifiedVisitor(app, suffix);

    const res = await request(app)
      .post('/api/me/places')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({
        ...placeSubmitBody(suffix),
        activityType: 'event',
        facilityKind: 'toilet',
      });
    expect(res.status).toBe(400);
  });

  it('creates facility via POST /me/facilities', async () => {
    const suffix = `mcs-amenity-${Date.now()}`;
    const member = await registerVerifiedVisitor(app, suffix);

    const res = await request(app)
      .post('/api/me/facilities')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({
        name: `Trail toilet ${suffix}`,
        countryCode: 'AE',
        emirate: 'Dubai',
        region: 'Dubai',
        areaId: defaultTestAreaId(),
        activityType: 'event',
        facilityKind: 'toilet',
        description: 'Member-submitted toilet facility for CPC-4 contract coverage.',
        latitude: 25.101,
        longitude: 55.201,
        images: ['https://example.com/facility-member.jpg'],
      });
    expect(res.status).toBe(201);
    expect(res.body.data.facilityKind).toBe('toilet');

    const detail = await request(app)
      .get(`/api/facilities/${res.body.data.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(detail.status).toBe(200);

    const locationRow = await getMongoClient()!
      .db()
      .collection('locations')
      .findOne({ _id: res.body.data.id });
    expect(locationRow).toBeNull();
  });
});
