import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ActivityType, Difficulty, LocationStatus } from '../src/domain/enums.js';
import { createLocationRecord } from '../src/lib/events-store.js';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { getVerificationOtp } from './helpers/fixtures.js';

let app: Express;
let accessToken = '';
let locationId = '';

beforeAll(async () => {
  app = await bootstrapTestApp();

  const location = await createLocationRecord({
    name: 'Premium Test Trail',
    region: 'Dubai',
    activityType: ActivityType.HIKING,
    description: 'Integration test location for premium unlock',
    difficulty: Difficulty.EASY,
    season: ['winter'],
    images: ['https://example.com/img.jpg'],
    highlights: [],
    surfaceType: [],
    tags: [],
    accessibleBy: [],
    status: LocationStatus.ACTIVE,
    unlockPriceAed: 29
  });
  locationId = location.id;

  const email = `premium-test-${Date.now()}@example.com`;
  await request(app)
    .post('/api/v1/auth/register')
    .send({
      email,
      password: 'TestPass1',
      displayName: 'Premium Test',
      accountType: 'visitor'
    });

  const verifyRes = await request(app)
    .post('/api/v1/auth/verify-email')
    .send({ email, otp: getVerificationOtp(email) });

  accessToken = verifyRes.body.tokens.accessToken;
});

describe('premium unlock security', () => {
  it('rejects direct unlock without checkout', async () => {
    const response = await request(app)
      .post(`/api/v1/locations/${locationId}/premium/unlock`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(402);
    expect(response.body.error?.code).toBe('payment_required');
  });
});
