import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { createParticipantIntent } from '../src/lib/participant-intents-store.js';
import { createAuthUser } from '../src/lib/auth-users-store.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import {
  buildTestParticipantIntentInput,
  ensureCuratedAreasSeeded,
} from './helpers/test-seed.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});

describe('GET /api/explore/map seeking projection (M0)', () => {
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

    const intent = await createParticipantIntent(
      user._id,
      buildTestParticipantIntentInput({
        title: `Crew for Hatta ${suffix}`,
        partySize: 4,
        latitude: 25.12,
        longitude: 55.21,
      })
    );

    await invalidateExploreMapCache();

    const response = await request(app).get('/api/explore/map');
    expect(response.status).toBe(200);

    const items = response.body.data.items as Array<{
      id: string;
      source: string;
      activityMode?: string;
      participantIntentId?: string;
      composeIntent?: string | null;
    }>;

    const row = items.find((item) => item.participantIntentId === intent.id);
    expect(row).toBeDefined();
    expect(row?.id.startsWith('activity:')).toBe(true);
    expect(row?.source).toBe('activity');
    expect(row?.activityMode).toBe('seeking');
    expect(row?.composeIntent).toBe('seek');
    expect(items.some((item) => item.id === `demand:${intent.id}`)).toBe(false);
  });
});
