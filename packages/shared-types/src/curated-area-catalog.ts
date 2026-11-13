/**
 * Canonical curated UAE outdoor areas — ids, slugs, map anchors, and copy for seed + tests.
 * Admin may edit live rows; re-run `seedCuratedAreas` to restore defaults.
 */
import { CURATED_AREA_SEED_IDS, type CuratedAreaSeedKey } from './curated-area-seeds.js';

export type CuratedAreaBBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type CuratedAreaCatalogEntry = {
  key: CuratedAreaSeedKey;
  id: string;
  slug: string;
  name: string;
  region: string;
  priority: number;
  center: { latitude: number; longitude: number };
  bbox: CuratedAreaBBox;
  /** Short hub / map peek blurb. */
  summary: string;
  countryCode: string;
  imageUrl?: string | null;
};

const DEFAULT_AREA_HERO =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200';

const entry = (
  key: CuratedAreaSeedKey,
  slug: string,
  name: string,
  region: string,
  priority: number,
  center: { latitude: number; longitude: number },
  bbox: CuratedAreaBBox,
  summary: string,
  imageUrl?: string | null
): CuratedAreaCatalogEntry => ({
  key,
  id: CURATED_AREA_SEED_IDS[key],
  slug,
  name,
  region,
  priority,
  center,
  bbox,
  summary,
  countryCode: 'AE',
  imageUrl: imageUrl ?? DEFAULT_AREA_HERO,
});

