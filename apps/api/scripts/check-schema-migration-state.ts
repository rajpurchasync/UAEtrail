/** Read-only: report schema_meta version and legacy destination field residue. */
import { MongoClient } from 'mongodb';
import { env } from '../src/config/env.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { redactMongoUri } from '../src/lib/mongo.js';
import { MONGO_MIGRATION_VERSION } from '../src/lib/mongo-migrations.js';

const CODE_VERSION = MONGO_MIGRATION_VERSION;

const countHas = async (
  db: ReturnType<MongoClient['db']>,
  collection: string,
  field: string
): Promise<number> =>
  db.collection(collection).countDocuments({ [field]: { $exists: true, $nin: [null, ''] } });

const main = async (): Promise<void> => {
  const uri = env.MONGODB_URI;
  console.log(`[check] Mongo target: ${redactMongoUri(uri)}`);
  console.log(`[check] Code expects migration version: ${CODE_VERSION}`);
  console.log(
    `[check] Destinations store: COLLECTIONS.DESTINATIONS -> "${COLLECTIONS.DESTINATIONS}" (logical name; optional physical rename deferred)`
  );

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const state = await db.collection('schema_meta').findOne({ _id: 'migrations' });
  const dbVersion = typeof state?.version === 'number' ? state.version : null;
  const appliedAt = state?.appliedAt instanceof Date ? state.appliedAt.toISOString() : state?.appliedAt;

  console.log(`[check] schema_meta.migrations.version: ${dbVersion ?? '(missing)'}`);
  if (appliedAt) console.log(`[check] schema_meta.migrations.appliedAt: ${appliedAt}`);

  if (dbVersion === null) {
    console.log('[check] Status: migrations never recorded — API startup will run full migration chain once.');
  } else if (dbVersion >= CODE_VERSION) {
    console.log('[check] Status: at or past destination geo cutover — startup skips migration runner.');
  } else {
    console.log(
      `[check] Status: behind code (${dbVersion} < ${CODE_VERSION}) — next API/mongo:sync will run migrations (incl. destination geo).`
    );
  }

  const collections = [
    COLLECTIONS.LOCATIONS,
    COLLECTIONS.FACILITIES,
    COLLECTIONS.MEMBER_AVAILABILITY,
    COLLECTIONS.ACTIVITIES,
    COLLECTIONS.USER_WISHLIST,
  ];

  console.log('[check] Legacy field counts (non-empty):');
  for (const name of collections) {
    const areaId = await countHas(db, name, 'areaId');
    const destinationId = await countHas(db, name, 'destinationId');
    console.log(`  ${name}: areaId=${areaId} destinationId=${destinationId}`);
  }

  const facilitiesParentPlaceId = await countHas(db, COLLECTIONS.FACILITIES, 'parentPlaceId');
  const facilitiesOnSiteId = await countHas(db, COLLECTIONS.FACILITIES, 'onSiteId');
  console.log(
    `[check] facilities: parentPlaceId=${facilitiesParentPlaceId} onSiteId=${facilitiesOnSiteId}`
  );

  await client.close();
};

void main().catch((error) => {
  console.error('[check] failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});