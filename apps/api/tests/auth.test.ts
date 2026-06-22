import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { REFRESH_COOKIE_NAME } from '../src/lib/auth-cookies.js';
import { bootstrapTestApp } from './helpers/bootstrap.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

describe('auth integration', () => {
  const email = `auth-test-${Date.now()}@example.com`;
  const password = 'TestPass1';
  let accessToken = '';
  let refreshCookie = '';

  it('registers a new user and sets refresh cookie', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
        displayName: 'Auth Test User',
        accountType: 'visitor'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(email);
    expect(response.body.tokens.accessToken).toBeTruthy();
    expect(response.body.tokens.refreshToken).toBeUndefined();
    expect(response.body.verificationToken).toBeTruthy();

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: response.body.verificationToken });
    expect(verifyRes.status).toBe(200);

    const cookies = response.headers['set-cookie'];
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies ?? '';
    expect(cookieHeader).toContain(REFRESH_COOKIE_NAME);

    accessToken = response.body.tokens.accessToken;
    refreshCookie = cookieHeader.split(';')[0];
  });

  it('logs in and returns access token with refresh cookie', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.tokens.accessToken).toBeTruthy();
    expect(response.body.tokens.refreshToken).toBeUndefined();

    const cookies = response.headers['set-cookie'];
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies ?? '';
    expect(cookieHeader).toContain(REFRESH_COOKIE_NAME);

    accessToken = response.body.tokens.accessToken;
    refreshCookie = cookieHeader.split(';')[0];
  });

  it('refreshes access token using httpOnly cookie', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(response.status).toBe(200);
    expect(response.body.tokens.accessToken).toBeTruthy();
    expect(response.body.tokens.refreshToken).toBeUndefined();
    accessToken = response.body.tokens.accessToken;

    const cookies = response.headers['set-cookie'];
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies ?? '';
    if (cookieHeader.includes(REFRESH_COOKIE_NAME)) {
      refreshCookie = cookieHeader.split(';')[0];
    }
  });

  it('accesses protected profile with bearer token', async () => {
    const response = await request(app)
      .get('/api/v1/me/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe(email);
  });

  it('logs out and clears refresh cookie', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshCookie);

    expect(response.status).toBe(204);
  });
});
