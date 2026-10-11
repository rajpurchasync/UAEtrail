import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { createParticipantIntent } from '../src/lib/participant-intents-store.js';
import { findActivityDocInMongo } from '../src/lib/entity-sync.js';
import { createAuthUser } from '../src/lib/auth-users.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';

const ENV_KEY = 'PARTICIPANT_INTENT_STUB_WRITE';

beforeAll(async () => {
  await bootstrapTestApp();
});

describe('Find create (activity-canonical — stub write off)', () => {
  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it('creates seeking activity only (no participant_intents row)', async () => {
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

    const intent = await createParticipantIntent(user._id, {
      kind: 'hiking',
      title: `Find post ${suffix}`,
      date: '2026-12-22',
      time: '07:00',
      preferredArea: 'Hatta',
      partySize: 2,
      comment: 'Looking for company',
      latitude: 24.85,
      longitude: 56.12,
      locationPrecision: 'specific',
    });

    expect(intent.activityId ?? intent.seekingActivityId).toBeTruthy();
    const activityId = (intent.activityId ?? intent.seekingActivityId) as string;

    const intentDoc = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENTS)
      .findOne({ _id: intent.id });
    expect(intentDoc).toBeNull();

    const activity = await findActivityDocInMongo(activityId);
    expect(activity?.activityMode).toBe('seeking');
    expect(activity?.participantIntentId).toBe(intent.id);
    expect(activity?.status).toBe('PUBLISHED');
  });
});
