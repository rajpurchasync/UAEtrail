import { beforeAll, describe, expect, it } from 'vitest';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { buildTestParticipantIntentInput, ensureCuratedAreasSeeded } from './helpers/test-seed.js';
import { createParticipantIntent } from '../src/lib/participant-intents-store.js';
import { createAuthUser } from '../src/lib/auth-users-store.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '../src/domain/enums.js';

beforeAll(async () => {
  await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});

describe('participant intent create (MIG-DISCO-REG retired)', () => {
  it('rejects legacy create (member_availability is product path)', async () => {
    const suffix = `coh01-${Date.now()}`;
    const user = await createAuthUser({
      email: `coh01-${suffix}@test.local`,
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
          title: `Activity only ${suffix}`,
          date: '2026-12-21',
          time: '08:00',
          preferredArea: 'Wadi Shawka',
          partySize: 3,
          comment: 'Need a hiking buddy for integration test.',
          latitude: 25.1,
          longitude: 55.2,
        })
      )
    ).rejects.toMatchObject({ code: 'activity_mode_seeking_retired' });
  });
});