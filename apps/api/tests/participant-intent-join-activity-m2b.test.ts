import { beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { createParticipantIntent } from '../src/lib/participant-intents-store.js';
import { createJoinOrWaitlistRequest } from '../src/lib/activity-engagement-store.js';
import { createAuthUser } from '../src/lib/auth-users.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { findParticipantIntentJoinRequestForUser } from '../src/lib/participant-intent-requests-store.js';
import { ensureCuratedAreasSeeded, testAreas } from './helpers/test-seed.js';

beforeAll(async () => {
  await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});

describe('seeking join M2b/M2c (activity canonical)', () => {
  it('activity_requests is source of truth; intent alias reads activity row', async () => {
    const suffix = `m2b-${Date.now()}`;
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
      title: `M2b ${suffix}`,
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

    const { request } = await createJoinOrWaitlistRequest({
      activityId: activityId as string,
      userId: joiner._id,
      note: 'Activity path',
    });

    const legacyMirror = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENT_REQUESTS)
      .findOne({ intentId: intent.id, userId: joiner._id });
    expect(legacyMirror).toBeNull();

    const mine = await findParticipantIntentJoinRequestForUser(intent.id, joiner._id);
    expect(mine?.id).toBe(request.id);
    expect(mine?.status).toBe('pending');
  });
});
