import { curatedDestinationSeedId, type CuratedDestinationSeedKey } from '@uaetrail/shared-types';
import type { DestinationDTO } from '@uaetrail/shared-types';
import { LocationStatus } from '../src/domain/enums.js';
import { resolveDestinationIdFromPoint } from '../src/lib/destination-resolution.js';
import { listPublishedDestinations } from '../src/lib/destinations-store.js';
import { resolveCatalogLocationDestinationKey } from '../src/lib/venue-catalog-enrichment.js';

/** Explicit catalog place → curated area (overrides point-in-polygon when set). */
export const SEED_CATALOG_LOCATION_AREA_KEYS: Record<string, CuratedDestinationSeedKey> = {
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
  'stairway-to-heaven-rak': 'jebelJais',
  'wadi-ghallila-loop': 'wadiShawka',
  'mleiha-fossil-rock-hike': 'fossilRock',
  'wadi-wurayah-lower-trail': 'khorfakkan',
  'nad-al-sheba-sand-dune-hike': 'alQudra',
  'al-rabi-khorfakkan-trail': 'khorfakkan',
  'jebel-jais-zipline-plateau-walk': 'jebelJais',
  'lehbab-platinum-dunes-walk': 'fossilRock',
  'sir-baniyas-salt-dome-walk': 'jebelHafeet',
  'liwa-dunes-overnight': 'remahDunes',
  'wadi-shawka-dam-camp': 'wadiShawka',
  'lehbab-red-dunes-camp': 'alQudra',
  'fujairah-sandy-beach-camp': 'dibba',
  'kalba-creek-camp': 'kalba',
  'jebel-jais-base-camp': 'jebelJais',
  'rak-beach-camp': 'jebelJais',
};

export const seedLocationDestinationId = (locationId: string): string | null => {
  const key =
    SEED_CATALOG_LOCATION_AREA_KEYS[locationId] ?? resolveCatalogLocationDestinationKey(locationId);
  return key ? curatedDestinationSeedId(key) : null;
};

/** After seed upserts — fill `destinationId` from explicit map or published destination polygons. */
export const backfillSeedCatalogLocationDestinationIds = async (): Promise<void> => {
  const areas: DestinationDTO[] = await listPublishedDestinations();
  const { getMongoClient } = await import('../src/lib/mongo.js');
  const { COLLECTIONS } = await import('../src/lib/collections.js');
  const collection = getMongoClient()!.db().collection(COLLECTIONS.LOCATIONS);

  const docs = await collection
    .find({ status: { $in: [LocationStatus.ACTIVE, 'active', 'ACTIVE'] } })
    .project({ _id: 1, latitude: 1, longitude: 1, destinationId: 1 })
    .toArray();

  for (const doc of docs) {
    const id = String(doc._id);
    const explicit = seedLocationDestinationId(id);
    const lat = doc.latitude as number | null | undefined;
    const lng = doc.longitude as number | null | undefined;
    const fromPoint =
      lat != null && lng != null
        ? resolveDestinationIdFromPoint(lat, lng, areas, doc.destinationId as string | null)
        : null;
    const destinationId = explicit ?? fromPoint ?? (doc.destinationId as string | null) ?? null;
    if (!destinationId) continue;
    if (doc.destinationId === destinationId) continue;
    await collection.updateOne({ _id: doc._id }, { $set: { destinationId } });
  }
};
