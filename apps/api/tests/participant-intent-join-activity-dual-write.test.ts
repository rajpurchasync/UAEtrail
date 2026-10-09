import { beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { createParticipantIntent } from '../src/lib/participant-intents-store.js';
import { createParticipantIntentJoinRequest } from '../src/lib/participant-intent-requests-store.js';
import { createAuthUser } from '../src/lib/auth-users.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';

beforeAll(async () => {
  await bootstrapTestApp();
});

describe('participant intent join dual-write (M2a)', () => {
  it('mirrors join request to activity_requests when seekingActivityId exists', async () => {
    const suffix = `join-mirror-${Date.now()}`;
    const host = await createAuthUser({
      email: `host-${suffix}@test.local`,
      passwordHash: await bcrypt.hash('TestPass1', 10),
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Host', phone: null, bio: null, avatarUrl: null },
    });
    const joiner = await createAuthUser({
      email: `joiner-${suffix}@test.local`,
      passwordHash: await bcrypt.hash('TestPass1', 10),
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Joiner', phone: null, bio: null, avatarUrl: null },
    });

    const intent = await createParticipantIntent(host._id, {
      kind: 'hiking',
      title: `Join mirror ${suffix}`,
      date: '2026-12-22',
      time: '08:00',
      preferredArea: 'Hatta',
      partySize: 4,
      comment: 'Looking for crew',
      latitude: 25.1,
      longitude: 55.2,
      locationPrecision: 'specific',
    });

    const intentDoc = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENTS)
      .findOne({ _id: intent.id });
    expect(intentDoc?.seekingActivityId).toBeTruthy();

    const joinRequest = await createParticipantIntentJoinRequest({
      intentId: intent.id,
      userId: joiner._id,
      note: 'Can I join?',
    });

    const requestDoc = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENT_REQUESTS)
      .findOne({ _id: joinRequest.id });
    expect(requestDoc?.activityRequestId).toBeTruthy();

    const activityRequest = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.ACTIVITY_REQUESTS)
      .findOne({ _id: requestDoc!.activityRequestId as string });
    expect(activityRequest?.activityId).toBe(intentDoc!.seekingActivityId);
    expect(activityRequest?.userId).toBe(joiner._id);
  });
});
