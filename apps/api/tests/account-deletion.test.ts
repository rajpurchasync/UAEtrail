import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { getVerificationOtp } from './helpers/fixtures.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

describe('account deletion', () => {
  const email = `delete-test-${Date.now()}@example.com`;
  const password = 'TestPass1';
  let accessToken = '';
  let refreshCookie = '';

  it('registers and verifies a user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
        displayName: 'Delete Test User',
        accountType: 'visitor'
      });

    expect(response.status).toBe(201);

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email, otp: getVerificationOtp(email) });

    expect(verifyRes.status).toBe(200);
    accessToken = verifyRes.body.tokens.accessToken;
    const cookies = verifyRes.headers['set-cookie'];
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies ?? '';
    refreshCookie = cookieHeader.split(';')[0];
  });

  it('returns deletion info for the authenticated user', async () => {
    const response = await request(app)
      .get('/api/v1/me/account/deletion-info')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.canDelete).toBe(true);
    expect(response.body.data.requiresPassword).toBe(true);
  });

  it('deletes the account and blocks subsequent login', async () => {
    const deleteRes = await request(app)
      .delete('/api/v1/me/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password });

    expect(deleteRes.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    expect(loginRes.status).toBe(401);

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshRes.status).toBe(401);
  });
});

describe('data export', () => {
  it('exports user data as JSON attachment', async () => {
    const email = `export-test-${Date.now()}@example.com`;
    const password = 'TestPass1';

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
        displayName: 'Export Test User',
        accountType: 'visitor'
      });

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email, otp: getVerificationOtp(email) });

    const token = verifyRes.body.tokens.accessToken;

    const response = await request(app)
      .get('/api/v1/me/export')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.headers['content-disposition']).toMatch(/attachment/);
    const body = JSON.parse(response.text);
    expect(body.account.email).toBe(email);
    expect(body.exportedAt).toBeTruthy();
  });
});

describe('content reports', () => {
  const email = `report-test-${Date.now()}@example.com`;
  const password = 'TestPass1';
  let accessToken = '';

  it('accepts a content report from an authenticated user', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
        displayName: 'Report Test User',
        accountType: 'visitor'
      });

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email, otp: getVerificationOtp(email) });

    accessToken = verifyRes.body.tokens.accessToken;

    const response = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        targetType: 'user',
        targetId: '00000000-0000-0000-0000-000000000099',
        reason: 'spam',
        details: 'Test report'
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toMatch(/review/i);
  });
});
