import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import bcrypt from 'bcryptjs';
import { DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION } from '@uaetrail/shared-types';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { createAuthUser } from '../src/lib/auth-users-store.js';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { generateReferralCode } from '../src/lib/referral-code.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

const signInToken = async (email: string, password: string): Promise<string> => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  return res.body.tokens.accessToken as string;
};

describe('GET /discover/recommendations', () => {
  it('returns map surface for guests (optionalAuth)', async () => {
    const res = await request(app).get('/api/discover/recommendations?surface=map&limit=3');
    expect(res.status).toBe(200);
    expect(res.body.data.schemaVersion).toBe(DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION);
    expect(res.body.data.surface).toBe('map');
    expect(Array.isArray(res.body.data.rows)).toBe(true);
    for (const row of res.body.data.rows) {
      expect(row).toMatchObject({
        exploreItemId: expect.any(String),
        score: expect.any(Number),
        signals: expect.any(Array),
      });
    }
  });

  it('requires auth for surface=crew', async () => {
    const res = await request(app).get('/api/discover/recommendations?surface=crew');
    expect(res.status).toBe(401);
  });

  it('returns crew surface for signed-in members', async () => {
    const suffix = `disc-rec-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `disc-rec-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Rec Member', phone: null, bio: null, avatarUrl: null },
    });
    const token = await signInToken(user.email, password);

    const today = new Date().toISOString().slice(0, 10);
    const res = await request(app)
      .get(`/api/discover/recommendations?surface=crew&from=${today}&to=${today}&limit=5`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.schemaVersion).toBe(DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION);
    expect(res.body.data.surface).toBe('crew');
    expect(Array.isArray(res.body.data.rows)).toBe(true);
    for (const row of res.body.data.rows) {
      expect(row).toMatchObject({
        userId: expect.any(String),
        bucket: expect.stringMatching(/^(friends_going|hosts_going|availability|directory)$/),
        score: expect.any(Number),
      });
    }
  });
});