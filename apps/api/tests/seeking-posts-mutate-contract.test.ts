/**
 * Legacy `/me/seeking-posts` mutate routes retired (MIG-DISCO-REG).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { createAuthUser } from '../src/lib/auth-users-store.js';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

const authToken = async (): Promise<string> => {
  const suffix = `seek-mut-${Date.now()}`;
  const password = 'TestPass1!';
  const hash = await bcrypt.hash(password, 10);
  const user = await createAuthUser({
    email: `seek-mut-${suffix}@test.local`,
    passwordHash: hash,
    googleId: null,
    authProvider: 'EMAIL',
    role: UserRole.PARTICIPANT,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    referralCode: generateReferralCode(),
    profile: { displayName: 'Seeker', phone: null, bio: null, avatarUrl: null },
  });
  const login = await request(app).post('/api/auth/login').send({ email: user.email, password });
  expect(login.status).toBe(200);
  return login.body.tokens.accessToken as string;
};

describe('PATCH /me/seeking-posts/:postId (retired)', () => {
  it('returns 404', async () => {
    const token = await authToken();
    const response = await request(app)
      .patch('/api/me/seeking-posts/does-not-exist')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'nope' });
    expect(response.status).toBe(404);
  });
});

describe('POST /me/seeking-posts/:postId/cancel (retired)', () => {
  it('returns 404', async () => {
    const token = await authToken();
    const response = await request(app)
      .post('/api/me/seeking-posts/does-not-exist/cancel')
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(response.status).toBe(404);
  });
});