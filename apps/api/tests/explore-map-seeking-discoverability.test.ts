import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { createAuthUser } from '../src/lib/auth-users.js';
import { createParticipantIntent } from '../src/lib/participant-intents-store.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';
import { patchActivityInMongo } from '../src/lib/entity-sync.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { buildTestParticipantIntentInput, ensureCuratedAreasSeeded } from './helpers/test-seed.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});

describe('GET /api/v1/explore/map seeking discoverability', () => {
  it('includes published seeking activities even when startAt is before today', async () => {
    const suffix = `seek-past-${Date.now()}`;
    const user = await createAuthUser({
      email: `seeker-past-${suffix}@test.local`,
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
        title: `Past start seeking ${suffix}`,
        partySize: 2,
      })
    );

    const past = new Date();
    past.setDate(past.getDate() - 14);
    past.setHours(9, 0, 0, 0);
    await patchActivityInMongo(intent.seekingActivityId!, { startAt: past });
    await invalidateExploreMapCache();

    const response = await request(app).get('/api/v1/explore/map');
    expect(response.status).toBe(200);
    const items = response.body.data.items as Array<{
      id: string;
      activityMode?: string;
      participantIntentId?: string;
    }>;
    const row = items.find((item) => item.participantIntentId === intent.id);
    expect(row).toBeDefined();
    expect(row?.activityMode).toBe('seeking');
  });
});