/** Published area registry used by `seedCuratedAreas` and integration tests. */
export const CURATED_AREA_CATALOG: readonly CuratedAreaCatalogEntry[] = [
  entry(
    'hatta',
    'hatta',
    'Hatta',
    'Dubai',
    10,
    { latitude: 24.83, longitude: 56.11 },
    { south: 24.75, west: 56.08, north: 24.9, east: 56.22 },
    'Hajar foothills — dam loops, wadi hikes, kayaking, and weekend camping a short drive from Dubai.'
  ),
  entry(
    'jebelJais',
    'jebel-jais',
    'Jebel Jais',
    'RAK',
    10,
    { latitude: 25.92, longitude: 56.14 },
    { south: 25.82, west: 56.0, north: 25.98, east: 56.28 },
    'UAE’s highest peak — summit trails, via ferrata, cool mountain air, and sunrise hikes.'
  ),
  entry(
    'wadiShawka',
    'wadi-shawka',
    'Wadi Shawka',
    'RAK',
    12,
    { latitude: 25.34, longitude: 56.12 },
    { south: 25.28, west: 56.05, north: 25.42, east: 56.22 },
    'Family-friendly wadi loops, dam views, and pool stops east of Ras Al Khaimah.'
  ),
  entry(
    'jebelHafeet',
    'jebel-hafeet',
    'Jebel Hafeet',
    'Abu Dhabi',
    12,
    { latitude: 24.06, longitude: 55.78 },
    { south: 24.0, west: 55.72, north: 24.12, east: 55.86 },
    'Iconic Al Ain mountain road — viewpoint hikes, green-mound camps, and cooler winter nights.'
  ),
  entry(
    'alQudra',
    'al-qudra',
    'Al Qudra',
    'Dubai',
    18,
    { latitude: 24.87, longitude: 55.5 },
    { south: 24.82, west: 55.38, north: 24.93, east: 55.58 },
    'Desert lakes district — cycling tracks, birding, and easy gravel rides outside the city.'
  ),
  entry(
    'loveLake',
    'love-lake',
    'Love Lake',
    'Dubai',
    5,
    { latitude: 24.861, longitude: 55.487 },
    { south: 24.852, west: 55.478, north: 24.87, east: 55.496 },
    'Heart-shaped desert lake inside Al Qudra — short walks, photos, and sunset picnics.'
  ),
  entry(
    'khorfakkan',
    'khorfakkan',
    'Khorfakkan',
    'Sharjah',
    12,
    { latitude: 25.36, longitude: 56.35 },
    { south: 25.3, west: 56.28, north: 25.42, east: 56.42 },
    'East coast mountains and beaches — snorkel bays, waterfall hikes, and corniche camps.'
  ),
  entry(
    'jumeirah',
    'jumeirah',
    'Jumeirah Coast',
    'Dubai',
    14,
    { latitude: 25.17, longitude: 55.24 },
    { south: 25.12, west: 55.18, north: 25.22, east: 55.32 },
    'Urban shoreline — Kite Beach runs, sunset walks, and community fitness meetups.'
  ),
  entry(
    'fossilRock',
    'fossil-rock',
    'Fossil Rock',
    'Sharjah',
    12,
    { latitude: 25.22, longitude: 55.86 },
    { south: 25.14, west: 55.78, north: 25.3, east: 55.94 },
    'Mleiha dune field — overnight desert camps, fossil hunting, and stargazing.'
  ),
  entry(
    'dibba',
    'dibba',
    'Dibba',
    'Fujairah',
    12,
    { latitude: 25.62, longitude: 56.27 },
    { south: 25.55, west: 56.2, north: 25.68, east: 56.34 },
    'Dibba coastline on the Gulf of Oman — beach camps, dhow views, and Hajar backdrop.'
  ),
  entry(
    'remahDunes',
    'remah-dunes',
    'Remah Dunes',
    'Abu Dhabi',
    16,
    { latitude: 24.05, longitude: 55.55 },
    { south: 23.98, west: 55.48, north: 24.12, east: 55.64 },
    'Rolling dunes south of Al Ain — quiet self-guided desert camps and sunrise photography.'
  ),
  entry(
    'kalba',
    'kalba',
    'Kalba',
    'Sharjah',
    14,
    { latitude: 25.07, longitude: 56.35 },
    { south: 25.0, west: 56.28, north: 25.14, east: 56.42 },
    'Mangrove and mountain edge — kayak routes, bird hides, and east-coast day trips.'
  ),
  entry(
    'jbr',
    'jbr',
    'JBR',
    'Dubai',
    6,
    { latitude: 25.078, longitude: 55.133 },
    { south: 25.068, west: 55.12, north: 25.09, east: 55.145 },
    'Beachfront boardwalk — community runs, sunset walks, and casual meetups by the water.'
  ),
  entry(
    'downtown',
    'downtown',
    'Downtown Dubai',
    'Dubai',
    7,
    { latitude: 25.1972, longitude: 55.2744 },
    { south: 25.185, west: 55.26, north: 25.21, east: 55.292 },
    'City core — Burj views, fitness groups, and evening strolls around the boulevard.'
  ),
  entry(
    'dubaiMarina',
    'dubai-marina',
    'Dubai Marina',
    'Dubai',
    6,
    { latitude: 25.0805, longitude: 55.1403 },
    { south: 25.065, west: 55.125, north: 25.1, east: 55.16 },
    'Marina promenade — harbour walks, running crews, and weekend coffee meetups.'
  ),
  entry(
    'warsan4',
    'warsan-4',
    'Warsan 4',
    'Dubai',
    20,
    { latitude: 25.162, longitude: 55.412 },
    { south: 25.148, west: 55.39, north: 25.178, east: 55.43 },
    'Eastern Dubai — desert-edge camps, gravel tracks, and spontaneous weekend outings.'
  ),
  entry(
    'alAin',
    'al-ain',
    'Al Ain',
    'Abu Dhabi',
    8,
    { latitude: 24.21, longitude: 55.76 },
    { south: 24.13, west: 55.64, north: 24.32, east: 55.88 },
    'Garden city foothills — Jebel Hafeet access, green belts, and cooler winter hikes.'
  ),
];

export const CURATED_AREA_CATALOG_BY_KEY: Record<CuratedAreaSeedKey, CuratedAreaCatalogEntry> =
  Object.fromEntries(CURATED_AREA_CATALOG.map((row) => [row.key, row])) as Record<
    CuratedAreaSeedKey,
    CuratedAreaCatalogEntry
  >;

export const CURATED_AREA_CATALOG_BY_SLUG: Record<string, CuratedAreaCatalogEntry> = Object.fromEntries(
  CURATED_AREA_CATALOG.map((row) => [row.slug, row])
);

export const listCuratedAreaSeedKeys = (): CuratedAreaSeedKey[] =>
  CURATED_AREA_CATALOG.map((row) => row.key);
