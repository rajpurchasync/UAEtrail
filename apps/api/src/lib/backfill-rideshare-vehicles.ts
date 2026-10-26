import type { MemberVehicleColor } from '@uaetrail/shared-types';
import { MEMBER_VEHICLE_COLORS } from '@uaetrail/shared-types';
import { ActivityType } from '../domain/enums.js';
import {
  createMemberVehicle,
  listMemberVehicles,
  toRideshareVehiclePublic,
} from './member-vehicles-store.js';
import { getMongoClient } from './mongo.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { patchActivityInMongo } from './entity-sync.js';
import { scheduleExploreMapCacheInvalidation } from './explore-map-cache-schedule.js';

const RIDESHARE_ACTIVITY_TYPES = new Set<string>([
  ActivityType.RIDESHARE,
  'rideshare',
  'RIDESHARE',
]);

const UAE_VEHICLE_POOL: ReadonlyArray<{ make: string; model: string }> = [
  { make: 'Toyota', model: 'Land Cruiser' },
  { make: 'Nissan', model: 'Patrol' },
  { make: 'Mitsubishi', model: 'Pajero' },
  { make: 'Toyota', model: 'Fortuner' },
  { make: 'Hyundai', model: 'Tucson' },
  { make: 'Kia', model: 'Sportage' },
  { make: 'BMW', model: 'X5' },
  { make: 'Mercedes-Benz', model: 'GLE' },
  { make: 'Toyota', model: 'Camry' },
  { make: 'Honda', model: 'CR-V' },
  { make: 'Ford', model: 'Explorer' },
  { make: 'Chevrolet', model: 'Tahoe' },
];

const hashSeed = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const pickFromPool = (seed: string) => {
  const index = hashSeed(seed) % UAE_VEHICLE_POOL.length;
  return UAE_VEHICLE_POOL[index]!;
};

const pickColor = (seed: string): MemberVehicleColor => {
  const index = hashSeed(`${seed}:color`) % MEMBER_VEHICLE_COLORS.length;
  return MEMBER_VEHICLE_COLORS[index]!;
};

const pickYear = (seed: string): number => {
  const current = new Date().getFullYear();
  const span = 8;
  const offset = hashSeed(`${seed}:year`) % span;
  return current - offset;
};

const pickPlate = (seed: string): string => {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const letter = letters[hashSeed(`${seed}:plate`) % letters.length]!;
  const digits = String(10000 + (hashSeed(`${seed}:digits`) % 89999));
  return `${letter} ${digits}`;
};

export const buildRandomMemberVehicleInput = (ownerSeed: string) => {
  const { make, model } = pickFromPool(ownerSeed);
  return {
    make,
    model,
    color: pickColor(ownerSeed),
    year: pickYear(ownerSeed),
    plateNumber: pickPlate(ownerSeed),
  };
};

const isRideshareActivity = (doc: MongoActivityDoc): boolean => {
  const type = String(doc.activityType ?? '').toUpperCase();
  if (RIDESHARE_ACTIVITY_TYPES.has(doc.activityType ?? '')) return true;
  if (type === 'RIDESHARE') return true;
  if (String(doc.outingCategory ?? '').toLowerCase() === 'rideshare') return true;
  return false;
};

const resolveActivityOwnerId = (doc: MongoActivityDoc): string | null =>
  doc.hostId ?? doc.createdById ?? null;

export type BackfillRideshareVehiclesResult = {
  activitiesScanned: number;
  rideshareActivities: number;
  vehiclesCreated: number;
  activitiesLinked: number;
  skippedNoOwner: number;
  dryRun: boolean;
};

/** Ensure rideshare hosts have garage cars and published rides reference a vehicle snapshot. */
export const backfillRideshareVehiclesForActivities = async (options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<BackfillRideshareVehiclesResult> => {
  const dryRun = options?.dryRun ?? false;
  const limit = options?.limit ?? 500;

  const activities = getMongoClient()!
    .db()
    .collection<MongoActivityDoc>('activities');

  const cursor = activities.find({}).limit(limit);
  const docs = await cursor.toArray();

  const result: BackfillRideshareVehiclesResult = {
    activitiesScanned: docs.length,
    rideshareActivities: 0,
    vehiclesCreated: 0,
    activitiesLinked: 0,
    skippedNoOwner: 0,
    dryRun,
  };

  const ensuredVehicleByUser = new Map<string, string>();

  const ensureVehicleForUser = async (userId: string, seed: string): Promise<string | null> => {
    const cached = ensuredVehicleByUser.get(userId);
    if (cached) return cached;

    const existing = await listMemberVehicles(userId);
    if (existing.length > 0) {
      ensuredVehicleByUser.set(userId, existing[0]!.id);
      return existing[0]!.id;
    }

    if (dryRun) {
      result.vehiclesCreated += 1;
      ensuredVehicleByUser.set(userId, `dry-run-${userId}`);
      return `dry-run-${userId}`;
    }

    const created = await createMemberVehicle(userId, buildRandomMemberVehicleInput(seed));
    result.vehiclesCreated += 1;
    ensuredVehicleByUser.set(userId, created.id);
    return created.id;
  };

  for (const doc of docs) {
    if (!isRideshareActivity(doc)) continue;
    result.rideshareActivities += 1;

    const ownerId = resolveActivityOwnerId(doc);
    if (!ownerId) {
      result.skippedNoOwner += 1;
      continue;
    }

    await ensureVehicleForUser(ownerId, ownerId);

    const needsLink = !doc.rideshareVehicleId || !doc.rideshareVehicle;

    if (dryRun) {
      if (needsLink) result.activitiesLinked += 1;
      continue;
    }

    const vehicles = await listMemberVehicles(ownerId);
    const vehicle = vehicles[0];
    if (!vehicle) continue;

    if (!needsLink && doc.rideshareVehicleId === vehicle.id) continue;

    const publicVehicle = toRideshareVehiclePublic(vehicle);
    await patchActivityInMongo(doc._id, {
      rideshareVehicleId: vehicle.id,
      rideshareVehicle: publicVehicle,
      rideshareEnabled: true,
    });
    result.activitiesLinked += 1;
  }

  if (!dryRun && result.activitiesLinked > 0) {
    scheduleExploreMapCacheInvalidation('backfill.rideshare-vehicles');
  }

  return result;
};
