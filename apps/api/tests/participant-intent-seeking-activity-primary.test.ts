import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { createParticipantIntent } from '../src/lib/participant-intents-store.js';
import { createAuthUser } from '../src/lib/auth-users-store.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { buildTestParticipantIntentInput, ensureCuratedAreasSeeded } from './helpers/test-seed.js';

const ENV_KEY = 'PARTICIPANT_INTENT_STUB_WRITE';

beforeAll(async () => {
  await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});

describe('Find create retired (MIG-DISCO-REG)', () => {
  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it('rejects legacy participant-intent create (no new activityMode seeking)', async () => {
    delete process.env[ENV_KEY];
    const suffix = `primary-${Date.now()}`;
    const user = await createAuthUser({
      email: `primary-${suffix}@test.local`,
      passwordHash: await bcrypt.hash('TestPass1', 10),
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Seeker', phone: null, bio: null, avatarUrl: null },
    });

    await expect(
      createParticipantIntent(
        user._id,
        buildTestParticipantIntentInput({
          title: `Find post ${suffix}`,
          date: '2026-12-22',
          latitude: 24.85,
          longitude: 56.12,
        })
      )
    ).rejects.toThrow(/activity_mode_seeking_retired/);
  });
});