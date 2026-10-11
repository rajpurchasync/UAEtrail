import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { bootstrapTestApp } from './helpers/bootstrap.js';

beforeAll(async () => {
  await bootstrapTestApp();
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

describe('participant intent seeking dual-write (legacy stub)', () => {
  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it('creates a published seeking activity linked to the intent stub row', async () => {
    process.env[ENV_KEY] = 'true';
    const suffix = `dual-${Date.now()}`;
    const user = await createAuthUser({
      email: `dual-${suffix}@test.local`,
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
      title: `Dual write ${suffix}`,
      date: '2026-12-21',
      time: '08:00',
      preferredArea: 'Wadi Shawka',
      partySize: 3,
      comment: 'Need a hiking buddy',
      latitude: 25.1,
      longitude: 55.2,
      locationPrecision: 'specific',
    });

    const intentDoc = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENTS)
      .findOne({ _id: intent.id });
    const publishedActivityId = intentDoc?.activityId ?? intentDoc?.seekingActivityId;
    expect(publishedActivityId).toBeTruthy();

    const activity = await findActivityDocInMongo(publishedActivityId as string);
    expect(activity?.activityMode).toBe('seeking');
    expect(activity?.participantIntentId).toBe(intent.id);
    expect(activity?.status).toBe('PUBLISHED');
  });
});
