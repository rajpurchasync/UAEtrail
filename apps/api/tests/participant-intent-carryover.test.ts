import bcrypt from 'bcryptjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RequestStatus, UserRole, UserStatus } from '../src/domain/enums.js';
import {
  findActivityParticipantByEventAndUser,
  findActivityRequestByEventAndUser,
} from '../src/lib/activity-engagement-store.js';
import { createAuthUser } from '../src/lib/auth-users.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import {
  approveParticipantIntentJoinRequest,
  createParticipantIntentJoinRequest,
} from '../src/lib/participant-intent-requests-store.js';
import {
  createParticipantIntent,
  linkParticipantIntentToActivityForOwner,
} from '../src/lib/participant-intents-store.js';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import {
  cleanupEventFixture,
  cleanupTestUsers,
  createPublishedEventFixture,
  type PublishedEventFixture,
} from './helpers/fixtures.js';

const db = () => getMongoClient()!.db();

let fixture: PublishedEventFixture;
let joinerId: string;
let intentId: string;
const suffix = `carry-${Date.now()}`;

beforeAll(async () => {
  await bootstrapTestApp();
  fixture = await createPublishedEventFixture(suffix);

  const joiner = await createAuthUser({
    email: `joiner-${suffix}@test.local`,
    passwordHash: await bcrypt.hash('TestPass1', 10),
    googleId: null,
    authProvider: 'EMAIL',
    role: UserRole.PARTICIPANT,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    referralCode: generateReferralCode(),
    profile: { displayName: 'Demand Joiner', phone: null, bio: null, avatarUrl: null },
  });
  joinerId = joiner._id;

  const intent = await createParticipantIntent(fixture.organizerId, {
    kind: 'event',
    title: 'Weekend hike crew',
    date: '2026-12-15',
    partySize: 4,
    comment: 'Looking for people to hike with this weekend.',
    latitude: 25.0657,
    longitude: 55.1713,
  });
  intentId = intent.id;

  const joinRequest = await createParticipantIntentJoinRequest({
    intentId: intent.id,
    userId: joinerId,
  });
  await approveParticipantIntentJoinRequest(intent.id, joinRequest.id, fixture.organizerId);

  await db().collection('activities').updateOne(
    { _id: fixture.activityId },
    { $set: { participationMode: 'rsvp' } }
  );
});

afterAll(async () => {
  await db().collection('participant_intent_requests').deleteMany({ intentId });
  await db().collection('participant_intents').deleteMany({ _id: intentId });
  await cleanupEventFixture(fixture);
  await cleanupTestUsers();
});

describe('demand carry-over on link-activity', () => {
  it('enrolls approved demand joiners with host-approved activity rows (not RSVP)', async () => {
    const linked = await linkParticipantIntentToActivityForOwner(
      intentId,
      fixture.organizerId,
      fixture.activityId
    );
    expect(linked?.status).toBe('fulfilled');
    expect(linked?.convertedActivityId).toBe(fixture.activityId);

    const participant = await findActivityParticipantByEventAndUser(fixture.activityId, joinerId);
    expect(participant).not.toBeNull();

    const activityRequest = await findActivityRequestByEventAndUser(fixture.activityId, joinerId);
    expect(activityRequest?.status).toBe(RequestStatus.APPROVED);
    expect(activityRequest?.reviewedById).toBe(fixture.organizerId);
  });
});
