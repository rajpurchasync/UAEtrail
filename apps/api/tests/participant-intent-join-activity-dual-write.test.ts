import { beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { createParticipantIntent } from '../src/lib/participant-intents-store.js';
import {
  approveParticipantIntentJoinRequest,
  createParticipantIntentJoinRequest,
  listParticipantIntentJoinRequestsForOwner,
} from '../src/lib/participant-intent-requests-store.js';
import { createAuthUser } from '../src/lib/auth-users-store.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { ensureCuratedAreasSeeded, testAreas } from './helpers/test-seed.js';

beforeAll(async () => {
  await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});

describe('participant intent join (M2c activity store)', () => {
  it('intent POST writes activity_requests only when activityId exists', async () => {
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
      areaId: testAreas.hatta.id,
    });

    const activityId = intent.activityId ?? intent.seekingActivityId;
    expect(activityId).toBeTruthy();

    const joinRequest = await createParticipantIntentJoinRequest({
      intentId: intent.id,
      userId: joiner._id,
      note: 'Can I join?',
    });

    const legacyDoc = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENT_REQUESTS)
      .findOne({ intentId: intent.id, userId: joiner._id });
    expect(legacyDoc).toBeNull();

    const activityRequest = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.ACTIVITY_REQUESTS)
      .findOne({ _id: joinRequest.id });
    expect(activityRequest?.activityId).toBe(activityId);
    expect(activityRequest?.userId).toBe(joiner._id);

    const listed = await listParticipantIntentJoinRequestsForOwner(intent.id, host._id);
    expect(listed.some((row) => row.id === joinRequest.id && row.status === 'pending')).toBe(true);

    const approved = await approveParticipantIntentJoinRequest(
      intent.id,
      joinRequest.id,
      host._id
    );
    expect(approved.status).toBe('approved');
  });
});
