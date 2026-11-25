import {
  CURATED_AREA_CATALOG,
  CURATED_AREA_SEED_IDS,
} from '@uaetrail/shared-types';
import { ringFromBBox } from './destination-resolution.js';
import { upsertAreaBySlug } from './areas-store.js';

/** @deprecated Prefer `CURATED_AREA_SEED_IDS` from `@uaetrail/shared-types` — same values. */
export const SEED_AREA_IDS = CURATED_AREA_SEED_IDS;

/** Curated UAE outdoor areas — idempotent on `npm run seed`. */
export const seedCuratedAreas = async (): Promise<void> => {
  for (const row of CURATED_AREA_CATALOG) {
    await upsertAreaBySlug({
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
