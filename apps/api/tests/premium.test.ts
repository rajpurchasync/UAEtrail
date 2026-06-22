import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';

let app: Express;
let accessToken = '';

beforeAll(async () => {
  app = await bootstrapTestApp();

  const email = `premium-test-${Date.now()}@example.com`;
  const register = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email,
      password: 'TestPass1',
      displayName: 'Premium Test',
      accountType: 'visitor',
    });

  await request(app)
    .post('/api/v1/auth/verify-email')
    .send({ token: register.body.verificationToken });

  accessToken = register.body.tokens.accessToken;
});

describe('premium unlock security', () => {
  it('rejects direct unlock without checkout', async () => {
    const locations = await request(app).get('/api/v1/locations?pageSize=1');
    expect(locations.status).toBe(200);
    const locationId = locations.body.data?.[0]?.id;
    expect(locationId).toBeTruthy();

    const response = await request(app)
      .post(`/api/v1/locations/${locationId}/premium/unlock`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(402);
    expect(response.body.error?.code).toBe('payment_required');
  });
});
