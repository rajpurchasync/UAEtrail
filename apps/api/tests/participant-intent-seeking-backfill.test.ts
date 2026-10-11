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
import { buildTestParticipantIntentInput, ensureCuratedAreasSeeded } from './helpers/test-seed.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';

beforeAll(async () => {
  await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
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

    const intent = await createParticipantIntent(
      user._id,
      buildTestParticipantIntentInput({
        title: `Legacy ${suffix}`,
        time: '09:00',
        comment: 'Backfill me on this integration test post.',
        latitude: 25.11,
        longitude: 55.22,
      })
    );

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
