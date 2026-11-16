/**
 * MIG-DISCO-REG — dev migration: published `activityMode: seeking` → fixed `member_availability` slots.
 *
 * Usage:
 *   npm --workspace @uaetrail/api run migrate-seeking-to-availability -- --dry-run
 *   npm --workspace @uaetrail/api run migrate-seeking-to-availability -- --limit=50
 *   npm --workspace @uaetrail/api run migrate-seeking-to-availability -- --cancel-seeking
 */
import { randomUUID } from 'node:crypto';
import type { AvailabilityKind, MemberAvailabilitySlotDTO } from '@uaetrail/shared-types';
import { AVAILABILITY_KINDS } from '@uaetrail/shared-types';
import { ActivityStatus } from '../src/domain/enums.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { patchActivityInMongo } from '../src/lib/entity-sync.js';
import { scheduleExploreMapCacheInvalidation } from '../src/lib/explore-map-cache-schedule.js';
import {
  getMemberAvailability,
  mergeMemberAvailabilityFixedSlotsMigration,
} from '../src/lib/member-availability-store.js';
import { prunePastAvailabilitySlots } from '@uaetrail/shared-types';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

type SeekingActivityRow = {
  _id: string;
  createdById?: string | null;
  hostId?: string | null;
  activityType?: string | null;
  title?: string | null;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  meetingLat?: number | null;
  meetingLng?: number | null;
  displayLatitude?: number | null;
  displayLongitude?: number | null;
  areaId?: string | null;
};

const parseArgs = () => {
  const dryRun = process.argv.includes('--dry-run');
  const cancelSeeking = process.argv.includes('--cancel-seeking');
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number.parseInt(limitArg.split('=')[1] ?? '', 10) : 500;
  return {
    dryRun,
    cancelSeeking,
    limit: Number.isFinite(limit) ? limit : 500,
  };
};

const activityTypeToKind = (activityType: string | null | undefined): AvailabilityKind => {
  const t = activityType?.trim();
  if (t === 'hiking' || t === 'camping' || t === 'rideshare' || t === 'event') return t;
  return 'other';
};

const isoDay = (value: Date | string | null | undefined): string => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(ms)) return new Date().toISOString().slice(0, 10);
  return new Date(ms).toISOString().slice(0, 10);
};

const toIso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
};

const buildFixedSlot = (row: SeekingActivityRow): MemberAvailabilitySlotDTO | null => {
  const lat = row.meetingLat ?? row.displayLatitude ?? null;
  const lng = row.meetingLng ?? row.displayLongitude ?? null;
  if (lat == null || lng == null) return null;

  const startAt = toIso(row.startAt) ?? `${isoDay(row.startAt)}T09:00:00.000Z`;
  const endAt = toIso(row.endAt) ?? startAt;
  const day = isoDay(row.startAt);

  return {
    slotId: randomUUID(),
    scheduleKind: 'fixed',
    startDate: day,
    endDate: day,
    startAt,
    endAt,
    title: row.title?.trim() || 'Looking for company',
    latitude: lat,
    longitude: lng,
    locationPrecision: 'specific',
    timeBand: null,
  };
};

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  const { dryRun, cancelSeeking, limit } = parseArgs();
  const db = getMongoClient()!.db();
  const rows = (await db
    .collection<SeekingActivityRow>(COLLECTIONS.ACTIVITIES)
    .find({
      activityMode: 'seeking',
      status: ActivityStatus.PUBLISHED,
    })
    .limit(limit)
    .toArray()) as SeekingActivityRow[];

  let migrated = 0;
  let skippedNoGeo = 0;
  let skippedWouldBeEmptyAfterSanitize = 0;
  let cancelled = 0;
  const errors: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const row of rows) {
    const userId = row.createdById ?? row.hostId;
    if (!userId) {
      errors.push(`${row._id}: missing host user`);
      continue;
    }

    const slot = buildFixedSlot(row);
    if (!slot) {
      skippedNoGeo += 1;
      continue;
    }

    const kind = activityTypeToKind(row.activityType);
    if (!AVAILABILITY_KINDS.includes(kind)) {
      errors.push(`${row._id}: unknown activity type ${row.activityType ?? 'null'}`);
      continue;
    }

    if (prunePastAvailabilitySlots([slot], today).length === 0) {
      skippedWouldBeEmptyAfterSanitize += 1;
    }

    if (dryRun) {
      migrated += 1;
      continue;
    }

    try {
      const existing = await getMemberAvailability(userId);
      const kinds = [...new Set([...(existing?.kinds ?? []), kind])];

      await mergeMemberAvailabilityFixedSlotsMigration(userId, {
        kinds,
        visibility: existing?.visibility === 'hidden' ? 'public' : existing?.visibility ?? 'public',
        region: existing?.region ?? null,
        areaId: existing?.areaId ?? row.areaId ?? null,
        note: existing?.note ?? null,
        fixedSlots: [slot],
      });
      migrated += 1;

      if (cancelSeeking) {
        await patchActivityInMongo(row._id, { status: ActivityStatus.CANCELLED });
        cancelled += 1;
      }
    } catch (err) {
      errors.push(`${row._id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (!dryRun && migrated > 0) {
    scheduleExploreMapCacheInvalidation('migrate-seeking-to-availability');
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        cancelSeeking,
        scanned: rows.length,
        migrated,
        skippedNoGeo,
        skippedWouldBeEmptyAfterSanitize,
        cancelled,
        errors,
      },
      null,
      2
    )
  );

  if (errors.length > 0) {
    process.exitCode = 1;
  }
});