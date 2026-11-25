import {
  CURATED_AREA_CATALOG,
  CURATED_AREA_SEED_IDS,
} from '@uaetrail/shared-types';
import { ringFromBBox } from './destination-resolution.js';
import { upsertDestinationBySlug } from './destinations-store.js';

/** @deprecated Prefer `CURATED_AREA_SEED_IDS` from `@uaetrail/shared-types` — same values. */
export const SEED_DESTINATION_IDS = CURATED_AREA_SEED_IDS;

/** Curated UAE destinations — idempotent on `npm run seed`. */
export const seedCuratedDestinations = async (): Promise<void> => {
  for (const row of CURATED_AREA_CATALOG) {
    await upsertDestinationBySlug({
      id: row.id,
      slug: row.slug,
      name: row.name,
      region: row.region,
      status: 'published',
      priority: row.priority,
      center: row.center,
      bounds: ringFromBBox(row.bbox.south, row.bbox.west, row.bbox.north, row.bbox.east),
      summary: row.summary,
      countryCode: row.countryCode,
      imageUrl: row.imageUrl ?? null,
    });
  }
};
