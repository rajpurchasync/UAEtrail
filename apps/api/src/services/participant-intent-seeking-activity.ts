import type { CreateParticipantIntentInput, ParticipantIntentKind } from '../domain/participant-intent.js';
import { toPrismaActivityType, type SharedActivityType } from '../domain/activity-type.js';
import { ActivityStatus, LocationStatus } from '../domain/enums.js';
import { createActivityDetailed, createLocationRecord } from '../lib/activities-store.js';
import { ensureBuddyHostTenant } from '../lib/buddy-host-tenant.js';
import { parseLocalDateTime } from '../lib/datetime.js';
import { patchActivityInMongo } from '../lib/entity-sync.js';
import { invalidateExploreMapCache } from '../lib/explore-map-cache.js';
import {
  normalizeRideshareRouteLabels,
  participantIntentKindToOutingCategory,
} from '@uaetrail/shared-types';

const intentKindToSharedType = (kind: ParticipantIntentKind): SharedActivityType => {
  if (kind === 'hiking') return 'hiking';
  if (kind === 'camping') return 'camping';
  if (kind === 'rideshare') return 'rideshare';
  return 'event';
};

const resolveSeekingStartAt = (input: CreateParticipantIntentInput, countryCode: string): Date => {
  if (input.date) {
    const time = input.time?.trim() || '09:00';
    return parseLocalDateTime(input.date, time, countryCode);
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 30);
  fallback.setHours(9, 0, 0, 0);
  return fallback;
};

const resolveLocationLabel = (input: CreateParticipantIntentInput): string =>
  input.preferredArea?.trim() || input.title.trim().slice(0, 80);

const resolveSeekingRideshareEndpoints = (
  input: CreateParticipantIntentInput
): { meetingPoint: string | null; startPoint: string | null } => {
  const preferred = input.preferredArea?.trim() || null;
  const { fromLabel, toLabel } = normalizeRideshareRouteLabels(preferred, preferred);
  if (fromLabel && toLabel) {
    return { meetingPoint: fromLabel, startPoint: toLabel };
  }
  const fallback = preferred || input.title.trim().slice(0, 80) || null;
  return { meetingPoint: fallback, startPoint: null };
};

/** M1 dual-write — mirror Find posts as published `activityMode: seeking` rows. */
type SeekingActivityWriteOptions = {
  /** Batch backfill — invalidate explore cache once after the run. */
  deferCacheInvalidate?: boolean;
};

export const createSeekingActivityForIntent = async (
  userId: string,
  intentId: string,
  input: CreateParticipantIntentInput,
  areaId: string | null,
  options?: SeekingActivityWriteOptions
): Promise<string> => {
  const tenant = await ensureBuddyHostTenant(userId);
  if (!tenant) {
    throw new Error('Unable to resolve member tenant for seeking activity.');
  }

  const sharedType = intentKindToSharedType(input.kind);
  const prismaType = toPrismaActivityType(sharedType);
  const countryCode = tenant.countryCode ?? 'AE';
  const lat = input.latitude ?? 25.2048;
  const lng = input.longitude ?? 55.2708;

  const location = await createLocationRecord({
    name: resolveLocationLabel(input),
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

  const isRideshare = sharedType === 'rideshare';
  const rideshareEndpoints = isRideshare ? resolveSeekingRideshareEndpoints(input) : null;
  const startAt = resolveSeekingStartAt(input, countryCode);
  const publishedAt = new Date();

  const created = await createActivityDetailed({
    tenant: { connect: { id: tenant.id } },
    location: { connect: { id: location.id } },
    createdBy: { connect: { id: userId } },
    host: { connect: { id: userId } },
    activityType: prismaType,
    title: input.title.trim(),
    description: input.comment.trim(),
    startAt,
    meetingPoint: isRideshare
      ? rideshareEndpoints?.meetingPoint ?? null
      : input.preferredArea?.trim() || null,
    meetingLat: lat,
    meetingLng: lng,
    startPoint: isRideshare ? rideshareEndpoints?.startPoint || 'Destination' : null,
    startLat: isRideshare ? input.toLatitude ?? null : null,
    startLng: isRideshare ? input.toLongitude ?? null : null,
    capacity: input.partySize,
    priceAed: 0,
    joinMode: 'open',
    participationMode: 'approval',
    status: ActivityStatus.PUBLISHED,
    publishedAt,
    outingCategory: participantIntentKindToOutingCategory(input.kind),
    activityMode: 'seeking',
    participantIntentId: intentId,
  });
  if (!options?.deferCacheInvalidate) {
    await invalidateExploreMapCache();
  }

  return created.id;
};

export const cancelSeekingActivityForIntent = async (activityId: string | null | undefined): Promise<void> => {
  if (!activityId) return;
  await patchActivityInMongo(activityId, {
    status: ActivityStatus.CANCELLED,
  });
  await invalidateExploreMapCache();
};
