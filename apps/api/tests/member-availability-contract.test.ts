import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { createAuthUser } from '../src/lib/auth-users.js';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

const signInToken = async (email: string, password: string): Promise<string> => {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  return res.body.tokens.accessToken as string;
};

describe('member availability', () => {
  it('PUT /me/availability persists slots and GET returns pruned future ranges', async () => {
    const suffix = `avail-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `avail-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Avail Member', phone: null, bio: null, avatarUrl: null },
    });

    const token = await signInToken(user.email, password);
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const start = tomorrow.toISOString().slice(0, 10);
    const end = start;

    const put = await request(app)
      .put('/api/v1/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        kinds: ['hiking'],
        visibility: 'public',
        slots: [{ startDate: start, endDate: end }],
      });
    expect(put.status).toBe(200);
    expect(put.body.data.slots).toHaveLength(1);

    const explore = await request(app).get(
      `/api/v1/explore/people/availability?from=${start}&to=${end}&kind=hiking`
    );
    expect(explore.status).toBe(200);
    expect(
      explore.body.data.people.some((p: { userId: string }) => p.userId === user._id)
    ).toBe(true);
    expect(explore.body.data.clusters.length).toBeGreaterThan(0);
  });

  it('buddies-only visibility hides rows from strangers', async () => {
    const suffix = `avail-bud-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);

    const owner = await createAuthUser({
      email: `avail-owner-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Owner', phone: null, bio: null, avatarUrl: null },
    });
    await createAuthUser({
      email: `avail-stranger-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Stranger', phone: null, bio: null, avatarUrl: null },
    });

    const ownerToken = await signInToken(owner.email, password);
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 2);
    const iso = start.toISOString().slice(0, 10);

    await request(app)
      .put('/api/v1/me/availability')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        kinds: ['camping'],
        visibility: 'buddies',
        slots: [{ startDate: iso, endDate: iso }],
      });

    const strangerRes = await request(app).get(
      `/api/v1/explore/people/availability?from=${iso}&to=${iso}`
    );
    expect(
      strangerRes.body.data.people.some((p: { userId: string }) => p.userId === owner._id)
    ).toBe(false);
  });
});
