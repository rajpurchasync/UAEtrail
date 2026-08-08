import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { UserRole } from '../src/domain/enums.js';
import { REFRESH_COOKIE_NAME } from '../src/lib/auth-cookies.js';
import { findAuthUserByEmail, updateAuthUserCore } from '../src/lib/auth-users.js';
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

  it('preserves the same account identity when switching roles', async () => {
    const switchEmail = `role-switch-${Date.now()}@example.com`;
    const switchPassword = 'RoleSwitch1';

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: switchEmail,
        password: switchPassword,
        displayName: 'Role Switch User',
        accountType: 'visitor'
      });

    expect(registerRes.status).toBe(201);

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: registerRes.body.verificationToken });
    expect(verifyRes.status).toBe(200);

    const createdUser = await findAuthUserByEmail(switchEmail);
    expect(createdUser).toBeTruthy();

    await updateAuthUserCore({ userId: createdUser!._id, role: UserRole.PLATFORM_ADMIN });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: switchEmail, password: switchPassword });

    expect(loginRes.status).toBe(200);

    const switchVisitorRes = await request(app)
      .post('/api/v1/me/role/switch')
      .set('Authorization', `Bearer ${loginRes.body.tokens.accessToken}`)
      .send({ target: 'visitor' });

    expect(switchVisitorRes.status).toBe(200);
    expect(switchVisitorRes.body.data.role).toBe('visitor');
    expect(switchVisitorRes.body.data.switchedFromRole).toBe('platform_admin');

    const visitorProfileRes = await request(app)
      .get('/api/v1/me/profile')
      .set('Authorization', `Bearer ${switchVisitorRes.body.tokens.accessToken}`);

    expect(visitorProfileRes.status).toBe(200);
    expect(visitorProfileRes.body.data.id).toBe(createdUser!._id);
    expect(visitorProfileRes.body.data.role).toBe('visitor');
    expect(visitorProfileRes.body.data.switchedFromRole).toBe('platform_admin');

    const restoreRes = await request(app)
      .post('/api/v1/me/role/switch')
      .set('Authorization', `Bearer ${switchVisitorRes.body.tokens.accessToken}`)
      .send({ target: 'original' });

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.role).toBe('platform_admin');
    expect(restoreRes.body.data.switchedFromRole).toBeNull();

    const restoredProfileRes = await request(app)
      .get('/api/v1/me/profile')
      .set('Authorization', `Bearer ${restoreRes.body.tokens.accessToken}`);

    expect(restoredProfileRes.status).toBe(200);
    expect(restoredProfileRes.body.data.id).toBe(createdUser!._id);
    expect(restoredProfileRes.body.data.role).toBe('platform_admin');
    expect(restoredProfileRes.body.data.switchedFromRole).toBeNull();
  });

  it('logs out and clears refresh cookie', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshCookie);

    expect(response.status).toBe(204);
  });
});
