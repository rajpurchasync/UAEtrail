import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { LocationStatus } from '../src/domain/enums.js';
import { createFacilityRecord } from '../src/lib/facilities-store.js';
import { bootstrapTestApp, configureTestEnv } from './helpers/bootstrap.js';
import { registerVerifiedVisitor } from './helpers/fixtures.js';

let app: Express;

beforeAll(async () => {
  configureTestEnv();
  app = await bootstrapTestApp();
});

describe('facility condition reports', () => {
  it('enriches detail, requires photo, and blocks duplicate pending condition', async () => {
    const suffix = `amenity-${Date.now()}`;
    const visitor = await registerVerifiedVisitor(app, suffix);
    const visitor2 = await registerVerifiedVisitor(app, `${suffix}-b`);
    const auth = { Authorization: `Bearer ${visitor.accessToken}` };
    const auth2 = { Authorization: `Bearer ${visitor2.accessToken}` };
    const photo = 'https://example.com/facility-condition.jpg';

    const facility = await createFacilityRecord({
      name: `Trail toilet ${suffix}`,
      region: 'Dubai',
      areaId: 'area-test-dubai',
      facilityKind: 'toilet',
      description: 'Contract facility for amenity condition reports.',
      latitude: 25.121,
      longitude: 55.221,
      images: ['https://example.com/facility-toilet.jpg'],
      registeredByUserId: 'contract-user',
      status: LocationStatus.ACTIVE,
    });

    const before = await request(app).get(`/api/facilities/${facility.id}`);
    expect(before.status).toBe(200);
    expect(before.body.data.lastReportedAmenityState ?? null).toBeNull();
    expect(before.body.data.pendingAmenityReview ?? null).toBeNull();

    const missingPhoto = await request(app)
      .post(`/api/facilities/${facility.id}/condition-reports`)
      .set(auth)
      .send({ amenityState: 'not_working', note: 'Dry tap' });
    expect(missingPhoto.status).toBe(400);

    const created = await request(app)
      .post(`/api/facilities/${facility.id}/condition-reports`)
      .set(auth)
      .send({ amenityState: 'not_working', note: 'Dry tap', photoUrl: photo });
    expect(created.status).toBe(201);

    const after = await request(app).get(`/api/facilities/${facility.id}`);
    expect(after.status).toBe(200);
    expect(after.body.data.lastReportedAmenityState).toBe('not_working');
    expect(after.body.data.pendingAmenityReview?.amenityState).toBe('not_working');

    const duplicate = await request(app)
      .post(`/api/facilities/${facility.id}/condition-reports`)
      .set(auth2)
      .send({ amenityState: 'not_working', photoUrl: photo });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error?.code).toBe('amenity_review_in_progress');

    const otherState = await request(app)
      .post(`/api/facilities/${facility.id}/condition-reports`)
      .set(auth2)
      .send({ amenityState: 'working', photoUrl: photo });
    expect(otherState.status).toBe(201);
  });
});
