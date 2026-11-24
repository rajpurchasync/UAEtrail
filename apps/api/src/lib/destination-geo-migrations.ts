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

/** P3 — dual-field backfill; ids unchanged (`area-seed-*` = `destinationId`). P10 adds `onSiteId`. */
export const runDestinationGeoMigrations = async (db: Db): Promise<void> => {
  await backfillDestinationIdField(db, COLLECTIONS.LOCATIONS);
  await backfillDestinationIdField(db, COLLECTIONS.FACILITIES);
  await backfillDestinationIdField(db, COLLECTIONS.MEMBER_AVAILABILITY);
  await backfillDestinationIdField(db, COLLECTIONS.ACTIVITIES);
  await backfillGeoNodeCatalogDestinationId(db);
  await backfillFacilityOnSiteId(db);
};