import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ActivityType, LocationStatus } from '../src/domain/enums.js';
import { createLocationRecord } from '../src/lib/activities-store.js';
import { createFacilityRecord } from '../src/lib/facilities-store.js';
import { bootstrapTestApp, configureTestEnv } from './helpers/bootstrap.js';

let app: Express;

beforeAll(async () => {
  configureTestEnv();
  app = await bootstrapTestApp();
});

describe('facility catalog API (CPC-3)', () => {
  it('lists catalog rows and returns facility detail with viewerAccess', async () => {
    const suffix = `fc-${Date.now()}`;
    const anchor = await createLocationRecord({
      name: `Anchor trail ${suffix}`,
      region: 'Dubai',
      activityType: ActivityType.HIKING,
      status: LocationStatus.ACTIVE,
      featured: false,
      latitude: 25.12,
      longitude: 55.22,
      countryCode: 'AE',
      images: ['https://example.com/anchor-trail.jpg'],
      registryListed: true,
      areaId: 'area-test-dubai',
      description: 'Anchor place for facility catalog contract test on parentPlaceId reads.',
    });

    const facility = await createFacilityRecord({
      name: `Trail toilet ${suffix}`,
      region: 'Dubai',
      areaId: 'area-test-dubai',
      facilityKind: 'toilet',
      parentPlaceId: anchor.id,
      description: 'Public toilet facility linked to the anchor trail for contract coverage.',
      latitude: 25.121,
      longitude: 55.221,
      images: ['https://example.com/facility-toilet.jpg'],
      registeredByUserId: 'contract-user',
      status: LocationStatus.ACTIVE,
    });

    const catalog = await request(app).get(
      `/api/facilities/catalog?parentPlaceId=${anchor.id}`
    );
    expect(catalog.status).toBe(200);
    expect(catalog.body.data.some((row: { id: string }) => row.id === facility.id)).toBe(true);

    const detail = await request(app).get(`/api/facilities/${facility.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.facilityKind).toBe('toilet');
    expect(detail.body.viewerAccess?.level).toBe('public');

    const placeDetail = await request(app).get(`/api/places/${anchor.id}`);
    expect(placeDetail.status).toBe(200);
    expect(placeDetail.body.data.submittedById).toBeUndefined();
    const nearby = placeDetail.body.nearbyFacilities as Array<{ id: string; path: string }>;
    expect(nearby.some((row) => row.id === facility.id)).toBe(true);
    expect(nearby.find((row) => row.id === facility.id)?.path).toContain('/facility/');
  });
});
