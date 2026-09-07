import type { Db } from 'mongodb';
import { COLLECTIONS, LEGACY_COLLECTIONS } from './collections.js';

const migrateCollectionNameIfNeeded = async (db: Db, from: string, to: string): Promise<void> => {
  const collections = await db.listCollections().toArray();
  const names = new Set(collections.map((c) => c.name));
  if (!names.has(from) || names.has(to)) return;

  const source = db.collection(from);
  const target = db.collection(to);
  const cursor = source.find({});
  const batchSize = 500;
  let batch: Record<string, unknown>[] = [];

  for await (const doc of cursor) {
    batch.push(doc as Record<string, unknown>);
    if (batch.length >= batchSize) {
      await target.insertMany(batch, { ordered: false });
      batch = [];
    }
  }
  if (batch.length > 0) {
    await target.insertMany(batch, { ordered: false });
  }

  await source.deleteMany({});
  console.log(`[mongo] Migrated collection ${from} → ${to}`);
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
  for (const from of ['COMMUNITY_EVENT', 'COMMUNITY_ACTIVITY'] as const) {
    const result = await collection.updateMany({ activityType: from }, { $set: { activityType: 'EVENT' } });
    if (result.modifiedCount > 0) {
      console.log(
        `[mongo] Migrated activityType ${from} → EVENT on ${collectionName} (${result.modifiedCount} docs)`
      );
    }
  }
};

const migrateUserRoleVisitorToParticipant = async (db: Db): Promise<void> => {
  const users = db.collection(COLLECTIONS.USERS);
  const result = await users.updateMany({ role: 'VISITOR' }, { $set: { role: 'PARTICIPANT' } });
  if (result.modifiedCount > 0) {
    console.log(`[mongo] Migrated user role VISITOR → PARTICIPANT (${result.modifiedCount} docs)`);
  }
};

const migrateAuditLogEntityTypes = async (db: Db): Promise<void> => {
  const auditLogs = db.collection('audit_logs');
  const result = await auditLogs.updateMany(
    { entityType: 'organizer_application' },
    { $set: { entityType: 'host_application' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[mongo] Migrated audit entityType organizer_application → host_application (${result.modifiedCount} docs)`);
  }
};

const migrateNotificationKinds = async (db: Db): Promise<void> => {
  const notifications = db.collection('notifications');
  const kindMigrations: Array<[string, string]> = [
    ['organizer_application_submitted', 'host_application_submitted'],
    ['organizer_application_approved', 'host_application_approved'],
    ['organizer_application_rejected', 'host_application_rejected']
  ];

  for (const [from, to] of kindMigrations) {
    const result = await notifications.updateMany(
      { 'meta.kind': from },
      { $set: { 'meta.kind': to } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[mongo] Migrated notification meta.kind ${from} → ${to} (${result.modifiedCount} docs)`);
    }
  }
};

const migrateLegacyCarpoolActivities = async (db: Db): Promise<void> => {
  const collection = db.collection(COLLECTIONS.ACTIVITIES);
  const result = await collection.updateMany(
    { carPoolEnabled: true, activityType: { $ne: 'CARPOOL' } },
    { $set: { activityType: 'CARPOOL' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[mongo] Migrated legacy carPoolEnabled → CARPOOL (${result.modifiedCount} docs)`);
  }
};

/** One-time migrations for activity terminology and role model alignment. */
export const runMongoMigrations = async (db: Db): Promise<void> => {
  await migrateCollectionNameIfNeeded(db, LEGACY_COLLECTIONS.EVENTS, COLLECTIONS.ACTIVITIES);
  await migrateCollectionNameIfNeeded(db, LEGACY_COLLECTIONS.EVENT_REQUESTS, COLLECTIONS.ACTIVITY_REQUESTS);
  await migrateCollectionNameIfNeeded(db, LEGACY_COLLECTIONS.EVENT_PARTICIPANTS, COLLECTIONS.ACTIVITY_PARTICIPANTS);
  await migrateCollectionNameIfNeeded(db, LEGACY_COLLECTIONS.ORGANIZER_APPLICATIONS, COLLECTIONS.HOST_APPLICATIONS);

  for (const name of [COLLECTIONS.ACTIVITY_REQUESTS, COLLECTIONS.ACTIVITY_PARTICIPANTS, 'user_favorites', 'chat_messages', 'notifications']) {
    await renameFieldIfPresent(db, name, 'eventId', 'activityId');
  }

  await migrateActivityTypeValues(db, COLLECTIONS.ACTIVITIES);
  await migrateActivityTypeValues(db, 'locations');
  await migrateLegacyCarpoolActivities(db);
  await renameFieldIfPresent(db, COLLECTIONS.ACTIVITIES, 'guideId', 'hostId');
  await migrateUserRoleVisitorToParticipant(db);
  await migrateAuditLogEntityTypes(db);
  await migrateNotificationKinds(db);
};
