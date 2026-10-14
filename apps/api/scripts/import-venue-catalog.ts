/**
 * Upsert curated hiking/camping venues from `data/uae-outdoor-venue-catalog.json`.
 * Deactivates legacy OpenStreetMap imports by default.
 *
 *   npm --workspace @uaetrail/api run import-venue-catalog
 *   npm --workspace @uaetrail/api run import-venue-catalog -- --dry-run
 *   npm --workspace @uaetrail/api run import-venue-catalog -- --keep-osm
 */
import { LocationStatus } from '../src/domain/enums.js';
import type { Location } from '../src/domain/types.js';
import { buildLocationFromCreateInput } from '../src/lib/entity-builders.js';
import { connectMongo, disconnectMongo, getMongoClient } from '../src/lib/mongo.js';
import { locationDocForMongo } from '../src/lib/location-query.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import { isWithinUaeFocusArea } from '../src/lib/uae-bbox.js';
import {
  loadVenueCatalog,
  locationHasCatalogAdminEditedTag,
  mapCatalogEntryToLocationCreateInput,
  VENUE_CATALOG_EXTERNAL_SOURCE,
} from '../src/lib/venue-catalog.js';
import { fillMissingLocationFields } from '../src/lib/location-field-fill.js';
import { backfillSeedCatalogLocationAreaIds } from './seed-location-area-map.js';

const PRESERVE_KEYS: (keyof Location)[] = [
  'guideMarkdown',
  'guidePreview',
  'guidePdfKey',
  'gpxKey',
  'unlockPriceAed',
  'images',
  'premiumImages',
  'distance',
  'duration',
  'elevation',
  'difficulty',
  'highlights',
  'surfaceType',
  'accessibleBy',
  'parkingLink',
  'parkingLat',
  'parkingLng',
  'season',
  'childFriendly',
  'maxGroupSize',
  'accessibility',
  'campingType',
  'viewCount',
  'createdAt',
];

const mergeWithExisting = (existing: Location, next: Location): Location => {
  const merged = { ...next };
  for (const key of PRESERVE_KEYS) {
    const prev = existing[key];
    if (prev !== undefined && prev !== null && prev !== '' && !(Array.isArray(prev) && prev.length === 0)) {
      (merged as Record<string, unknown>)[key] = prev;
    }
  }
  if (existing.description && existing.description.length > 120 && !existing.tags?.includes('catalog-import')) {
    merged.description = existing.description;
  }

  if (locationHasCatalogAdminEditedTag(existing.tags)) {
    merged.name = existing.name;
    merged.region = existing.region;
    merged.latitude = existing.latitude;
    merged.longitude = existing.longitude;
    merged.description = existing.description;
    merged.featured = existing.featured;
    merged.tags = existing.tags;
  }

  return merged;
};

const importVenueCatalog = async () => {
  const dryRun = process.argv.includes('--dry-run');
  const keepOsm = process.argv.includes('--keep-osm');
  const catalog = loadVenueCatalog();

  if (!dryRun) await connectMongo();
  const collection = dryRun ? null : getMongoClient()!.db().collection('locations');

  let created = 0;
  let updated = 0;

  for (const entry of catalog.venues) {
    if (!isWithinUaeFocusArea(entry.latitude, entry.longitude)) {
      console.warn(
        `  [warn] ${entry.id} (${entry.name}) is outside UAE focus bbox — check coordinates`
      );
    }
    const seed = mapCatalogEntryToLocationCreateInput(entry);
    const built = buildLocationFromCreateInput(seed, entry.id);

    if (dryRun) {
      console.log(`  [dry-run] ${built.activityType} ${built.name} (${entry.id})`);
      continue;
    }

    const existingDoc = await collection!.findOne({ _id: entry.id });
    if (existingDoc) {
      const existing = { id: String(existingDoc._id), ...existingDoc } as Location;
      let merged = mergeWithExisting(existing, built);
      merged = fillMissingLocationFields(merged, built);
      merged.updatedAt = new Date();
      await collection!.updateOne({ _id: entry.id }, { $set: locationDocForMongo(merged) });
      updated += 1;
    } else {
      await collection!.updateOne(
        { _id: entry.id },
        { $set: locationDocForMongo(built) },
        { upsert: true }
      );
      created += 1;
    }
  }

  let osmDeactivated = 0;
  if (!dryRun) {
    await backfillSeedCatalogLocationAreaIds();
  }

  if (!keepOsm && !dryRun && collection) {
    const result = await collection.updateMany(
      { externalSource: 'osm' },
      {
        $set: {
          status: LocationStatus.INACTIVE,
          registryListed: false,
          updatedAt: new Date(),
        },
      }
    );
    osmDeactivated = result.modifiedCount;
    await invalidateExploreMapCache();
  }

  if (!dryRun) await disconnectMongo();

  console.log('');
  console.log(`Catalog venues: ${catalog.venues.length}`);
  console.log(`Created: ${created}, updated: ${updated}${dryRun ? ' (dry-run)' : ''}`);
  if (!keepOsm) {
    console.log(`OSM locations deactivated: ${osmDeactivated}${dryRun ? ' (skipped dry-run)' : ''}`);
  }
  console.log(`Source tag: externalSource=${VENUE_CATALOG_EXTERNAL_SOURCE}`);
};

importVenueCatalog().catch((error) => {
  console.error(error);
  process.exit(1);
});
