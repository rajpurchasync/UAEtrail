import { ringFromBBox } from './area-resolution.js';
import { upsertAreaBySlug } from './areas-store.js';

/** Stable ids for seed data and acceptance tests (G-area). */
export const SEED_AREA_IDS = {
  hatta: 'area-seed-hatta',
  jebelJais: 'area-seed-jebel-jais',
} as const;

/** Curated UAE outdoor areas — idempotent on `npm run seed`. */
export const seedCuratedAreas = async (): Promise<void> => {
  await upsertAreaBySlug({
    id: SEED_AREA_IDS.hatta,
    slug: 'hatta',
    name: 'Hatta',
    region: 'Dubai',
    status: 'published',
    priority: 10,
    center: { latitude: 24.83, longitude: 56.09 },
    bounds: ringFromBBox(24.78, 56.0, 24.88, 56.18),
  });

  await upsertAreaBySlug({
    id: SEED_AREA_IDS.jebelJais,
    slug: 'jebel-jais',
    name: 'Jebel Jais',
    region: 'RAK',
    status: 'published',
    priority: 10,
    center: { latitude: 25.9, longitude: 56.11 },
    bounds: ringFromBBox(25.82, 56.0, 25.98, 56.22),
  });
};
