import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { createParticipantIntent } from '../src/lib/participant-intents-store.js';
import { createAuthUser } from '../src/lib/auth-users.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

describe('GET /api/v1/explore/map seeking projection (M0)', () => {
  it('emits participant intents as activity + activityMode seeking', async () => {
    const suffix = `seek-proj-${Date.now()}`;
    const user = await createAuthUser({
      email: `seeker-${suffix}@test.local`,
      passwordHash: await bcrypt.hash('TestPass1', 10),
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Seeker', phone: null, bio: null, avatarUrl: null },
    });

    const intent = await createParticipantIntent(user._id, {
      kind: 'hiking',
      title: `Crew for Hatta ${suffix}`,
      date: '2026-12-20',
      time: '07:00',
      partySize: 4,
      comment: 'Looking for company',
      latitude: 25.12,
      longitude: 55.21,
      locationPrecision: 'specific',
    });

    await invalidateExploreMapCache();

    const response = await request(app).get('/api/v1/explore/map');
    expect(response.status).toBe(200);

    const items = response.body.data.items as Array<{
      id: string;
      source: string;
      activityMode?: string;
      participantIntentId?: string;
      composeIntent?: string | null;
    }>;

    const row = items.find((item) => item.id === `demand:${intent.id}`);
    expect(row).toBeDefined();
    expect(row?.source).toBe('activity');
    expect(row?.activityMode).toBe('seeking');
    expect(row?.participantIntentId).toBe(intent.id);
    expect(row?.composeIntent).toBe('demand');
  });
});
