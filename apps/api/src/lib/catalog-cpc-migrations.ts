import type { Db, Document } from 'mongodb';
import {
  isFacilityPlaceKind,
  isFacilityKind,
  placeKindFromLocationRow,
  type FacilityKind,
  type PlaceKind,
} from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { catalogLifecycleFromLocationRow } from './catalog-lifecycle-map.js';

type LocationRow = {
  _id: string;
  name?: string;
  region?: string;
  placeHubLabel?: string | null;
  areaId?: string | null;
  activityType?: string;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
  images?: string[];
  tags?: string[];
  status?: string;
  featured?: boolean;
  registryListed?: boolean;
  submittedById?: string | null;
  registeredByUserId?: string | null;
  moderationStatus?: string;
  publicationStatus?: string;
  parentPlaceId?: string | null;
  countryCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const isCommunityShopLocation = (doc: LocationRow): boolean => {
  const activityType = String(doc.activityType ?? '').toUpperCase();
  if (activityType !== 'SHOP') return false;
  return (doc.tags ?? []).includes('community-shop');
};

const facilityKindFromLocationRow = (doc: LocationRow): FacilityKind | null => {
  if (isCommunityShopLocation(doc)) return 'outdoor_shop';

  const placeKind = placeKindFromLocationRow({
    activityType: String(doc.activityType ?? ''),
    tags: doc.tags ?? [],
  });
  if (!isFacilityPlaceKind(placeKind)) return null;
  if (!isFacilityKind(placeKind)) return null;
  return placeKind;
};

/** True when a legacy `locations` row should mirror into `facilities` (amenity / outdoor_shop pin). */
export const locationRowRepresentsFacility = (doc: LocationRow): boolean =>
  facilityKindFromLocationRow(doc) !== null;

const parentPlaceIdFromLocationRow = (doc: LocationRow): string | null => {
  if (typeof doc.parentPlaceId === 'string' && doc.parentPlaceId.trim()) {
    return doc.parentPlaceId.trim();
  }
  const tag = (doc.tags ?? []).find((t) => t.startsWith('parent-place:'));
  if (!tag) return null;
  const id = tag.slice('parent-place:'.length).trim();
  return id || null;
};

const buildFacilityDocFromLocation = (doc: LocationRow, facilityKind: FacilityKind) => {
  const lifecycle = catalogLifecycleFromLocationRow({
    status: String(doc.status ?? 'ACTIVE'),
    registryListed: doc.registryListed,
  });
  const registeredByUserId = doc.registeredByUserId ?? doc.submittedById ?? null;
  const now = new Date();
  const areaId = typeof doc.areaId === 'string' && doc.areaId.trim() ? doc.areaId.trim() : '';

  return {
    _id: doc._id,
    name: doc.name ?? 'Facility',
    region: doc.region ?? 'UAE',
    placeHubLabel: doc.placeHubLabel ?? null,
    areaId,
    facilityKind,
    parentPlaceId: parentPlaceIdFromLocationRow(doc),
    description: doc.description ?? '',
    latitude: doc.latitude ?? null,
    longitude: doc.longitude ?? null,
    images: doc.images ?? [],
    tags: doc.tags ?? [],
    status: doc.status ?? 'ACTIVE',
    moderationStatus: lifecycle.moderationStatus,
    publicationStatus: lifecycle.publicationStatus,
    registeredByUserId,
    submittedById: doc.submittedById ?? null,
    countryCode: doc.countryCode ?? 'AE',
    featured: Boolean(doc.featured),
    registryListed: doc.registryListed,
    createdAt: doc.createdAt ?? now,
    updatedAt: doc.updatedAt ?? now,
    legacyLocationId: doc._id,
  };
};

/** M1 — indexes for `facilities` (idempotent). */
export const ensureFacilitiesCollectionIndexes = async (db: Db): Promise<void> => {
  await db.collection(COLLECTIONS.FACILITIES).createIndexes([
    { key: { areaId: 1, facilityKind: 1, status: 1 }, sparse: true },
    { key: { parentPlaceId: 1, facilityKind: 1 }, sparse: true },
    { key: { moderationStatus: 1, publicationStatus: 1 } },
    { key: { registeredByUserId: 1, createdAt: -1 }, sparse: true },
    { key: { submittedById: 1, createdAt: -1 }, sparse: true },
    { key: { geo: '2dsphere' }, sparse: true },
  ]);
};

/** M2 + M3 — upsert facility rows from legacy `locations` amenity + community shop pins. */
/** Dual-write helper — keep `facilities` row in sync after a `locations` amenity write. */
export const upsertFacilityFromLocationRow = async (
  db: Db,
  doc: LocationRow
): Promise<boolean> => {
  const facilityKind = facilityKindFromLocationRow(doc);
  if (!facilityKind) return false;

  const facilities = db.collection(COLLECTIONS.FACILITIES);
  const payload = buildFacilityDocFromLocation(doc, facilityKind);
  const { _id, createdAt, ...fields } = payload;
  await facilities.updateOne(
    { _id } as Document,
    {
      $set: { ...fields, updatedAt: new Date() },
      $setOnInsert: { createdAt },
    },
    { upsert: true }
  );
  return true;
};

export const backfillFacilitiesFromLocations = async (db: Db): Promise<number> => {
  const locations = db.collection<LocationRow>(COLLECTIONS.LOCATIONS);
  const facilities = db.collection(COLLECTIONS.FACILITIES);
  let upserted = 0;

  const cursor = locations.find({});
  for await (const doc of cursor) {
    const facilityKind = facilityKindFromLocationRow(doc);
    if (!facilityKind) continue;

    const payload = buildFacilityDocFromLocation(doc, facilityKind);
    const { _id, createdAt, ...fields } = payload;
    const result = await facilities.updateOne(
      { _id } as Document,
      {
        $set: {
          ...fields,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt },
      },
      { upsert: true }
    );
    if (result.upsertedCount > 0 || result.modifiedCount > 0) upserted += 1;
  }

  if (upserted > 0) {
    console.log(`[mongo] CPC backfill: synced ${upserted} facility row(s) from locations`);
  }
  return upserted;
};

/** M4 — lifecycle + registeredByUserId on places and facilities. */
export const backfillCatalogLifecycleFields = async (db: Db): Promise<number> => {
  let updated = 0;

  for (const collectionName of [COLLECTIONS.LOCATIONS, COLLECTIONS.FACILITIES]) {
    const collection = db.collection(collectionName);
    const cursor = collection.find({
      $or: [{ moderationStatus: { $exists: false } }, { publicationStatus: { $exists: false } }],
    });

    for await (const doc of cursor) {
      const row = doc as unknown as LocationRow;
      const lifecycle = catalogLifecycleFromLocationRow({
        status: String(row.status ?? 'ACTIVE'),
        registryListed: row.registryListed,
      });
      const registeredByUserId = row.registeredByUserId ?? row.submittedById ?? null;
      const result = await collection.updateOne(
        { _id: row._id } as Document,
        {
          $set: {
            moderationStatus: lifecycle.moderationStatus,
            publicationStatus: lifecycle.publicationStatus,
            ...(registeredByUserId ? { registeredByUserId } : {}),
          },
        }
      );
      if (result.modifiedCount > 0) updated += 1;
    }
  }

  if (updated > 0) {
    console.log(`[mongo] CPC backfill: catalog lifecycle on ${updated} row(s)`);
  }
  return updated;
};

export type CatalogCpcReconciliation = {
  locationAmenityRows: number;
  communityShopRows: number;
  facilitiesCollectionCount: number;
  outdoorShopFacilities: number;
};

/** Staging / test helper — compare source locations vs `facilities` collection. */
export const reconcileCatalogCpcMigration = async (db: Db): Promise<CatalogCpcReconciliation> => {
  const locations = db.collection<LocationRow>(COLLECTIONS.LOCATIONS);
  const facilities = db.collection(COLLECTIONS.FACILITIES);

  let locationAmenityRows = 0;
  let communityShopRows = 0;

  const cursor = locations.find({});
  for await (const doc of cursor) {
    if (isCommunityShopLocation(doc)) {
      communityShopRows += 1;
      continue;
    }
    const placeKind = placeKindFromLocationRow({
      activityType: String(doc.activityType ?? ''),
      tags: doc.tags ?? [],
    });
    if (isFacilityPlaceKind(placeKind as PlaceKind)) locationAmenityRows += 1;
  }

  const facilitiesCollectionCount = await facilities.countDocuments({});
  const outdoorShopFacilities = await facilities.countDocuments({ facilityKind: 'outdoor_shop' });

  return {
    locationAmenityRows,
    communityShopRows,
    facilitiesCollectionCount,
    outdoorShopFacilities,
  };
};

export const runCatalogCpcMigrations = async (db: Db): Promise<void> => {
  await ensureFacilitiesCollectionIndexes(db);
  await backfillFacilitiesFromLocations(db);
  await backfillCatalogLifecycleFields(db);
};
