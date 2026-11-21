/**
 * Ops/integration only — inserts archived `activityMode: seeking` rows for join/carryover tests.
 * Product create is retired; do not use in product paths.
 */
import { randomUUID } from 'node:crypto';
import type { ParticipantIntentDTO } from '@uaetrail/shared-types';
import { participantIntentKindToOutingCategory } from '@uaetrail/shared-types';
import type { CreateParticipantIntentInput } from '../../src/domain/participant-intent.js';
import { toPrismaActivityType } from '../../src/domain/activity-type.js';
import { ActivityStatus, LocationStatus } from '../../src/domain/enums.js';
import type { MongoActivityDoc } from '../../src/lib/entity-builders.js';
import { createLocationRecord } from '../../src/lib/activities-store.js';
import { ensureBuddyHostTenant } from '../../src/lib/buddy-host-tenant.js';
import { parseLocalDateTime } from '../../src/lib/datetime.js';
import { writeActivityDocToMongo } from '../../src/lib/entity-sync.js';
import { findAuthUserById } from '../../src/lib/auth-users-store.js';
import {
  activityDocToParticipantIntentDto,
} from '../../src/services/participant-intent-activity-readthrough.js';
import { ensureCuratedAreasSeeded } from './test-seed.js';

const intentKindToActivityType = (kind: CreateParticipantIntentInput['kind']) => {
  if (kind === 'hiking') return 'hiking' as const;
  if (kind === 'camping') return 'camping' as const;
  if (kind === 'rideshare') return 'rideshare' as const;
  return 'event' as const;
};

export const seedLegacySeekingActivityIntent = async (
  userId: string,
  input: CreateParticipantIntentInput,
  options?: { intentId?: string }
): Promise<ParticipantIntentDTO> => {
  await ensureCuratedAreasSeeded();
  const tenant = await ensureBuddyHostTenant(userId);
  if (!tenant) {
    throw new Error('Unable to resolve member tenant for legacy seeking fixture.');
  }

  const intentId = options?.intentId ?? randomUUID();
  const activityId = randomUUID();
  const sharedType = intentKindToActivityType(input.kind);
  const prismaType = toPrismaActivityType(sharedType);
  const countryCode = tenant.countryCode ?? 'AE';
  const lat = input.latitude ?? 25.2048;
  const lng = input.longitude ?? 55.2708;
  const areaId = input.areaId?.trim() || null;

  const location = await createLocationRecord({
    name: input.preferredArea?.trim() || input.title.trim().slice(0, 80),
    region: tenant.region ?? 'UAE',
    areaId,
    activityType: prismaType,
    description: input.comment.trim().slice(0, 500),
    status: LocationStatus.ACTIVE,
    latitude: lat,
    longitude: lng,
    registryListed: false,
    submittedBy: { connect: { id: userId } },
    countryCode,
  });

  const time = input.time?.trim() || '09:00';
  const day = input.date?.trim() || new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  const startAt = parseLocalDateTime(day, time, countryCode);
  const now = new Date();

  const doc: MongoActivityDoc = {
    _id: activityId,
    tenantId: tenant.id,
    locationId: location.id,
    createdById: userId,
    hostId: userId,
    activityType: prismaType,
    title: input.title.trim(),
    description: input.comment.trim(),
    startAt,
    endAt: null,
    meetingPoint: input.preferredArea?.trim() || null,
    meetingLat: lat,
    meetingLng: lng,
    startPoint: sharedType === 'rideshare' ? 'Destination' : null,
    startLat: sharedType === 'rideshare' ? input.toLatitude ?? null : null,
    startLng: sharedType === 'rideshare' ? input.toLongitude ?? null : null,
    capacity: input.partySize,
    priceAed: 0,
    joinMode: 'open',
    participationMode: 'approval',
    status: ActivityStatus.PUBLISHED,
    publishedAt: now,
    outingCategory: participantIntentKindToOutingCategory(input.kind),
    activityMode: 'seeking',
    participantIntentId: intentId,
    areaId,
    createdAt: now,
    updatedAt: now,
  };

  await writeActivityDocToMongo(doc, { countryCode, location });
  const user = await findAuthUserById(userId);
  return activityDocToParticipantIntentDto(doc, user);
};