import type { Db, ObjectId } from 'mongodb';
import { COLLECTIONS, LEGACY_COLLECTIONS } from './collections.js';
import { isLegacyEmbeddedDemandTitle, normalizeLegacyDemandTitle, type DemandTitleKind } from '@uaetrail/shared-types';

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

const migrateActivityJoinModeFromRequirements = async (db: Db): Promise<void> => {
  const collection = db.collection(COLLECTIONS.ACTIVITIES);
  const cursor = collection.find({
    joinMode: { $exists: false },
    requirements: { $type: 'array' },
  });

  let updated = 0;
  for await (const doc of cursor) {
    const requirements = Array.isArray(doc.requirements) ? doc.requirements : [];
    const hasPrivate = requirements.some(
      (item: unknown) =>
        typeof item === 'string' && item.trim().startsWith('Private: group or invite only')
    );
    if (!hasPrivate) continue;
    await collection.updateOne({ _id: doc._id }, { $set: { joinMode: 'private', updatedAt: new Date() } });
    updated += 1;
  }

  if (updated > 0) {
    console.log(`[mongo] Backfilled joinMode=private from requirements (${updated} docs)`);
  }
};

const migrateLegacyParticipantIntentTitles = async (db: Db): Promise<void> => {
  const collection = db.collection('participant_intents');
  const cursor = collection.find({ title: { $type: 'string' } });
  let updated = 0;

  for await (const doc of cursor) {
    const title = typeof doc.title === 'string' ? doc.title.trim() : '';
    const kind = doc.kind;
    if (
      !title ||
      typeof kind !== 'string' ||
      !isLegacyEmbeddedDemandTitle(title)
    ) {
      continue;
    }

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          title: normalizeLegacyDemandTitle(title, kind as DemandTitleKind),
          updatedAt: new Date(),
        },
      }
    );
    updated += 1;
  }

  if (updated > 0) {
    console.log(`[mongo] Migrated legacy participant intent titles (${updated} docs)`);
  }
};

/** Link shop merchant_profiles to their SHOP tenant via ownerId (Phase 6 prep). */
const backfillMerchantProfileTenantLinks = async (db: Db): Promise<void> => {
  const merchants = db.collection('merchant_profiles');
  const tenants = db.collection('tenants');
  const cursor = merchants.find({
    $or: [{ tenantId: { $exists: false } }, { tenantId: null }],
  });

  let updated = 0;
  for await (const merchant of cursor) {
    const ownerId = Array.isArray(merchant.adminIds) ? merchant.adminIds[0] : null;
    if (typeof ownerId !== 'string' || !ownerId) continue;

    const shopTenant = await tenants.findOne({ ownerId, businessMode: 'SHOP' });
    if (!shopTenant || typeof shopTenant._id !== 'string') continue;

    const tenantTaken = await merchants.findOne({
      tenantId: shopTenant._id,
      _id: { $ne: merchant._id }
    });
    if (tenantTaken) continue;

    await merchants.updateOne(
      { _id: merchant._id },
      { $set: { tenantId: shopTenant._id, updatedAt: new Date() } }
    );
    updated += 1;
  }

  if (updated > 0) {
    console.log(`[mongo] Backfilled merchant_profiles.tenantId (${updated} docs)`);
  }

  const orphanCount = await merchants.countDocuments({
    $or: [{ tenantId: { $exists: false } }, { tenantId: null }]
  });
  if (orphanCount > 0) {
    console.warn(`[mongo] merchant_profiles without tenantId remain: ${orphanCount} (shop hosts only)`);
  }
};

/** Keep at most one merchant_profiles row per tenantId so the sparse unique index can build. */
const dedupeMerchantProfileTenantIds = async (db: Db): Promise<void> => {
  const merchants = db.collection('merchant_profiles');
  const dupes = await merchants
    .aggregate<{ _id: string; ids: string[]; count: number }>([
      { $match: { tenantId: { $type: 'string' } } },
      { $group: { _id: '$tenantId', ids: { $push: '$_id' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ])
    .toArray();

  let cleared = 0;
  for (const group of dupes) {
    const keepId = [...group.ids].sort()[0];
    const dropIds = group.ids.filter((id) => id !== keepId);
    if (dropIds.length === 0) continue;
    await merchants.updateMany(
      { _id: { $in: dropIds as unknown as ObjectId[] } },
      { $unset: { tenantId: '' }, $set: { updatedAt: new Date() } }
    );
    cleared += dropIds.length;
  }

  if (cleared > 0) {
    console.log(`[mongo] Cleared duplicate merchant_profiles.tenantId (${cleared} docs)`);
  }
};

const migrateActivityTerminologyValues = async (db: Db): Promise<void> => {
  const posts = db.collection('social_posts');
  const postResult = await posts.updateMany({ category: 'TRIP_REPORTS' }, { $set: { category: 'ACTIVITY_REPORTS' } });
  if (postResult.modifiedCount > 0) {
    console.log(`[mongo] Migrated post category TRIP_REPORTS → ACTIVITY_REPORTS (${postResult.modifiedCount} docs)`);
  }

  const ledger = db.collection('reward_ledgers');
  const ledgerResult = await ledger.updateMany({ action: 'TRIP_ATTENDED' }, { $set: { action: 'ACTIVITY_ATTENDED' } });
  if (ledgerResult.modifiedCount > 0) {
    console.log(`[mongo] Migrated reward action TRIP_ATTENDED → ACTIVITY_ATTENDED (${ledgerResult.modifiedCount} docs)`);
  }

  const badges = db.collection('user_badges');
  const badgeResult = await badges.updateMany({ badgeKey: 'trip_leader' }, { $set: { badgeKey: 'activity_leader' } });
  if (badgeResult.modifiedCount > 0) {
    console.log(`[mongo] Migrated badge key trip_leader → activity_leader (${badgeResult.modifiedCount} docs)`);
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
  await migrateActivityJoinModeFromRequirements(db);
  await migrateLegacyParticipantIntentTitles(db);
  await backfillMerchantProfileTenantLinks(db);
  await dedupeMerchantProfileTenantIds(db);
  await migrateActivityTerminologyValues(db);
};
