import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { createAuthUser } from '../src/lib/auth-users-store.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import { bootstrapTestApp } from './helpers/bootstrap.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

describe('GET /api/explore/map availability discoverability (MIG-DISCO-REG)', () => {
  it('includes fixed public availability when sources=availability', async () => {
    const suffix = `avail-map-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `avail-map-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Avail Member', phone: null, bio: null, avatarUrl: null },
    });

    const login = await request(app).post('/api/auth/login').send({ email: user.email, password });
    expect(login.status).toBe(200);
    const token = login.body.tokens.accessToken as string;

    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 2);
    const start = tomorrow.toISOString().slice(0, 10);

    const put = await request(app)
      .put('/api/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        kinds: ['hiking'],
        visibility: 'public',
        slots: [
          {
            scheduleKind: 'fixed',
            startDate: start,
            endDate: start,
            startAt: `${start}T09:00:00.000Z`,
            endAt: `${start}T11:00:00.000Z`,
            title: `Trail crew ${suffix}`,
            latitude: 25.12,
            longitude: 55.22,
            locationPrecision: 'specific',
            capacity: 'participant',
            modalities: ['hiking'],
          },
        ],
      });
    expect(put.status).toBe(200);

    await invalidateExploreMapCache();

    const response = await request(app).get('/api/explore/map?sources=availability');
    expect(response.status).toBe(200);
    const items = response.body.data.items as Array<{ id: string; source?: string; title?: string }>;
    const row = items.find((item) => item.id.startsWith(`availability:${user._id}:`));
    expect(row).toBeDefined();
    expect(row?.source).toBe('availability');
    expect(row?.title).toContain(suffix);
  });
});