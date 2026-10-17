import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { buildTestParticipantIntentInput, ensureCuratedAreasSeeded } from './helpers/test-seed.js';

beforeAll(async () => {
  await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});
import { createParticipantIntent } from '../src/lib/participant-intents-store.js';
import { findActivityDocInMongo } from '../src/lib/entity-sync.js';
import { createAuthUser } from '../src/lib/auth-users.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';

const ENV_KEY = 'PARTICIPANT_INTENT_STUB_WRITE';

describe('participant intent create (COH-01 — activities only)', () => {
  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it('creates seeking activity only (no participant_intents row, even if stub env set)', async () => {
    process.env[ENV_KEY] = 'true';
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

    const intent = await createParticipantIntent(
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
    );

    const intentDoc = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENTS)
      .findOne({ _id: intent.id });
    expect(intentDoc).toBeNull();

    const publishedActivityId = intent.activityId ?? intent.seekingActivityId;
    expect(publishedActivityId).toBeTruthy();

    const activity = await findActivityDocInMongo(publishedActivityId!);
    expect(activity?.activityMode).toBe('seeking');
    expect(activity?.participantIntentId).toBe(intent.id);
  });
});
