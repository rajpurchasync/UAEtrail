import type { Db } from 'mongodb';
import { COLLECTIONS, LEGACY_COLLECTIONS } from './collections.js';

const renameCollectionIfNeeded = async (db: Db, from: string, to: string): Promise<void> => {
  const collections = await db.listCollections().toArray();
  const names = new Set(collections.map((c) => c.name));
  if (names.has(from) && !names.has(to)) {
    await db.collection(from).rename(to);
    console.log(`[mongo] Renamed collection ${from} → ${to}`);
  }
};

const renameFieldIfPresent = async (
  db: Db,
  collectionName: string,
  from: string,
  to: string
): Promise<void> => {
  const collection = db.collection(collectionName);
  const sample = await collection.findOne({ [from]: { $exists: true } });
  if (!sample) return;
  const result = await collection.updateMany({ [from]: { $exists: true } }, { $rename: { [from]: to } });
  if (result.modifiedCount > 0) {
    console.log(`[mongo] Renamed field ${from} → ${to} on ${collectionName} (${result.modifiedCount} docs)`);
  }
};

const migrateActivityTypeValues = async (db: Db, collectionName: string): Promise<void> => {
  const collection = db.collection(collectionName);
  const result = await collection.updateMany(
    { activityType: 'COMMUNITY_ACTIVITY' },
    { $set: { activityType: 'COMMUNITY_ACTIVITY' } }
  );
  if (result.modifiedCount > 0) {
    console.log(
      `[mongo] Migrated activityType COMMUNITY_ACTIVITY → COMMUNITY_ACTIVITY on ${collectionName} (${result.modifiedCount} docs)`
    );
  }
};

/** One-time migrations for activity terminology (events → activities). */
export const runMongoMigrations = async (db: Db): Promise<void> => {
  await renameCollectionIfNeeded(db, LEGACY_COLLECTIONS.EVENTS, COLLECTIONS.ACTIVITIES);
  await renameCollectionIfNeeded(db, LEGACY_COLLECTIONS.EVENT_REQUESTS, COLLECTIONS.ACTIVITY_REQUESTS);
  await renameCollectionIfNeeded(db, LEGACY_COLLECTIONS.EVENT_PARTICIPANTS, COLLECTIONS.ACTIVITY_PARTICIPANTS);

  for (const name of [COLLECTIONS.ACTIVITY_REQUESTS, COLLECTIONS.ACTIVITY_PARTICIPANTS, 'user_favorites', 'chat_messages', 'notifications']) {
    await renameFieldIfPresent(db, name, 'activityId', 'activityId');
  }

  await migrateActivityTypeValues(db, COLLECTIONS.ACTIVITIES);
  await migrateActivityTypeValues(db, 'locations');
};
