#!/usr/bin/env node
/**
 * Mongo profiler + $indexStats hygiene (plan §15.6 / Prompt 9).
 * Enables slowms 100, asserts hot queries are not COLLSCAN, warns on unused indexes.
 * Unused *new* indexes are warnings, not failures.
 *
 * Usage: MONGO_URI=mongodb://127.0.0.1:27017/uaetrail_test npm run mongo:hygiene
 * CI: IXSCAN asserts live in apps/api/tests/geo-hierarchy-search-contract.test.ts (in-memory Mongo).
 */
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
if (!uri) {
  console.log('[mongo-index-hygiene] skip — set MONGO_URI to run against a test DB (CI uses in-memory Mongo in geo-hierarchy-search-contract.test.ts)');
  process.exit(0);
}

const client = new MongoClient(uri);
const id = () => randomUUID();

const hotQueries = [
  {
    name: 'activity_by_id',
    coll: 'activities',
    filter: (ids) => ({ _id: ids.activity }),
    indexHint: '_id_',
  },
  {
    name: 'explore_upcoming',
    coll: 'activities',
    filter: () => ({ status: 'published', startAt: { $gte: new Date() } }),
  },
  {
    name: 'geo_search_tokens',
    coll: 'locations',
    filter: () => ({ 'geoRef.searchTokens': 'hatta', status: 'active' }),
  },
  {
    name: 'submissions_cells',
    coll: 'submissions',
    filter: () => ({ 'dedupe.cells': 'cell-1', status: 'pending' }),
  },
];

const winningStage = (plan) => {
  const q = [plan];
  while (q.length) {
    const node = q.shift();
    if (!node || typeof node !== 'object') continue;
    if (node.stage === 'COLLSCAN' || node.stage === 'EXPRESS_IXSCAN' || node.stage === 'IXSCAN' || node.stage === 'IDHACK') {
      return node.stage;
    }
    if (node.inputStage) q.push(node.inputStage);
    if (Array.isArray(node.inputStages)) q.push(...node.inputStages);
    if (node.shards) q.push(...node.shards);
  }
  return plan?.stage ?? 'UNKNOWN';
};

try {
  await client.connect();
  const db = client.db();
  await db.command({ profile: 1, slowms: 100 });

  const ids = { activity: id() };
  await db.collection('activities').insertOne({
    _id: ids.activity,
    status: 'published',
    startAt: new Date(Date.now() + 86_400_000),
    activityType: 'hiking',
  });
  await db.collection('locations').insertOne({
    _id: id(),
    status: 'active',
    geoRef: { searchTokens: ['hatta'], chain: [id()] },
  });
  await db.collection('submissions').insertOne({
    _id: id(),
    status: 'pending',
    kind: 'facility',
    dedupe: { cells: ['cell-1'] },
  });

  await db.collection('activities').createIndex({ status: 1, startAt: 1 });
  await db.collection('locations').createIndex({ 'geoRef.searchTokens': 1, status: 1 }, { name: 'geo_search_tokens' });
  await db.collection('submissions').createIndex(
    { 'dedupe.cells': 1, status: 1 },
    { name: 'pending_near', partialFilterExpression: { status: 'pending' } }
  );

  const failures = [];
  for (const q of hotQueries) {
    const explain = await db
      .collection(q.coll)
      .find(q.filter(ids))
      .limit(5)
      .explain('executionStats');
    const stage = winningStage(explain.queryPlanner?.winningPlan);
    if (stage === 'COLLSCAN') {
      failures.push(`${q.name}: COLLSCAN`);
    } else {
      console.log(`[mongo-index-hygiene] ${q.name} ${stage}`);
    }
  }

  const colls = [...new Set(hotQueries.map((q) => q.coll))];
  for (const coll of colls) {
    const stats = await db
      .collection(coll)
      .aggregate([{ $indexStats: {} }])
      .toArray();
    for (const row of stats) {
      const accesses = row.accesses?.ops ?? 0;
      if (accesses === 0 && row.name !== '_id_') {
        console.warn(`[mongo-index-hygiene] warn unused index ${coll}.${row.name} (new indexes are allowed)`);
      }
    }
  }

  if (failures.length) {
    console.error('[mongo-index-hygiene] FAIL\n' + failures.join('\n'));
    process.exit(1);
  }
  console.log('[mongo-index-hygiene] OK');
} finally {
  await client.close();
}
