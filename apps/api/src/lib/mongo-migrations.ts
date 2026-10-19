import type { Db, Document, ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';
import { COLLECTIONS, RETIRED_COLLECTION_NAMES } from './collections.js';
import { slugify } from './slug.js';
import {
  isEmbeddedPersonaSeekingTitle,
  normalizeEmbeddedPersonaSeekingTitle,
  type SeekingTitleKind,
} from '@uaetrail/shared-types';
import { runCatalogCpcMigrations } from './catalog-cpc-migrations.js';

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

const migrateRetiredRideshareActivities = async (db: Db): Promise<void> => {
  const collection = db.collection(COLLECTIONS.ACTIVITIES);
  const result = await collection.updateMany(
    {
      $or: [{ rideshareEnabled: true }, { carPoolEnabled: true }],
      activityType: { $nin: ['RIDESHARE', 'CARPOOL'] },
    },
    { $set: { activityType: 'RIDESHARE' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[mongo] Migrated legacy rideshareEnabled → RIDESHARE (${result.modifiedCount} docs)`);
  }
};

/** Rename persisted carpool terminology to rideshare (activity type, fields, demand kind). */
const migrateCarpoolTerminologyToRideshare = async (db: Db): Promise<void> => {
  const activities = db.collection(COLLECTIONS.ACTIVITIES);
  for (const from of ['CARPOOL', 'carpool'] as const) {
    const typeResult = await activities.updateMany({ activityType: from }, { $set: { activityType: 'RIDESHARE' } });
    if (typeResult.modifiedCount > 0) {
      console.log(`[mongo] Migrated activityType ${from} → RIDESHARE (${typeResult.modifiedCount} docs)`);
    }
  }

  const activityFieldRenames: Array<[string, string]> = [
    ['carPoolEnabled', 'rideshareEnabled'],
    ['carPoolFree', 'rideshareFree'],
    ['carPoolPriceAed', 'ridesharePriceAed'],
    ['carPoolSeats', 'rideshareSeats'],
    ['carPoolDetails', 'rideshareDetails'],
    ['linkedCarpoolActivityId', 'linkedRideshareActivityId'],
  ];
  for (const [from, to] of activityFieldRenames) {
    await renameFieldIfPresent(db, COLLECTIONS.ACTIVITIES, from, to);
  }

  const intents = db.collection('participant_intents');
  const kindResult = await intents.updateMany({ kind: 'carpool' }, { $set: { kind: 'rideshare' } });
  if (kindResult.modifiedCount > 0) {
    console.log(`[mongo] Migrated participant_intents kind carpool → rideshare (${kindResult.modifiedCount} docs)`);
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

const migrateEmbeddedPersonaParticipantIntentTitles = async (db: Db): Promise<void> => {
  const collection = db.collection('participant_intents');
  const cursor = collection.find({ title: { $type: 'string' } });
  let updated = 0;

  for await (const doc of cursor) {
    const title = typeof doc.title === 'string' ? doc.title.trim() : '';
    const kind = doc.kind;
    if (
      !title ||
      typeof kind !== 'string' ||
      !isEmbeddedPersonaSeekingTitle(title)
    ) {
      continue;
    }

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          title: normalizeEmbeddedPersonaSeekingTitle(title, kind as SeekingTitleKind),
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
  const merchants = db.collection(COLLECTIONS.MERCHANT_PROFILES);
  const tenants = db.collection(COLLECTIONS.TENANTS);
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
  const merchants = db.collection(COLLECTIONS.MERCHANT_PROFILES);
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

  const legacyBadgeRenames: Array<[string, string]> = [
    ['trail_mapper', 'contributor'],
    ['activity_leader', 'host'],
    ['reviewer', 'helpful_critic'],
    ['adventurer', 'goat'],
    ['tier_active', 'active'],
    ['tier_goat', 'goat'],
  ];
  for (const [from, to] of legacyBadgeRenames) {
    const renamed = await badges.updateMany({ badgeKey: from }, { $set: { badgeKey: to } });
    if (renamed.modifiedCount > 0) {
      console.log(`[mongo] Migrated badge key ${from} → ${to} (${renamed.modifiedCount} docs)`);
    }
  }

  const goals = db.collection('user_goals');
  const missingTargetDate = await goals
    .find({ $or: [{ targetDate: { $exists: false } }, { targetDate: null }, { targetDate: '' }] })
    .toArray();
  for (const doc of missingTargetDate) {
    const year = typeof doc.year === 'number' ? doc.year : new Date().getUTCFullYear();
    await goals.updateOne({ _id: doc._id }, { $set: { targetDate: `${year}-12-31` } });
  }
  if (missingTargetDate.length > 0) {
    console.log(`[mongo] Backfilled user_goals.targetDate (${missingTargetDate.length} docs)`);
  }
};

/** Create shop tenants for merchant profiles that still lack tenantId after backfill. */
const provisionShopTenantsForOrphanMerchants = async (db: Db): Promise<void> => {
  type ShopTenantDoc = {
    _id: string;
    name: string;
    slug: string;
    type: string;
    businessMode: string;
    status: string;
    ownerId: string;
    countryCode: string;
    description?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    region?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  const merchants = db.collection<{
    _id: string;
    adminIds?: string[];
    shopName?: string;
    tenantId?: string | null;
    description?: string | null;
    websiteUrl?: string | null;
    logo?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    region?: string | null;
  }>(COLLECTIONS.MERCHANT_PROFILES);
  const tenants = db.collection<ShopTenantDoc>(COLLECTIONS.TENANTS);
  const memberships = db.collection(COLLECTIONS.TENANT_MEMBERSHIPS);

  const orphans = await merchants
    .find({ $or: [{ tenantId: { $exists: false } }, { tenantId: null }] })
    .toArray();

  let createdTenants = 0;
  let linked = 0;

  for (const merchant of orphans) {
    const ownerId = Array.isArray(merchant.adminIds) ? merchant.adminIds[0] : null;
    if (typeof ownerId !== 'string' || !ownerId) continue;

    let shopTenant: ShopTenantDoc | null = await tenants.findOne({ ownerId, businessMode: 'SHOP' });

    if (!shopTenant) {
      const baseSlug = slugify(String(merchant.shopName ?? 'shop'));
      let slug = baseSlug;
      let attempt = 1;
      while (await tenants.findOne({ slug }, { projection: { _id: 1 } })) {
        slug = `${baseSlug}-${attempt}`;
        attempt += 1;
      }

      const tenantId = randomUUID();
      const now = new Date();
      const newTenant: ShopTenantDoc = {
        _id: tenantId,
        name: String(merchant.shopName ?? 'Shop'),
        slug,
        type: 'GUIDE_OWNED',
        businessMode: 'SHOP',
        status: 'ACTIVE',
        ownerId,
        countryCode: 'AE',
        description: merchant.description ?? null,
        website: merchant.websiteUrl ?? null,
        logoUrl: merchant.logo ?? null,
        latitude: merchant.latitude ?? null,
        longitude: merchant.longitude ?? null,
        region: merchant.region ?? null,
        createdAt: now,
        updatedAt: now,
      };
      await tenants.insertOne(newTenant);
      shopTenant = newTenant;
      await memberships.updateOne(
        { tenantId: shopTenant._id, userId: ownerId },
        {
          $set: {
            tenantId: shopTenant._id,
            userId: ownerId,
            role: 'TENANT_OWNER',
            tenant: { status: 'ACTIVE' },
          },
          $setOnInsert: { _id: randomUUID(), createdAt: now },
        },
        { upsert: true }
      );
      createdTenants += 1;
    }

    if (!shopTenant) continue;

    const tenantTaken = await merchants.findOne({
      tenantId: shopTenant._id,
      _id: { $ne: merchant._id },
    });
    if (tenantTaken) continue;

    await merchants.updateOne(
      { _id: merchant._id },
      { $set: { tenantId: shopTenant._id, updatedAt: new Date() } }
    );
    linked += 1;
  }

  if (createdTenants > 0 || linked > 0) {
    console.log(
      `[mongo] Provisioned shop tenants for orphan merchants (tenants created ${createdTenants}, linked ${linked})`
    );
  }
};

const collapseOrderLineItemsIntoShopOrders = async (db: Db): Promise<void> => {
  const orders = db.collection(COLLECTIONS.SHOP_ORDERS);
  const lineItems = db.collection(COLLECTIONS.ORDER_LINE_ITEMS);

  let normalizedOrders = 0;
  const orderCursor = orders.find({ items: { $exists: true, $type: 'array', $ne: [] } });
  for await (const order of orderCursor) {
    const rawItems = Array.isArray(order.items) ? order.items : [];
    const fallbackTimestamp = order.updatedAt instanceof Date ? order.updatedAt : new Date();
    let changed = false;
    const nextItems = rawItems.map((item: Record<string, unknown>, index: number) => {
      const productId = typeof item.productId === 'string' ? item.productId : '';
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      const unitPriceAed =
        typeof item.unitPriceAed === 'number'
          ? item.unitPriceAed
          : typeof item.totalAed === 'number' && quantity > 0
            ? item.totalAed / quantity
            : 0;
      const totalAed =
        typeof item.totalAed === 'number' ? item.totalAed : unitPriceAed * quantity;
      const id =
        typeof item.id === 'string'
          ? item.id
          : `${String(order._id)}:${index}`;
      if (
        item.id !== id ||
        item.totalAed == null ||
        item.status == null ||
        item.timestamp == null
      ) {
        changed = true;
      }
      return {
        id,
        productId,
        quantity,
        unitPriceAed,
        totalAed,
        status: typeof item.status === 'string' ? item.status : 'PENDING',
        fulfillmentTrackingLink:
          typeof item.fulfillmentTrackingLink === 'string' ? item.fulfillmentTrackingLink : null,
        timestamp: item.timestamp instanceof Date ? item.timestamp : fallbackTimestamp,
      };
    });

    if (changed) {
      await orders.updateOne({ _id: order._id }, { $set: { items: nextItems, updatedAt: new Date() } });
      normalizedOrders += 1;
    }
  }

  let mergedLineItems = 0;
  const lineCursor = lineItems.find({});
  for await (const line of lineCursor) {
    const lineId = typeof line._id === 'string' ? line._id : String(line._id);
    const orderId =
      typeof line.orderId === 'string'
        ? line.orderId
        : lineId.includes(':')
          ? lineId.split(':')[0]
          : null;
    if (!orderId) continue;

    const order = await orders.findOne({ _id: orderId } as Document);
    if (!order || !Array.isArray(order.items)) continue;

    const items = [...order.items];
    const indexFromId = lineId.includes(':') ? Number(lineId.split(':')[1]) : -1;
    const index =
      Number.isInteger(indexFromId) && indexFromId >= 0 && indexFromId < items.length
        ? indexFromId
        : items.findIndex((item) => item?.productId === line.productId);

    const quantity = typeof line.quantity === 'number' ? line.quantity : 0;
    const totalAed = typeof line.totalAed === 'number' ? line.totalAed : 0;
    const mergedItem = {
      id: lineId,
      productId: typeof line.productId === 'string' ? line.productId : '',
      quantity,
      unitPriceAed: quantity > 0 ? totalAed / quantity : 0,
      totalAed,
      status: typeof line.status === 'string' ? line.status : 'PENDING',
      fulfillmentTrackingLink:
        typeof line.fulfillmentTrackingLink === 'string' ? line.fulfillmentTrackingLink : null,
      timestamp: line.timestamp instanceof Date ? line.timestamp : new Date(),
    };

    if (index >= 0) {
      items[index] = mergedItem;
    } else {
      items.push(mergedItem);
    }

    await orders.updateOne({ _id: orderId } as Document, { $set: { items, updatedAt: new Date() } });
    mergedLineItems += 1;
  }

  if (normalizedOrders > 0 || mergedLineItems > 0) {
    console.log(
      `[mongo] Collapsed order line items into shop_orders (normalized ${normalizedOrders}, merged ${mergedLineItems})`
    );
  }
};

const migrateParticipantIntentIdsToString = async (db: Db): Promise<void> => {
  const collection = db.collection(COLLECTIONS.PARTICIPANT_INTENTS);
  const cursor = collection.find({ _id: { $type: 'objectId' } });
  let migrated = 0;

  for await (const doc of cursor) {
    const { _id, ...rest } = doc;
    const newId = randomUUID();
    await collection.insertOne({ _id: newId, ...rest } as Document);
    await collection.deleteOne({ _id });
    migrated += 1;
  }

  if (migrated > 0) {
    console.log(`[mongo] Migrated participant_intents _id ObjectId → string UUID (${migrated} docs)`);
  }
};

const backfillParticipantSlotsUsed = async (db: Db): Promise<void> => {
  const activities = db.collection<{ _id: string; participantSlotsUsed?: number }>(COLLECTIONS.ACTIVITIES);
  const participants = db.collection<{ activityId: string }>(COLLECTIONS.ACTIVITY_PARTICIPANTS);

  const counts = await participants
    .aggregate<{ _id: string; count: number }>([{ $group: { _id: '$activityId', count: { $sum: 1 } } }])
    .toArray();

  let updated = 0;
  for (const row of counts) {
    const result = await activities.updateOne(
      { _id: row._id },
      { $set: { participantSlotsUsed: row.count } }
    );
    if (result.modifiedCount > 0) updated += 1;
  }

  const zeroResult = await activities.updateMany(
    { participantSlotsUsed: { $exists: false } },
    { $set: { participantSlotsUsed: 0 } }
  );

  if (updated > 0 || zeroResult.modifiedCount > 0) {
    console.log(
      `[mongo] Backfilled participantSlotsUsed (${updated} from participants, ${zeroResult.modifiedCount} set to 0)`
    );
  }
};

/** Mark legacy map-pin rows as activity anchors; default missing field to catalog-listed. */
const backfillLocationRegistryListed = async (db: Db): Promise<void> => {
  const locations = db.collection('locations');

  const anchorResult = await locations.updateMany(
    {
      registryListed: { $exists: false },
      $or: [
        { name: { $regex: /^Map spot /i } },
        { description: { $regex: /Pinned .* location on the UAE Trail map/i } },
        { description: { $regex: /^Activity location for /i } },
      ],
    },
    { $set: { registryListed: false } }
  );

  const catalogResult = await locations.updateMany(
    { registryListed: { $exists: false } },
    { $set: { registryListed: true } }
  );

  if (anchorResult.modifiedCount > 0 || catalogResult.modifiedCount > 0) {
    console.log(
      `[mongo] Backfilled registryListed (${anchorResult.modifiedCount} activity anchors, ${catalogResult.modifiedCount} catalog defaults)`
    );
  }
};

/** Owners need membership rows for /host scope; legacy data often only set ownerId on tenants. */
const backfillTenantOwnerMemberships = async (db: Db): Promise<void> => {
  const tenants = db.collection('tenants');
  const memberships = db.collection('tenant_memberships');
  let created = 0;

  const cursor = tenants.find({ status: 'ACTIVE' });
  for await (const tenant of cursor) {
    const tenantId = String(tenant._id);
    const ownerId = typeof tenant.ownerId === 'string' ? tenant.ownerId : null;
    if (!ownerId) continue;

    const exists = await memberships.findOne({
      tenantId,
      userId: ownerId,
      isActive: { $ne: false },
    });
    if (exists) continue;

    await memberships.updateOne(
      { tenantId, userId: ownerId },
      {
        $set: {
          tenantId,
          userId: ownerId,
          role: 'TENANT_OWNER',
          isActive: true,
          tenant: { status: tenant.status ?? 'ACTIVE' },
        },
        $setOnInsert: { _id: randomUUID(), createdAt: new Date() },
      },
      { upsert: true }
    );
    created += 1;
  }

  if (created > 0) {
    console.log(`[mongo] Backfilled ${created} tenant owner membership(s)`);
  }
};

/** Demand posts are public participation — not wishlist rows (see wishlist-alerts / FLOW-11). */
const purgeDemandBookmarkWishlistRows = async (db: Db): Promise<void> => {
  const wishlist = db.collection(COLLECTIONS.USER_WISHLIST);
  const result = await wishlist.deleteMany({
    participantIntentId: { $exists: true, $nin: [null, ''] },
  });
  if (result.deletedCount > 0) {
    console.log(
      `[mongo] Removed ${result.deletedCount} legacy demand bookmark row(s) from user_wishlist (wishlist ≠ demand)`
    );
  }
};

/** One-time migrations for activity terminology and role model alignment. */
export const runMongoMigrations = async (db: Db): Promise<void> => {
  await migrateCollectionNameIfNeeded(db, RETIRED_COLLECTION_NAMES.EVENTS, COLLECTIONS.ACTIVITIES);
  await migrateCollectionNameIfNeeded(db, RETIRED_COLLECTION_NAMES.EVENT_REQUESTS, COLLECTIONS.ACTIVITY_REQUESTS);
  await migrateCollectionNameIfNeeded(db, RETIRED_COLLECTION_NAMES.EVENT_PARTICIPANTS, COLLECTIONS.ACTIVITY_PARTICIPANTS);
  await migrateCollectionNameIfNeeded(db, RETIRED_COLLECTION_NAMES.ORGANIZER_APPLICATIONS, COLLECTIONS.HOST_APPLICATIONS);
  await migrateCollectionNameIfNeeded(db, RETIRED_COLLECTION_NAMES.USER_FAVORITES, COLLECTIONS.USER_WISHLIST);

  for (const name of [
    COLLECTIONS.ACTIVITY_REQUESTS,
    COLLECTIONS.ACTIVITY_PARTICIPANTS,
    COLLECTIONS.USER_WISHLIST,
    'chat_messages',
    'notifications',
  ]) {
    await renameFieldIfPresent(db, name, 'eventId', 'activityId');
  }

  await migrateActivityTypeValues(db, COLLECTIONS.ACTIVITIES);
  await migrateActivityTypeValues(db, 'locations');
  await migrateRetiredRideshareActivities(db);
  await migrateCarpoolTerminologyToRideshare(db);
  await renameFieldIfPresent(db, COLLECTIONS.ACTIVITIES, 'guideId', 'hostId');
  await migrateUserRoleVisitorToParticipant(db);
  await migrateAuditLogEntityTypes(db);
  await migrateNotificationKinds(db);
  await migrateActivityJoinModeFromRequirements(db);
  await migrateEmbeddedPersonaParticipantIntentTitles(db);
  await backfillMerchantProfileTenantLinks(db);
  await provisionShopTenantsForOrphanMerchants(db);
  await dedupeMerchantProfileTenantIds(db);
  await backfillParticipantSlotsUsed(db);
  await collapseOrderLineItemsIntoShopOrders(db);
  await migrateParticipantIntentIdsToString(db);
  await migrateActivityTerminologyValues(db);
  await backfillLocationRegistryListed(db);
  await purgeDemandBookmarkWishlistRows(db);
  await backfillTenantOwnerMemberships(db);
  await backfillTenantPublishingPurpose(db);
  await runCatalogCpcMigrations(db);
  await migrateOrganizerNoteToHostNote(db);
  await migrateDemandExplorePinPaths(db);
};

/** One-time: leftover `pin=demand:` notification paths → `pin=activity:{id}`. */
const migrateDemandExplorePinPaths = async (db: Db): Promise<void> => {
  const notifications = db.collection('notifications');
  const leftover = await notifications
    .find({
      $or: [{ path: /pin=demand(:|%3A)/i }, { 'meta.path': /pin=demand(:|%3A)/i }],
    })
    .project({ _id: 1, path: 1, meta: 1 })
    .toArray();
  if (leftover.length === 0) return;

  const activities = db.collection(COLLECTIONS.ACTIVITIES);
  let rewritten = 0;
  const rewritePath = async (path: string): Promise<string | null> => {
    const match = path.match(/(?:^|[?&])pin=(?:demand:|demand%3A)([^&]+)/i);
    if (!match) return null;
    const intentId = decodeURIComponent(match[1]).trim();
    if (!intentId) return null;
    const activity = await activities.findOne(
      { participantIntentId: intentId },
      { projection: { _id: 1 } }
    );
    if (!activity?._id) return null;
    const activityId = String(activity._id);
    return path
      .replace(/pin=demand%3A[^&]*/gi, `pin=activity%3A${encodeURIComponent(activityId)}`)
      .replace(/pin=demand:[^&]*/gi, `pin=activity:${activityId}`);
  };

  for (const row of leftover) {
    const set: Record<string, string> = {};
    if (typeof row.path === 'string') {
      const next = await rewritePath(row.path);
      if (next && next !== row.path) set.path = next;
    }
    const meta =
      row.meta && typeof row.meta === 'object' ? (row.meta as { path?: unknown }) : null;
    const metaPath = typeof meta?.path === 'string' ? meta.path : null;
    if (metaPath) {
      const next = await rewritePath(metaPath);
      if (next && next !== metaPath) set['meta.path'] = next;
    }
    if (Object.keys(set).length === 0) continue;
    await notifications.updateOne({ _id: row._id }, { $set: set });
    rewritten += 1;
  }

  if (rewritten > 0) {
    console.log(`[mongo] Rewrote leftover pin=demand: notification path(s): ${rewritten}`);
  }
};

/** One-time: leftover `organizerNote` → `hostNote`, then drop the leftover field. */
const migrateOrganizerNoteToHostNote = async (db: Db): Promise<void> => {
  const requests = db.collection(COLLECTIONS.ACTIVITY_REQUESTS);
  const copied = await requests.updateMany(
    {
      organizerNote: { $exists: true, $nin: [null, ''] },
      $or: [{ hostNote: { $exists: false } }, { hostNote: null }, { hostNote: '' }],
    },
    [{ $set: { hostNote: '$organizerNote' } }]
  );
  const unset = await requests.updateMany(
    { organizerNote: { $exists: true } },
    { $unset: { organizerNote: '' } }
  );
  if (copied.modifiedCount > 0 || unset.modifiedCount > 0) {
    console.log(
      `[mongo] Migrated organizerNote → hostNote on activity_requests (copied ${copied.modifiedCount}, dropped ${unset.modifiedCount})`
    );
  }

  const notifications = db.collection('notifications');
  const metaCopied = await notifications.updateMany(
    {
      'meta.organizerNote': { $exists: true, $nin: [null, ''] },
      $or: [{ 'meta.hostNote': { $exists: false } }, { 'meta.hostNote': null }, { 'meta.hostNote': '' }],
    },
    [{ $set: { 'meta.hostNote': '$meta.organizerNote' } }]
  );
  const metaUnset = await notifications.updateMany(
    { 'meta.organizerNote': { $exists: true } },
    { $unset: { 'meta.organizerNote': '' } }
  );
  if (metaCopied.modifiedCount > 0 || metaUnset.modifiedCount > 0) {
    console.log(
      `[mongo] Migrated meta.organizerNote → meta.hostNote on notifications (copied ${metaCopied.modifiedCount}, dropped ${metaUnset.modifiedCount})`
    );
  }
};

/** Align tenant rows with community / professional / business publishing tiers. */
const backfillTenantPublishingPurpose = async (db: Db): Promise<void> => {
  const tenants = db.collection('tenants');
  let updated = 0;

  const cursor = tenants.find({ publishingPurpose: { $exists: false } });
  for await (const tenant of cursor) {
    const type = tenant.type as string | undefined;
    const businessMode = tenant.businessMode as string | undefined | null;
    let purpose: string;
    if (type === 'COMPANY' || businessMode === 'AGENCY' || businessMode === 'SHOP') {
      purpose = 'business';
    } else {
      purpose = 'community';
    }
    await tenants.updateOne({ _id: tenant._id }, { $set: { publishingPurpose: purpose } });
    updated += 1;
  }

  if (updated > 0) {
    console.log(`[mongo] Backfilled publishingPurpose on ${updated} tenant(s)`);
  }
};
