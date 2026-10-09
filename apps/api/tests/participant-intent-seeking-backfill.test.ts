import { beforeAll, describe, expect, it } from 'vitest';
import {
  backfillSeekingActivitiesForActiveIntents,
  createParticipantIntent,
} from '../src/lib/participant-intents-store.js';
import { findActivityDocInMongo } from '../src/lib/entity-sync.js';
import { createAuthUser } from '../src/lib/auth-users.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';

beforeAll(async () => {
  await bootstrapTestApp();
});

describe('backfillSeekingActivitiesForActiveIntents', () => {
  it('links seeking activities for legacy active intents', async () => {
    const suffix = `bf-${Date.now()}`;
    const user = await createAuthUser({
      email: `bf-${suffix}@test.local`,
      passwordHash: await bcrypt.hash('TestPass1', 10),
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Legacy', phone: null, bio: null, avatarUrl: null },
    });

    const intent = await createParticipantIntent(user._id, {
      kind: 'hiking',
      title: `Legacy ${suffix}`,
      date: '2026-12-22',
      time: '09:00',
      preferredArea: 'Hatta',
      partySize: 2,
      comment: 'Backfill me',
      latitude: 25.11,
      longitude: 55.22,
      locationPrecision: 'specific',
    });

    await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENTS)
      .updateOne({ _id: intent.id }, { $unset: { seekingActivityId: '' } });

    const result = await backfillSeekingActivitiesForActiveIntents({ limit: 10 });
    expect(result.created).toBeGreaterThanOrEqual(1);

    const intentDoc = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENTS)
      .findOne({ _id: intent.id });
    expect(intentDoc?.seekingActivityId).toBeTruthy();

    const activity = await findActivityDocInMongo(intentDoc!.seekingActivityId as string);
    expect(activity?.participantIntentId).toBe(intent.id);
  });
});
