/**
 * Stable Mongo `_id`s for curated areas — used by `seedCuratedAreas`, local seed, and vitest.
 * Catalog metadata: `curated-area-catalog.ts`.
 */
export const CURATED_AREA_SEED_IDS = {
  hatta: 'area-seed-hatta',
  jebelJais: 'area-seed-jebel-jais',
  wadiShawka: 'area-seed-wadi-shawka',
  jebelHafeet: 'area-seed-jebel-hafeet',
  alQudra: 'area-seed-al-qudra',
  loveLake: 'area-seed-love-lake',
  khorfakkan: 'area-seed-khorfakkan',
  jumeirah: 'area-seed-jumeirah',
  fossilRock: 'area-seed-fossil-rock',
  dibba: 'area-seed-dibba',
  remahDunes: 'area-seed-remah-dunes',
  kalba: 'area-seed-kalba',
} as const;

export type CuratedAreaSeedKey = keyof typeof CURATED_AREA_SEED_IDS;

export const curatedAreaSeedId = (key: CuratedAreaSeedKey): string => CURATED_AREA_SEED_IDS[key];

export const CURATED_AREA_SEED_SLUGS: Record<CuratedAreaSeedKey, string> = {
  hatta: 'hatta',
  jebelJais: 'jebel-jais',
  wadiShawka: 'wadi-shawka',
  jebelHafeet: 'jebel-hafeet',
  alQudra: 'al-qudra',
  loveLake: 'love-lake',
  khorfakkan: 'khorfakkan',
  jumeirah: 'jumeirah',
  fossilRock: 'fossil-rock',
  dibba: 'dibba',
  remahDunes: 'remah-dunes',
  kalba: 'kalba',
};
