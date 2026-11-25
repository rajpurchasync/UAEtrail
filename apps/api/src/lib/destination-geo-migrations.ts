import type { Db } from 'mongodb';
import { COLLECTIONS } from './collections.js';

const backfillDestinationIdField = async (db: Db, collectionName: string): Promise<void> => {
  const col = db.collection(collectionName);
  const result = await col.updateMany(
    { areaId: { $exists: true, $type: 'string', $nin: ['', ' '] } },
    [{ $set: { destinationId: { $ifNull: ['$destinationId', '$areaId'] } } }]
  );
  if (result.modifiedCount > 0) {
    console.log(
      `[mongo] MIG-DESTINATION-GEO: destinationId ← areaId on ${collectionName}: ${result.modifiedCount}`
    );
  }
};

const backfillGeoNodeCatalogDestinationId = async (db: Db): Promise<void> => {
  const col = db.collection(COLLECTIONS.GEO_NODES);
  const result = await col.updateMany(
    { catalogAreaId: { $exists: true, $type: 'string', $nin: ['', ' '] } },
    [{ $set: { catalogDestinationId: { $ifNull: ['$catalogDestinationId', '$catalogAreaId'] } } }]
  );
  if (result.modifiedCount > 0) {
    console.log(
      `[mongo] MIG-DESTINATION-GEO: catalogDestinationId ← catalogAreaId on geo_nodes: ${result.modifiedCount}`
    );
  }
};

const backfillFacilityOnSiteId = async (db: Db): Promise<void> => {
  const col = db.collection(COLLECTIONS.FACILITIES);
  const result = await col.updateMany(
    { parentPlaceId: { $exists: true, $type: 'string', $nin: ['', ' '] } },
    [{ $set: { onSiteId: { $ifNull: ['$onSiteId', '$parentPlaceId'] } } }]
  );
  if (result.modifiedCount > 0) {
    console.log(
      `[mongo] MIG-DESTINATION-GEO: onSiteId ← parentPlaceId on facilities: ${result.modifiedCount}`
    );
  }
};

const stripLegacyCatalogFields = async (db: Db, collectionName: string): Promise<void> => {
  const col = db.collection(collectionName);
  const result = await col.updateMany({}, { $unset: { areaId: '' } });
  if (result.modifiedCount > 0) {
    console.log(`[mongo] MIG-DESTINATION-GEO: removed areaId on ${collectionName}: ${result.modifiedCount}`);
  }
};

const stripLegacyFacilitySiteField = async (db: Db): Promise<void> => {
  const col = db.collection(COLLECTIONS.FACILITIES);
  const result = await col.updateMany({}, { $unset: { parentPlaceId: '' } });
  if (result.modifiedCount > 0) {
    console.log(`[mongo] MIG-DESTINATION-GEO: removed parentPlaceId on facilities: ${result.modifiedCount}`);
  }
};

const stripLegacyGeoNodeCatalogAreaId = async (db: Db): Promise<void> => {
  const col = db.collection(COLLECTIONS.GEO_NODES);
  const result = await col.updateMany({}, { $unset: { catalogAreaId: '' } });
  if (result.modifiedCount > 0) {
    console.log(`[mongo] MIG-DESTINATION-GEO: removed catalogAreaId on geo_nodes: ${result.modifiedCount}`);
  }
};

const renameAreasCollectionToDestinations = async (db: Db): Promise<void> => {
  const legacy = await db.listCollections({ name: 'areas' }, { nameOnly: true }).toArray();
  if (legacy.length === 0) return;
  const canonical = await db.listCollections({ name: 'destinations' }, { nameOnly: true }).toArray();
  if (canonical.length > 0) {
    console.log('[mongo] MIG-DESTINATION-GEO: both areas and destinations exist — manual merge required');
    return;
  }
  await db.collection('areas').rename('destinations');
  console.log('[mongo] MIG-DESTINATION-GEO: renamed collection areas → destinations');
};

const backfillPlaceHubLabelFromLegacy = async (db: Db, collectionName: string): Promise<void> => {
  const col = db.collection(collectionName);
  const result = await col.updateMany(
    {
      areaLabel: { $exists: true, $type: 'string', $nin: ['', ' '] },
      $or: [{ placeHubLabel: { $exists: false } }, { placeHubLabel: { $in: [null, ''] } }],
    },
    [{ $set: { placeHubLabel: '$areaLabel' } }]
  );
  if (result.modifiedCount > 0) {
    console.log(
      `[mongo] MIG-DESTINATION-GEO: placeHubLabel ← areaLabel on ${collectionName}: ${result.modifiedCount}`
    );
  }
  const unset = await col.updateMany({ areaLabel: { $exists: true } }, { $unset: { areaLabel: '' } });
  if (unset.modifiedCount > 0) {
    console.log(`[mongo] MIG-DESTINATION-GEO: removed areaLabel on ${collectionName}: ${unset.modifiedCount}`);
  }
};

/** Backfill canonical fields, then drop legacy storage keys (`areaId`, `parentPlaceId`, …). */
export const runDestinationGeoMigrations = async (db: Db): Promise<void> => {
  await renameAreasCollectionToDestinations(db);
  await backfillPlaceHubLabelFromLegacy(db, COLLECTIONS.LOCATIONS);
  await backfillPlaceHubLabelFromLegacy(db, COLLECTIONS.FACILITIES);
  await backfillDestinationIdField(db, COLLECTIONS.LOCATIONS);
  await backfillDestinationIdField(db, COLLECTIONS.FACILITIES);
  await backfillDestinationIdField(db, COLLECTIONS.MEMBER_AVAILABILITY);
  await backfillDestinationIdField(db, COLLECTIONS.ACTIVITIES);
  await backfillGeoNodeCatalogDestinationId(db);
  await backfillFacilityOnSiteId(db);
  await stripLegacyCatalogFields(db, COLLECTIONS.LOCATIONS);
  await stripLegacyCatalogFields(db, COLLECTIONS.FACILITIES);
  await stripLegacyCatalogFields(db, COLLECTIONS.MEMBER_AVAILABILITY);
  await stripLegacyCatalogFields(db, COLLECTIONS.ACTIVITIES);
  await backfillDestinationIdField(db, COLLECTIONS.USER_WISHLIST);
  await stripLegacyCatalogFields(db, COLLECTIONS.USER_WISHLIST);
  await stripLegacyGeoNodeCatalogAreaId(db);
  await stripLegacyFacilitySiteField(db);
};