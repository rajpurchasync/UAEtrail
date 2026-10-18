import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import bcrypt from 'bcryptjs';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { createAuthUser } from '../src/lib/auth-users-store.js';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import { MEMBER_COORDINATION_ATTENTION_KINDS } from '@uaetrail/shared-types';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

const signInToken = async (email: string, password: string): Promise<string> => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  return res.body.tokens.accessToken as string;
};

describe('GET /me/coordination-attention (G-manage API)', () => {
  it('returns typed empty items for member with no coordination signals', async () => {
    const suffix = `coord-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `coord-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Coord Member', phone: null, bio: null, avatarUrl: null },
    });

    const token = await signInToken(user.email, password);
    const res = await request(app)
      .get('/api/me/coordination-attention')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ items: [] });
  });

  it('items only use known kinds (no label/path on wire)', async () => {
    const suffix = `coord-kinds-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `coord-kinds-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Kinds', phone: null, bio: null, avatarUrl: null },
    });

    const token = await signInToken(user.email, password);
    const res = await request(app)
      .get('/api/me/coordination-attention')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const items = res.body.data?.items ?? [];
    for (const item of items) {
      expect(MEMBER_COORDINATION_ATTENTION_KINDS).toContain(item.kind);
      expect(item).not.toHaveProperty('label');
      expect(item).not.toHaveProperty('path');
    }
  });
});
