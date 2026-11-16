/**
 * Legacy `/me/seeking-posts` retired — crew writes use `PUT /me/availability` (MIG-DISCO-REG).
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

describe('POST /me/seeking-posts (retired)', () => {
  it('returns 404 — use PUT /me/availability for Find crew fixed posts', async () => {
    const suffix = `seeking-posts-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `seeking-retire-${suffix}@test.local`,
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
    const token = login.body.tokens.accessToken as string;

    const response = await request(app)
      .post('/api/me/seeking-posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        kind: 'hiking',
        title: `Find via seeking-posts ${suffix}`,
        latitude: 25.1,
        longitude: 55.2,
      });
    expect(response.status).toBe(404);
  });
});