import type { AnyBulkWriteOperation, Db, Document, ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';
import { COLLECTIONS } from './collections.js';
import { slugify } from './slug.js';
import {
  inferFitnessFromPlaceDifficulty,
  isEmbeddedPersonaSeekingTitle,
  normalizeEmbeddedPersonaSeekingTitle,
  type SeekingTitleKind,
} from '@uaetrail/shared-types';
import { runCatalogCpcMigrations } from './catalog-cpc-migrations.js';
import { buildDetailRevampSnapshotFromLegacy } from './entity-builders.js';
import { roundMeetingCoordForShell } from './activity-meeting-shell.js';
import { loadTrackPreviewFieldsFromGpxKey } from './gpx-track-preview.js';

const migrateRetiredCollectionToCanonicalAndDrop = async (db: Db, from: string, to: string): Promise<void> => {
  const collections = await db.listCollections().toArray();
  const names = new Set(collections.map((c) => c.name));
  if (!names.has(from)) return;

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

  await source.drop();
  console.log(`[mongo] Migrated collection ${from} → ${to} and dropped ${from}`);
};

const REMOVED_COMMERCE_COLLECTIONS = ['products', 'product_clicks', 'shop_orders', 'order_line_items'] as const;

export const dropRemovedCommerceCollections = async (db: Db): Promise<void> => {
  const collections = await db.listCollections().toArray();
  const names = new Set(collections.map((c) => c.name));
  for (const name of REMOVED_COMMERCE_COLLECTIONS) {
    if (!names.has(name)) continue;
    await db.collection(name).drop();
    console.log(`[mongo] Dropped removed shop-catalog collection ${name}`);
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

const migrateActivityLocationIdAliases = async (db: Db): Promise<void> => {
  const activities = db.collection(COLLECTIONS.ACTIVITIES);
  for (const from of ['placeId', 'venueId', 'location_id'] as const) {
    const result = await activities.updateMany(
      {
        $and: [
          { $or: [{ locationId: { $exists: false } }, { locationId: null }, { locationId: '' }] },
          { [from]: { $exists: true, $nin: [null, ''] } },
        ],
      },
      [{ $set: { locationId: `$${from}` } }]
    );
    if (result.modifiedCount > 0) {
      console.log(`[mongo] Copied ${from} → locationId on activities (${result.modifiedCount} docs)`);
    }
  }
};

const migrateActivityTypeValues = async (db: Db, collectionName: string): Promise<void> => {
  const collection = db.collection(collectionName);
  const aliases: Array<[string, string]> = [
    ['COMMUNITY_EVENT', 'EVENT'],
    ['COMMUNITY_ACTIVITY', 'EVENT'],
    ['community_activity', 'EVENT'],
    ['community_event', 'EVENT'],
    ['hiking', 'HIKING'],
    ['camping', 'CAMPING'],
    ['event', 'EVENT'],
    ['shop', 'SHOP'],
    ['rideshare', 'RIDESHARE'],
  ];
  for (const [from, to] of aliases) {
    const result = await collection.updateMany({ activityType: from }, { $set: { activityType: to } });
    if (result.modifiedCount > 0) {
      console.log(
        `[mongo] Migrated activityType ${from} → ${to} on ${collectionName} (${result.modifiedCount} docs)`
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
    console.log(`[mongo] Migrated retired rideshareEnabled → RIDESHARE (${result.modifiedCount} docs)`);
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
    console.log(`[mongo] Migrated embedded persona seeking titles (${updated} docs)`);
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

/** Public chat is opt-in. Keep existing phone numbers visible until the owner turns them off. */
const backfillShopPublicContactFlags = async (db: Db): Promise<void> => {
  const merchants = db.collection(COLLECTIONS.MERCHANT_PROFILES);
  const chat = await merchants.updateMany(
    { allowInboundChat: { $exists: false } },
    { $set: { allowInboundChat: false } }
  );
  const keepPhone = await merchants.updateMany(
    {
      showContactPhone: { $exists: false },
      contactPhone: { $type: 'string', $nin: [''] },
    },
    { $set: { showContactPhone: true } }
  );
  const hideEmptyPhone = await merchants.updateMany(
    { showContactPhone: { $exists: false } },
    { $set: { showContactPhone: false } }
  );
  const n = chat.modifiedCount + keepPhone.modifiedCount + hideEmptyPhone.modifiedCount;
  if (n > 0) {
    console.log(`[mongo] Backfilled merchant_profiles contact flags (${n} docs)`);
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

  const retiredBadgeRenames: Array<[string, string]> = [
    ['trail_mapper', 'contributor'],
    ['activity_leader', 'host'],
    ['reviewer', 'helpful_critic'],
    ['adventurer', 'goat'],
    ['tier_active', 'active'],
    ['tier_goat', 'goat'],
  ];
  for (const [from, to] of retiredBadgeRenames) {
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

/**
 * Move embedded `gpxKey` / `guideMarkdown` off `locations` into `place_tracks` / `place_guides` (plan §13.5).
 * Idempotent: side docs are upserted; parents are $unset even if side already had a row.
 */
const migrateLocationHeavyFieldsToSideCollections = async (db: Db): Promise<void> => {
  type LocationHeavyMigrateDoc = Document & {
    _id: string;
    gpxKey?: string | null;
    guideMarkdown?: string | null;
  };
  const locations = db.collection<LocationHeavyMigrateDoc>(COLLECTIONS.LOCATIONS);
  type SideIdDoc = { _id: string; gpxKey?: string; updatedAt?: Date };
  type SideGuideDoc = { _id: string; markdown?: string; updatedAt?: Date };
  const placeTracks = db.collection<SideIdDoc>(COLLECTIONS.PLACE_TRACKS);
  const placeGuides = db.collection<SideGuideDoc>(COLLECTIONS.PLACE_GUIDES);

  const cursor = locations.find({
    $or: [{ gpxKey: { $exists: true, $nin: [null, ''] } }, { guideMarkdown: { $exists: true, $nin: [null, ''] } }],
  });
  const batchSize = 150;
  let batch: LocationHeavyMigrateDoc[] = [];
  let movedTracks = 0;
  let movedGuides = 0;
  let clearedParents = 0;

  const flush = async (): Promise<void> => {
    if (batch.length === 0) return;
    const now = new Date();
    for (const doc of batch) {
      const id = doc._id as string;
      const gpxKey = typeof doc.gpxKey === 'string' ? doc.gpxKey.trim() : '';
      const guideMd = typeof doc.guideMarkdown === 'string' ? doc.guideMarkdown.trim() : '';

      if (gpxKey) {
        await placeTracks.updateOne(
          { _id: id },
          { $set: { gpxKey, updatedAt: now } },
          { upsert: true }
        );
        movedTracks += 1;
      }
      if (guideMd) {
        await placeGuides.updateOne(
          { _id: id },
          { $set: { markdown: guideMd, updatedAt: now } },
          { upsert: true }
        );
        movedGuides += 1;
      }

      await locations.updateOne(
        { _id: id },
        { $unset: { gpxKey: '', guideMarkdown: '' } }
      );
      clearedParents += 1;
    }
    batch = [];
  };

  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= batchSize) {
      await flush();
    }
  }
  await flush();

  if (clearedParents > 0) {
    console.log(
      `[mongo] Migrated location heavy fields → place_tracks (${movedTracks} upserts) / place_guides (${movedGuides} upserts); stripped ${clearedParents} location doc(s)`
    );
  }
};

/** Parse GPX files for rows that only have `gpxKey` (e.g. after legacy migration). Idempotent when geometry already set. */
const backfillPlaceTrackGeometryFromGpx = async (db: Db): Promise<void> => {
  const placeTracks = db.collection(COLLECTIONS.PLACE_TRACKS);
  const cursor = placeTracks.find({
    gpxKey: { $exists: true, $nin: [null, ''] },
    $or: [
      { polyline: { $exists: false } },
      { polyline: null },
      { polyline: '' },
      { bbox: { $exists: false } },
      { bbox: null },
    ],
  });
  let updated = 0;
  for await (const doc of cursor) {
    const gpxKey = typeof doc.gpxKey === 'string' ? doc.gpxKey.trim() : '';
    if (!gpxKey) continue;
    const preview = await loadTrackPreviewFieldsFromGpxKey(gpxKey);
    if (!preview) continue;
    const now = new Date();
    await placeTracks.updateOne(
      { _id: doc._id },
      {
        $set: {
          bbox: preview.bbox,
          polyline: preview.polyline,
          profile: preview.profile.length >= 2 ? preview.profile : [],
          updatedAt: now,
        },
      }
    );
    updated += 1;
  }
  if (updated > 0) {
    console.log(`[mongo] Backfilled place_tracks bbox/polyline/profile from GPX (${updated} doc(s))`);
  }
};

/**
 * Exact meeting pin → `activity_private` collection; `activities.meetingLat` / `meetingLng` stay as ~1 km shell (2 decimals).
 * Idempotent: uses `activity_private.exactGeo` as source of truth when present.
 */
const migrateActivityMeetingCoordsToPrivateAndShell = async (db: Db): Promise<void> => {
  const activities = db.collection(COLLECTIONS.ACTIVITIES);
  const activityPrivate = db.collection(COLLECTIONS.ACTIVITY_PRIVATE);

  const cursor = activities.find({
    meetingLat: { $type: 'number', $gte: -90, $lte: 90 },
    meetingLng: { $type: 'number', $gte: -180, $lte: 180 },
  });

  let updatedShell = 0;
  let insertedPrivate = 0;

  for await (const doc of cursor) {
    const id = String(doc._id);
    const priv = await activityPrivate.findOne({ _id: id } as Document);
    const now = new Date();

    if (priv?.exactGeo?.coordinates && Array.isArray(priv.exactGeo.coordinates)) {
      const [plng, plat] = priv.exactGeo.coordinates as [number, number];
      if (typeof plat === 'number' && typeof plng === 'number' && !Number.isNaN(plat) && !Number.isNaN(plng)) {
        const shellLat = roundMeetingCoordForShell(plat);
        const shellLng = roundMeetingCoordForShell(plng);
        await activities.updateOne(
          { _id: id } as Document,
          { $set: { meetingLat: shellLat, meetingLng: shellLng } }
        );
        updatedShell += 1;
        continue;
      }
    }

    const lat = doc.meetingLat as number;
    const lng = doc.meetingLng as number;
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

    const meetingPoint = typeof doc.meetingPoint === 'string' ? doc.meetingPoint.trim() || null : null;
    await activityPrivate.updateOne(
      { _id: id } as Document,
      {
        $set: {
          exactGeo: { type: 'Point', coordinates: [lng, lat] },
          meetingNotes: meetingPoint,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
    insertedPrivate += 1;

    await activities.updateOne(
      { _id: id } as Document,
      {
        $set: {
          meetingLat: roundMeetingCoordForShell(lat),
          meetingLng: roundMeetingCoordForShell(lng),
        },
      }
    );
    updatedShell += 1;
  }

  if (insertedPrivate > 0 || updatedShell > 0) {
    console.log(
      `[mongo] Activity meeting coords: shell rows aligned ${updatedShell}, new activity_private ${insertedPrivate}`
    );
  }
};

/** Detail pages revamp — embed v2 shell fields; legacy string `itinerary` → `itinerarySteps` + empty `itinerary`. */
const migrateActivityDetailSchemaV2 = async (db: Db): Promise<void> => {
  const activities = db.collection(COLLECTIONS.ACTIVITIES);
  const locations = db.collection(COLLECTIONS.LOCATIONS);
  const requests = db.collection(COLLECTIONS.ACTIVITY_REQUESTS);
  const participants = db.collection(COLLECTIONS.ACTIVITY_PARTICIPANTS);

  const cursor = activities.find({
    $or: [{ schemaVersion: { $ne: 2 } }, { schemaVersion: { $exists: false } }],
  });

  const ops: AnyBulkWriteOperation<Document>[] = [];
  let migrated = 0;

  for await (const doc of cursor) {
    const id = doc._id;
    const itineraryLines = Array.isArray(doc.itinerary) ? (doc.itinerary as string[]) : [];
    const requirements = Array.isArray(doc.requirements) ? (doc.requirements as string[]) : [];
    const description = typeof doc.description === 'string' ? doc.description : '';
    const priceAed = typeof doc.priceAed === 'number' ? doc.priceAed : 0;
    const pricingMode =
      doc.pricingMode === 'free' || doc.pricingMode === 'shared' || doc.pricingMode === 'paid'
        ? doc.pricingMode
        : null;

    const loc =
      doc.locationId && typeof doc.locationId === 'string'
        ? await locations.findOne(
            { _id: doc.locationId } as Document,
            { projection: { difficulty: 1, childFriendly: 1 } }
          )
        : null;

    let going =
      typeof doc.participantSlotsUsed === 'number'
        ? doc.participantSlotsUsed
        : await participants.countDocuments({ activityId: id });
    going = Math.min(going, typeof doc.capacity === 'number' ? doc.capacity : going);

    const waitlisted = await requests.countDocuments({ activityId: id, status: 'WAITLISTED' });
    const pending = await requests.countDocuments({ activityId: id, status: 'PENDING' });

    const revamp = buildDetailRevampSnapshotFromLegacy({
      itineraryLines,
      requirements,
      description,
      priceAed,
      pricingMode,
    });

    const fitness = inferFitnessFromPlaceDifficulty(loc?.difficulty as string | undefined);
    const audience = {
      ...revamp.audience!,
      fitness,
      kidsWelcome: Boolean(revamp.audience?.kidsWelcome) || Boolean(loc?.childFriendly),
    };

    const needsReview: string[] = [];
    if (!description.trim()) needsReview.push('description');
    if (!doc.endAt) needsReview.push('endAt');

    const confidence: Record<string, 'migrated'> = {
      itinerarySteps: 'migrated',
      gear: 'migrated',
      priceBreakdown: 'migrated',
      policyKey: 'migrated',
      summary: 'migrated',
      audience: 'migrated',
      counts: 'migrated',
    };

    ops.push({
      updateOne: {
        filter: { _id: id } as Document,
        update: {
          $set: {
            schemaVersion: revamp.schemaVersion,
            itinerary: revamp.itinerary,
            summary: revamp.summary,
            itinerarySteps: revamp.itinerarySteps,
            gear: revamp.gear,
            priceBreakdown: revamp.priceBreakdown,
            policyKey: revamp.policyKey,
            audience,
            waiverRequired: revamp.waiverRequired ?? false,
            waitlist: typeof doc.waitlist === 'boolean' ? doc.waitlist : true,
            counts: { going, waitlisted, pending },
            needsReview,
            confidence,
          },
        },
      },
    });

    if (ops.length >= 200) {
      await activities.bulkWrite(ops, { ordered: false });
      migrated += ops.length;
      ops.length = 0;
    }
  }

  if (ops.length > 0) {
    await activities.bulkWrite(ops, { ordered: false });
    migrated += ops.length;
  }

  if (migrated > 0) {
    console.log(`[mongo] Detail schema v2 migration applied (${migrated} activity documents)`);
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

/** Mark retired map-pin rows as activity anchors; default missing field to catalog-listed. */
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

/** Owners need membership rows for /host scope; older tenants often only set ownerId. */
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

/** Wishlist is venue + activity only — drop retired product, shop, profile, and demand bookmark rows. */
const purgeRetiredWishlistTargetRows = async (db: Db): Promise<void> => {
  const wishlist = db.collection(COLLECTIONS.USER_WISHLIST);
  const retiredTargetFilter = {
    $or: [
      { productId: { $exists: true, $nin: [null, ''] } },
      { merchantId: { $exists: true, $nin: [null, ''] } },
      { tenantId: { $exists: true, $nin: [null, ''] } },
      { profileUserId: { $exists: true, $nin: [null, ''] } },
      { participantIntentId: { $exists: true, $nin: [null, ''] } },
    ],
  };
  const result = await wishlist.deleteMany(retiredTargetFilter);
  if (result.deletedCount > 0) {
    console.log(`[mongo] Removed ${result.deletedCount} retired non-venue/activity wishlist row(s)`);
  }
};

/**
 * Product waitlist default is true. Only fill when the field is missing so a host
 * who later set `waitlist: false` is preserved (legacy false-from-default already
 * written during schema v2 cannot be distinguished and is left as-is).
 */
const backfillActivityWaitlistAndCounts = async (db: Db): Promise<void> => {
  const activities = db.collection(COLLECTIONS.ACTIVITIES);
  const requests = db.collection(COLLECTIONS.ACTIVITY_REQUESTS);
  const participants = db.collection(COLLECTIONS.ACTIVITY_PARTICIPANTS);

  const waitlistResult = await activities.updateMany(
    { waitlist: { $exists: false } },
    { $set: { waitlist: true } }
  );

  const missingCounts = activities.find({
    $or: [{ counts: { $exists: false } }, { 'counts.going': { $exists: false } }],
  });
  const ops: AnyBulkWriteOperation<Document>[] = [];
  let countBackfill = 0;
  for await (const doc of missingCounts) {
    const id = doc._id;
    let going =
      typeof doc.participantSlotsUsed === 'number'
        ? doc.participantSlotsUsed
        : await participants.countDocuments({ activityId: id });
    if (typeof doc.capacity === 'number') going = Math.min(going, doc.capacity);
    const waitlisted = await requests.countDocuments({ activityId: id, status: 'WAITLISTED' });
    const pending = await requests.countDocuments({ activityId: id, status: 'PENDING' });
    ops.push({
      updateOne: {
        filter: { _id: id } as Document,
        update: { $set: { counts: { going, waitlisted, pending } } },
      },
    });
    if (ops.length >= 200) {
      await activities.bulkWrite(ops, { ordered: false });
      countBackfill += ops.length;
      ops.length = 0;
    }
  }
  if (ops.length > 0) {
    await activities.bulkWrite(ops, { ordered: false });
    countBackfill += ops.length;
  }

  if (waitlistResult.modifiedCount > 0 || countBackfill > 0) {
    console.log(
      `[mongo] Backfilled waitlist default (${waitlistResult.modifiedCount}) and counts (${countBackfill})`
    );
  }
};

/** Finish schemaVersion 2 shell fields when v2 migration ran but left gaps. */
const backfillIncompleteActivityRevampFields = async (db: Db): Promise<void> => {
  const activities = db.collection(COLLECTIONS.ACTIVITIES);
  const cursor = activities.find({
    $or: [
      { schemaVersion: { $ne: 2 } },
      { schemaVersion: { $exists: false } },
      { priceBreakdown: { $exists: false } },
      { policyKey: { $exists: false } },
      { audience: { $exists: false } },
      { gear: { $exists: false } },
      { itinerarySteps: { $exists: false } },
    ],
  });
  const ops: AnyBulkWriteOperation<Document>[] = [];
  let migrated = 0;
  for await (const doc of cursor) {
    const itineraryLines = Array.isArray(doc.itinerary) ? (doc.itinerary as string[]) : [];
    const requirements = Array.isArray(doc.requirements) ? (doc.requirements as string[]) : [];
    const description = typeof doc.description === 'string' ? doc.description : '';
    const priceAed = typeof doc.priceAed === 'number' ? doc.priceAed : 0;
    const pricingMode =
      doc.pricingMode === 'free' || doc.pricingMode === 'shared' || doc.pricingMode === 'paid'
        ? doc.pricingMode
        : null;
    const revamp = buildDetailRevampSnapshotFromLegacy({
      itineraryLines,
      requirements,
      description,
      priceAed,
      pricingMode,
    });
    const set: Record<string, unknown> = {
      schemaVersion: 2,
    };
    if (doc.priceBreakdown == null) set.priceBreakdown = revamp.priceBreakdown;
    if (doc.policyKey == null) set.policyKey = revamp.policyKey;
    if (doc.audience == null) set.audience = revamp.audience;
    if (doc.gear == null) set.gear = revamp.gear;
    if (doc.itinerarySteps == null) set.itinerarySteps = revamp.itinerarySteps;
    if (doc.summary == null) set.summary = revamp.summary;
    if (doc.waiverRequired == null) set.waiverRequired = revamp.waiverRequired ?? false;
    ops.push({
      updateOne: { filter: { _id: doc._id } as Document, update: { $set: set } },
    });
    if (ops.length >= 200) {
      await activities.bulkWrite(ops, { ordered: false });
      migrated += ops.length;
      ops.length = 0;
    }
  }
  if (ops.length > 0) {
    await activities.bulkWrite(ops, { ordered: false });
    migrated += ops.length;
  }
  if (migrated > 0) {
    console.log(`[mongo] Completed incomplete activity revamp fields (${migrated} documents)`);
  }
};

/** Ensure reserved / side collections exist even before the first write. */
const ensureRevampCollectionsExist = async (db: Db): Promise<void> => {
  const names = new Set((await db.listCollections().toArray()).map((c) => c.name));
  const required = [
    COLLECTIONS.VERIFICATION_DOCUMENTS,
    COLLECTIONS.PAYMENTS,
    COLLECTIONS.WEATHER_CACHE,
    COLLECTIONS.ACTIVITY_PRIVATE,
    COLLECTIONS.GEO_NODES,
    COLLECTIONS.GEO_STATS,
    COLLECTIONS.GEO_OUTBOX,
    COLLECTIONS.GEO_META,
    COLLECTIONS.SUBMISSIONS,
    COLLECTIONS.AMENITY_REPORTS,
    COLLECTIONS.MERGES,
    COLLECTIONS.CATALOGS,
    COLLECTIONS.PLACE_TRACKS,
    COLLECTIONS.PLACE_GUIDES,
    COLLECTIONS.REFERRAL_CLICKS,
    COLLECTIONS.PLATFORM_ALERTS,
  ];
  for (const name of required) {
    if (names.has(name)) continue;
    await db.createCollection(name);
  }
};

const renameUnsupportedOnServer = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('renameCollection') || message.includes('API Version');
};

/** Rename when allowed; otherwise copy documents and drop source (Atlas apiStrict). */
const renameCollectionIfExists = async (db: Db, from: string, to: string): Promise<void> => {
  const names = new Set((await db.listCollections().toArray()).map((c) => c.name));
  if (!names.has(from) || names.has(to)) return;

  try {
    await db.collection(from).rename(to);
    return;
  } catch (error) {
    if (!renameUnsupportedOnServer(error)) throw error;
  }

  if (!names.has(to)) {
    await db.createCollection(to);
  }
  const source = db.collection(from);
  const dest = db.collection(to);
  const BATCH = 500;
  let batch: Record<string, unknown>[] = [];
  for await (const doc of source.find({})) {
    batch.push(doc as Record<string, unknown>);
    if (batch.length < BATCH) continue;
    await dest.insertMany(batch, { ordered: false });
    batch = [];
  }
  if (batch.length > 0) {
    await dest.insertMany(batch, { ordered: false });
  }
  try {
    await source.drop();
  } catch (dropError) {
    console.warn(
      `[mongo] Could not drop legacy collection ${from} after copy → ${to}: ${
        dropError instanceof Error ? dropError.message : String(dropError)
      }`
    );
  }
};

/** Rename legacy buddy_* graph collections → friend_*. */
const migrateFriendGraphCollections = async (db: Db): Promise<void> => {
  await renameCollectionIfExists(db, COLLECTIONS.LEGACY_BUDDY_REQUESTS, COLLECTIONS.FRIEND_REQUESTS);
  await renameCollectionIfExists(db, COLLECTIONS.LEGACY_BUDDY_PAIRS, COLLECTIONS.FRIEND_PAIRS);
};

/** Rename social_* collections → member_* and backfill kind / teamLabel. */
const migrateMemberGroupModelSplit = async (db: Db): Promise<void> => {
  await renameCollectionIfExists(db, COLLECTIONS.LEGACY_SOCIAL_GROUPS, COLLECTIONS.MEMBER_GROUPS);
  await renameCollectionIfExists(db, COLLECTIONS.LEGACY_SOCIAL_GROUP_MEMBERS, COLLECTIONS.MEMBER_GROUP_MEMBERS);
  await renameCollectionIfExists(db, COLLECTIONS.LEGACY_SOCIAL_GROUP_INVITES, COLLECTIONS.MEMBER_GROUP_INVITES);
  await renameCollectionIfExists(db, COLLECTIONS.LEGACY_SOCIAL_GROUP_WALL, COLLECTIONS.MEMBER_GROUP_WALL);
  await renameCollectionIfExists(
    db,
    COLLECTIONS.LEGACY_SOCIAL_GROUP_WALL_REACTIONS,
    COLLECTIONS.MEMBER_GROUP_WALL_REACTIONS
  );

  const groups = db.collection(COLLECTIONS.MEMBER_GROUPS);
  const cursor = groups.find({ kind: { $exists: false } });
  for await (const doc of cursor) {
    const storedType = typeof doc.type === 'string' ? doc.type : 'friends';
    const kind =
      storedType === 'activity' || storedType === 'outing_crew' ? 'outing_crew' : 'team';
    const teamLabel =
      kind === 'team'
        ? storedType === 'family' || storedType === 'friends' || storedType === 'colleagues'
          ? storedType
          : 'friends'
        : null;
    await groups.updateOne({ _id: doc._id }, { $set: { kind, teamLabel } });
  }
};

/** `activity_crew` → `outing_crew`; legacy `type: activity` → `outing_crew`. */
const migrateOutingCrewKindRename = async (db: Db): Promise<void> => {
  const groups = db.collection(COLLECTIONS.MEMBER_GROUPS);
  await groups.updateMany({ kind: 'activity_crew' }, { $set: { kind: 'outing_crew' } });
  await groups.updateMany(
    {
      $or: [
        { kind: 'outing_crew' },
        { kind: 'activity_crew' },
        { type: { $in: ['activity', 'outing_crew'] } },
        { activityId: { $exists: true, $ne: null } },
      ],
    },
    { $set: { type: 'outing_crew' } }
  );
  await groups.updateMany(
    { activityId: { $exists: true, $ne: null } },
    { $set: { kind: 'outing_crew', teamLabel: null } }
  );
};

/** Bump when adding a new migration step so existing deployments run it once. */
export const MONGO_MIGRATION_VERSION = 2025112503;

/** One-time migrations for activity terminology and role model alignment. */
export const runMongoMigrations = async (db: Db): Promise<void> => {
  const meta = db.collection<{ _id: string; version?: number }>('schema_meta');
  const state = await meta.findOne({ _id: 'migrations' });
  if (typeof state?.version === 'number' && state.version >= MONGO_MIGRATION_VERSION) {
    return;
  }

  await migrateRetiredCollectionToCanonicalAndDrop(db, 'events', COLLECTIONS.ACTIVITIES);
  await migrateRetiredCollectionToCanonicalAndDrop(db, 'event_requests', COLLECTIONS.ACTIVITY_REQUESTS);
  await migrateRetiredCollectionToCanonicalAndDrop(db, 'event_participants', COLLECTIONS.ACTIVITY_PARTICIPANTS);
  await migrateRetiredCollectionToCanonicalAndDrop(db, 'organizer_applications', COLLECTIONS.HOST_APPLICATIONS);
  await migrateRetiredCollectionToCanonicalAndDrop(db, 'user_favorites', COLLECTIONS.USER_WISHLIST);

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
  await migrateActivityLocationIdAliases(db);
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
  await migrateActivityDetailSchemaV2(db);
  await backfillIncompleteActivityRevampFields(db);
  await backfillActivityWaitlistAndCounts(db);
  await ensureRevampCollectionsExist(db);
  await migrateLocationHeavyFieldsToSideCollections(db);
  await backfillPlaceTrackGeometryFromGpx(db);
  await migrateActivityMeetingCoordsToPrivateAndShell(db);
  await migrateParticipantIntentIdsToString(db);
  await migrateActivityTerminologyValues(db);
  await backfillLocationRegistryListed(db);
  await purgeRetiredWishlistTargetRows(db);
  await backfillTenantOwnerMemberships(db);
  await backfillTenantPublishingPurpose(db);
  await runCatalogCpcMigrations(db);
  await migrateOrganizerNoteToHostNote(db);
  await migrateDemandExplorePinPaths(db);
  await dropRemovedCommerceCollections(db);
  await backfillShopPublicContactFlags(db);
  await migrateMemberGroupModelSplit(db);
  await migrateFriendGraphCollections(db);
  await migrateOutingCrewKindRename(db);
  const { purgeRetiredSeekingStorage } = await import('./retired-seeking-storage-purge.js');
  const seekingPurge = await purgeRetiredSeekingStorage(db);
  if (
    seekingPurge.participantIntentsCancelled > 0 ||
    seekingPurge.seekingActivitiesRetired > 0 ||
    seekingPurge.participantIntentRequestsDeleted > 0
  ) {
    console.log(`[mongo] Retired seeking legacy storage: ${JSON.stringify(seekingPurge)}`);
  }
  const { backfillGeoRefOnPins } = await import('./geo-backfill.js');
  await backfillGeoRefOnPins(db);
  const { migrateStaleNotificationBookmarkPaths } = await import(
    './notification-bookmark-path-migration.js'
  );
  await migrateStaleNotificationBookmarkPaths(db);
  await migrateMemberAvailabilityBuddiesVisibility(db);
  const { runDestinationGeoMigrations } = await import('./destination-geo-migrations.js');
  await runDestinationGeoMigrations(db);
  const { seedCatalogsIfEmpty } = await import('./catalogs-store.js');
  await seedCatalogsIfEmpty();

  await meta.updateOne(
    { _id: 'migrations' },
    { $set: { version: MONGO_MIGRATION_VERSION, appliedAt: new Date() } },
    { upsert: true }
  );
};

/** One-time: stored availability visibility `buddies` → `friends`. */
const migrateMemberAvailabilityBuddiesVisibility = async (db: Db): Promise<void> => {
  const col = db.collection(COLLECTIONS.MEMBER_AVAILABILITY);
  const result = await col.updateMany({ visibility: 'buddies' }, { $set: { visibility: 'friends' } });
  if (result.modifiedCount > 0) {
    console.log(`[mongo] member_availability visibility buddies→friends: ${result.modifiedCount}`);
  }
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
