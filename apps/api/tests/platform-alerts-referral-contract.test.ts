import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { LocationStatus } from '../src/domain/enums.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { createFacilityRecord } from '../src/lib/facilities-store.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { bootstrapTestApp, configureTestEnv } from './helpers/bootstrap.js';

let app: Express;

afterAll(async () => {
  const db = getMongoClient()!.db();
  await db.collection(COLLECTIONS.PLATFORM_ALERTS).deleteMany({ title: /^Contract test alert/ });
  await db.collection(COLLECTIONS.REFERRAL_CLICKS).deleteMany({ entityId: /^ctr-/ });
});

beforeAll(async () => {
  configureTestEnv();
  app = await bootstrapTestApp();
});

describe('GET /alerts/active', () => {
  it('returns matching global and point-scoped rows', async () => {
    const db = getMongoClient()!.db();
    const now = new Date();
    const starts = new Date(now.getTime() - 60_000);
    const ends = new Date(now.getTime() + 86_400_000);

    await db.collection(COLLECTIONS.PLATFORM_ALERTS).insertMany([
      {
        _id: `ctr-alert-global-${Date.now()}`,
        active: true,
        severity: 'warning',
        title: 'Contract test alert global',
        body: 'Heat advisory for outdoor outings.',
        scope: 'global',
        startsAt: starts,
        endsAt: ends,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: `ctr-alert-point-${Date.now()}`,
        active: true,
        severity: 'info',
        title: 'Contract test alert local',
        body: 'Trailhead maintenance this week.',
        scope: 'point',
        geo: { type: 'Point', coordinates: [55.28, 25.2] },
        radiusMeters: 50_000,
        startsAt: starts,
        endsAt: ends,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const res = await request(app).get('/api/alerts/active').query({ lat: 25.2, lng: 55.28, radiusKm: 120 });
    expect(res.status).toBe(200);
    const titles = (res.body.data as Array<{ title: string }>).map((r) => r.title);
    expect(titles.some((t) => t.includes('Contract test alert global'))).toBe(true);
    expect(titles.some((t) => t.includes('Contract test alert local'))).toBe(true);
  });
});

describe('POST /referrals/click', () => {
  it('returns 204 when destination matches facility partnerReferralUrl', async () => {
    const partner = 'https://example.com/partner/contract-offer';
    const facility = await createFacilityRecord({
      name: `Contract referral facility ${Date.now()}`,
      region: 'Dubai',
      areaId: 'area-test-dubai',
      facilityKind: 'outdoor_shop',
      parentPlaceId: null,
      description: 'Contract test commercial facility for referral click intake.',
      latitude: 25.11,
      longitude: 55.21,
      images: ['https://example.com/facility-contract.jpg'],
      partnerReferralUrl: partner,
      registeredByUserId: 'contract-user',
      status: LocationStatus.ACTIVE,
    });

    const res = await request(app).post('/api/referrals/click').send({
      entityKind: 'facility',
      entityId: facility.id,
      destinationUrl: partner,
      source: 'partner_link',
    });
    expect(res.status).toBe(204);

    const row = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.REFERRAL_CLICKS)
      .findOne({ entityId: facility.id });
    expect(row?.destinationUrl).toBe(partner);
  });

  it('returns 400 when destination does not match', async () => {
    const facility = await createFacilityRecord({
      name: `Contract mismatch facility ${Date.now()}`,
      region: 'Dubai',
      areaId: 'area-test-dubai',
      facilityKind: 'food',
      parentPlaceId: null,
      description: 'Contract test facility with mismatched referral target.',
      latitude: 25.12,
      longitude: 55.22,
      images: ['https://example.com/facility-contract-mismatch.jpg'],
      partnerReferralUrl: 'https://example.com/expected-only',
      registeredByUserId: 'contract-user',
      status: LocationStatus.ACTIVE,
    });

    const res = await request(app).post('/api/referrals/click').send({
      entityKind: 'facility',
      entityId: facility.id,
      destinationUrl: 'https://evil.example.com/phish',
    });
    expect(res.status).toBe(400);
  });
});
