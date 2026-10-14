import { curatedAreaSeedId, type CuratedAreaSeedKey } from '@uaetrail/shared-types';
import type { AreaDTO } from '@uaetrail/shared-types';
import { resolveAreaIdFromPoint } from '../src/lib/area-resolution.js';
import { listPublishedAreas } from '../src/lib/areas-store.js';
import { resolveCatalogLocationAreaKey } from '../src/lib/venue-catalog-enrichment.js';

/** Explicit catalog place → curated area (overrides point-in-polygon when set). */
export const SEED_CATALOG_LOCATION_AREA_KEYS: Record<string, CuratedAreaSeedKey> = {
  'jebel-jais-summit-trail': 'jebelJais',
  'wadi-shawka-loop': 'wadiShawka',
  'fossil-rock-desert-camp': 'fossilRock',
  'dibba-beach-camp': 'dibba',
  'hatta-dam-loop': 'hatta',
  'hatta-wadi-hub-loop': 'hatta',
  'hatta-hill-park-camp': 'hatta',
  'hatta-wadi-gear-shop': 'hatta',
  'hatta-dam-services-stop': 'hatta',
  'hatta-dam-restroom': 'hatta',
  'al-ain-desert-camp': 'remahDunes',
  'al-qudra-cycling-loop': 'alQudra',
  'love-lake-walk': 'loveLake',
  'jumeirah-kite-beach': 'jumeirah',
  'khorfakkan-beach-trail': 'khorfakkan',
  'jebel-hafeet-viewpoint-hike': 'jebelHafeet',
  'kalba-mangrove-kayak': 'kalba',
  'mleiha-desert-camp': 'fossilRock',
  'al-badayer-desert-camp': 'fossilRock',
};

export const seedLocationAreaId = (locationId: string): string | null => {
  const key =
    SEED_CATALOG_LOCATION_AREA_KEYS[locationId] ?? resolveCatalogLocationAreaKey(locationId);
  return key ? curatedAreaSeedId(key) : null;
};

/** After seed upserts — fill `areaId` from explicit map or published area polygons. */
export const backfillSeedCatalogLocationAreaIds = async (): Promise<void> => {
  const areas: AreaDTO[] = await listPublishedAreas();
  const { getMongoClient } = await import('../src/lib/mongo.js');
  const { COLLECTIONS } = await import('../src/lib/collections.js');
  const collection = getMongoClient()!.db().collection(COLLECTIONS.LOCATIONS);

  const docs = await collection
    .find({ status: 'active' })
    .project({ _id: 1, latitude: 1, longitude: 1, areaId: 1 })
    .toArray();

  for (const doc of docs) {
    const id = String(doc._id);
    const explicit = seedLocationAreaId(id);
    const lat = doc.latitude as number | null | undefined;
    const lng = doc.longitude as number | null | undefined;
    const fromPoint =
      lat != null && lng != null
        ? resolveAreaIdFromPoint(lat, lng, areas, doc.areaId as string | null)
        : null;
    const areaId = explicit ?? fromPoint ?? (doc.areaId as string | null) ?? null;
    if (!areaId) continue;
    if (doc.areaId === areaId) continue;
    await collection.updateOne({ _id: doc._id }, { $set: { areaId } });
  }
};
