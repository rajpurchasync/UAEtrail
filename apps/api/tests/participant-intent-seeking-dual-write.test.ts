import { beforeAll, describe, expect, it } from 'vitest';
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

describe('participant intent seeking dual-write (M1)', () => {
  it('creates a published seeking activity linked to the intent', async () => {
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
    expect(intentDoc?.seekingActivityId).toBeTruthy();

    const activity = await findActivityDocInMongo(intentDoc!.seekingActivityId as string);
    expect(activity?.activityMode).toBe('seeking');
    expect(activity?.participantIntentId).toBe(intent.id);
    expect(activity?.status).toBe('PUBLISHED');
  });
});
