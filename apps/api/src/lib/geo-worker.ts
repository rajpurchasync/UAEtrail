import type { Collection } from 'mongodb';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { logger } from './logger.js';
import { loadGeoTree } from './geo-tree.js';
import { activityIsCounted, emitGeoPinChange, activityToCountedPin } from './geo-write.js';
import { ActivityStatus } from '../domain/enums.js';
import type { MongoActivityDoc } from './entity-builders.js';

const BATCH_LIMIT = 1000;

type GeoOutboxRow = { _id: string; scope?: string; inc?: Record<string, number>; batch?: string };
type GeoStatsRow = { _id: string; rev?: number; batches?: string[]; scope?: string };

const outbox = (): Collection<GeoOutboxRow> =>
  getMongoClient()!.db().collection<GeoOutboxRow>(COLLECTIONS.GEO_OUTBOX);

const stats = (): Collection<GeoStatsRow> =>
  getMongoClient()!.db().collection<GeoStatsRow>(COLLECTIONS.GEO_STATS);

const activities = (): Collection<MongoActivityDoc> =>
  getMongoClient()!.db().collection<MongoActivityDoc>(COLLECTIONS.ACTIVITIES);

const scopeTypeOf = (scope: string): string => {
  if (scope.startsWith('geo-country')) return 'country';
  if (scope.startsWith('geo-state')) return 'state';
  if (scope.startsWith('geo-area') || scope.length > 8) return 'area';
  return 'point';
};

const applyBatch = async (batch: string): Promise<void> => {
  const rows = await outbox().find({ batch }).toArray();
  const sums = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const acc = sums.get(String(r.scope)) ?? {};
    for (const [k, v] of Object.entries((r.inc ?? {}) as Record<string, number>)) {
      acc[k] = (acc[k] ?? 0) + v;
    }
    sums.set(String(r.scope), acc);
  }
  const ops = [...sums].map(([scope, inc]) => ({
    updateOne: {
      filter: { _id: scope, batches: { $ne: batch } },
      update: {
        $inc: { ...inc, rev: 1 },
        $set: { updatedAt: new Date() },
        $push: { batches: { $each: [batch], $slice: -20 } },
        $setOnInsert: { scope: scopeTypeOf(scope) },
      },
      upsert: true,
    },
  }));
  if (ops.length) {
    try {
      await stats().bulkWrite(ops, { ordered: false });
    } catch (err) {
      const code = (err as { code?: number }).code;
      if (code !== 11000) throw err;
    }
  }
  await outbox().deleteMany({ batch });
};

