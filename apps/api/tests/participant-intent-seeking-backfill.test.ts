import { randomUUID } from 'crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { backfillSeekingActivitiesForActiveIntents } from '../src/lib/participant-intents-store.js';
import { getMemberAvailability } from '../src/lib/member-availability-store.js';
import { createAuthUser } from '../src/lib/auth-users-store.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { buildTestParticipantIntentInput, ensureCuratedAreasSeeded, testAreas } from './helpers/test-seed.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { participantIntentKindToOutingCategory } from '@uaetrail/shared-types';

beforeAll(async () => {
  await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});

describe('backfillSeekingActivitiesForActiveIntents', () => {
  it('migrates legacy active intents into member_availability fixed slots', async () => {
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

    const input = buildTestParticipantIntentInput({
      title: `Legacy ${suffix}`,
      time: '09:00',
      comment: 'Backfill me on this integration test post.',
      latitude: 25.11,
      longitude: 55.22,
    });
    const intentId = randomUUID();
    const now = new Date();
    await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENTS)
      .insertOne({
        _id: intentId,
        userId: user._id,
        kind: input.kind,
        outingCategory: participantIntentKindToOutingCategory(input.kind),
        title: input.title.trim(),
        date: input.date ?? null,
        time: input.time ?? null,
        preferredArea: input.preferredArea?.trim() || null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        locationPrecision: input.locationPrecision ?? null,
        toLatitude: input.toLatitude ?? null,
        toLongitude: input.toLongitude ?? null,
        partySize: input.partySize,
        comment: input.comment.trim(),
        status: 'active',
        areaId: testAreas.hatta.id,
        createdAt: now,
        updatedAt: now,
      });

    const result = await backfillSeekingActivitiesForActiveIntents({ limit: 10 });
    expect(result.created).toBeGreaterThanOrEqual(1);

    const intentDoc = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENTS)
      .findOne({ _id: intentId });
    expect(intentDoc?.status).toBe('fulfilled');

    const availability = await getMemberAvailability(user._id);
    const fixed = availability?.slots.find((s) => s.slotId === intentId && s.scheduleKind === 'fixed');
    expect(fixed).toBeDefined();
    expect(fixed?.capacity).toBe('participant');
    expect(fixed?.modalities?.length).toBeGreaterThan(0);
  });
});