export const flushGeoOutboxOnce = async (): Promise<number> => {
  const leftover = await outbox().distinct('batch', { batch: { $exists: true, $type: 'string' } });
  for (const b of leftover) {
    if (typeof b === 'string' && b) await applyBatch(b);
  }
  const ids = (
    await outbox()
      .find({ batch: { $exists: false } }, { projection: { _id: 1 } })
      .sort({ _id: 1 })
      .limit(BATCH_LIMIT)
      .toArray()
  ).map((r) => r._id);
  if (!ids.length) return 0;
  const batch = `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await outbox().updateMany({ _id: { $in: ids }, batch: { $exists: false } }, { $set: { batch } });
  await applyBatch(batch);
  return ids.length;
};

export const sweepExpiredActivitiesForGeo = async (now = new Date()): Promise<number> => {
  const due = await activities()
    .find({
      status: { $in: [ActivityStatus.PUBLISHED] },
      $or: [{ endAt: { $lte: now } }, { endAt: null, startAt: { $lte: new Date(now.getTime() - 12 * 60 * 60 * 1000) } }],
    })
    .limit(200)
    .toArray();
  let n = 0;
  for (const a of due) {
    if (activityIsCounted(a)) continue;
    const before = activityToCountedPin({ ...a, status: ActivityStatus.PUBLISHED });
    const after = activityToCountedPin({ ...a, status: 'cancelled' as MongoActivityDoc['status'] });
    await emitGeoPinChange(before, after);
    n += 1;
  }
  return n;
};

/** Nightly-style rebuild: fold live counts from pins into geo_stats (idempotent $set). */
export const reconcileGeoStats = async (): Promise<{ scopes: number }> => {
  await loadGeoTree();
  const db = getMongoClient()!.db();
  const places = await db
    .collection(COLLECTIONS.LOCATIONS)
    .find({ status: { $in: ['active', 'ACTIVE'] }, 'geoRef.chain': { $exists: true } })
    .project({ geoRef: 1, activityType: 1, status: 1 })
    .toArray();
  const facs = await db
    .collection(COLLECTIONS.FACILITIES)
    .find({ status: { $in: ['active', 'ACTIVE'] }, 'geoRef.chain': { $exists: true } })
    .project({ geoRef: 1, facilityKind: 1, status: 1, parentPlaceId: 1 })
    .toArray();
  const acts = await db
    .collection(COLLECTIONS.ACTIVITIES)
    .find({ status: { $in: ['published', 'PUBLISHED'] }, 'geoRef.chain': { $exists: true } })
    .project({ geoRef: 1, activityType: 1, status: 1, locationId: 1, startAt: 1, endAt: 1 })
    .toArray();

  const acc = new Map<string, Record<string, number>>();
  const add = (scope: string, key: string) => {
    const row = acc.get(scope) ?? {};
    row[key] = (row[key] ?? 0) + 1;
    acc.set(scope, row);
  };
  for (const p of places) {
    const chain = (p.geoRef as { chain?: string[] } | undefined)?.chain ?? [];
    const kind = String(p.activityType ?? '').toLowerCase().includes('camp') ? 'camp_spot' : 'trail';
    for (const id of chain) {
      add(id, 'places.total');
      add(id, `places.${kind}`);
    }
  }
  for (const f of facs) {
    const chain = (f.geoRef as { chain?: string[] } | undefined)?.chain ?? [];
    const t = String(f.facilityKind ?? 'facility');
    for (const id of [...chain, ...(f.parentPlaceId ? [String(f.parentPlaceId)] : [])]) {
      add(id, 'facilities.total');
      add(id, `facilities.${t}`);
    }
  }
  for (const a of acts) {
    if (!activityIsCounted(a as MongoActivityDoc)) continue;
    const chain = (a.geoRef as { chain?: string[] } | undefined)?.chain ?? [];
    const t = String(a.activityType ?? 'event').toLowerCase();
    for (const id of [...chain, ...(a.locationId ? [String(a.locationId)] : [])]) {
      add(id, 'activeActivities.total');
      add(id, `activeActivities.${t}`);
    }
  }

  const ops = [...acc].map(([id, counters]) => ({
    updateOne: {
      filter: { _id: id },
      update: {
        $set: { ...counters, updatedAt: new Date() },
        $inc: { rev: 1 },
        $setOnInsert: { scope: scopeTypeOf(id), batches: [] },
      },
      upsert: true,
    },
  }));
  if (ops.length) await stats().bulkWrite(ops, { ordered: false });
  return { scopes: acc.size };
};

let drainTimer: ReturnType<typeof setInterval> | null = null;
let inFlight = false;

export const startGeoOutboxWorker = (): void => {
  if (process.env.NODE_ENV === 'test' || drainTimer) return;
  drainTimer = setInterval(() => {
    if (inFlight) return;
    inFlight = true;
    void flushGeoOutboxOnce()
      .then(() => sweepExpiredActivitiesForGeo())
      .catch((err) => logger.warn({ err }, 'geo outbox tick failed'))
      .finally(() => {
        inFlight = false;
      });
  }, 2_000);
  void flushGeoOutboxOnce().catch((err) => logger.warn({ err }, 'geo outbox initial flush failed'));
};

export const stopGeoOutboxWorker = (): void => {
  if (drainTimer) {
    clearInterval(drainTimer);
    drainTimer = null;
  }
};
