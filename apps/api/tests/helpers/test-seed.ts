/**
 * Integration test seed — single entry for curated areas, catalog locations, and submit bodies.
 * Prefer `testAreas.*` / `buildTestLocationSubmitBody` over literal `area-seed-*` strings.
 */
import {
  CURATED_AREA_CATALOG,
  CURATED_AREA_CATALOG_BY_KEY,
  CURATED_AREA_SEED_IDS,
  CURATED_AREA_SEED_SLUGS,
  curatedAreaSeedId,
  type CuratedAreaSeedKey,
} from '@uaetrail/shared-types';
import type { CreateParticipantIntentInput } from '../../src/domain/participant-intent.js';
import type { LocationSubmitBody } from '../../src/domain/location-submit.js';
import { ActivityType, Difficulty, LocationStatus } from '../../src/domain/enums.js';
import { createLocationRecord } from '../../src/lib/activities-store.js';
import { seedCuratedAreas } from '../../src/lib/seed-areas.js';

let curatedAreasSeeded = false;

/** Idempotent — upserts full curated area catalog for integration tests. */
export const ensureCuratedAreasSeeded = async (): Promise<void> => {
  if (curatedAreasSeeded) return;
  await seedCuratedAreas();
  curatedAreasSeeded = true;
};

export { CURATED_AREA_SEED_IDS, CURATED_AREA_SEED_SLUGS, curatedAreaSeedId };

/** Published test areas — ids match `ensureCuratedAreasSeeded()`. */
export const testAreas = Object.fromEntries(
  CURATED_AREA_CATALOG.map((row) => [
    row.key,
    { id: row.id, slug: row.slug, name: row.name },
  ])
) as Record<CuratedAreaSeedKey, { id: string; slug: string; name: string }>;

export const defaultTestAreaId = (): string => testAreas.hatta.id;

export const testAreaSummary = (key: CuratedAreaSeedKey): string =>
  CURATED_AREA_CATALOG_BY_KEY[key].summary;

/** Minimal valid `locationSubmitBodySchema` body for unit tests (no DB). */
/** Valid Find / `createParticipantIntent` body — defaults to Hatta + map pin. */
export const buildTestParticipantIntentInput = (
  overrides: Partial<CreateParticipantIntentInput> = {},
  areaKey: CuratedAreaSeedKey = 'hatta'
): CreateParticipantIntentInput => {
  const area = testAreas[areaKey];
  return {
    kind: 'hiking',
    title: `Find crew ${area.slug} test`,
    date: '2026-12-20',
    time: '07:00',
    preferredArea: area.name,
    partySize: 2,
    comment: 'Integration test seeking post with enough characters.',
    latitude: 24.86,
    longitude: 56.13,
    locationPrecision: 'specific',
    areaId: area.id,
    ...overrides,
  };
};

export const buildTestLocationSubmitBody = (
  overrides: Partial<LocationSubmitBody> = {}
): LocationSubmitBody => ({
  name: 'Test trail',
  countryCode: 'AE',
  region: 'Dubai',
  areaId: defaultTestAreaId(),
  activityType: 'hiking',
  description: 'Integration test trail with enough characters for schema validation.',
  images: ['/media/test.jpg', '/media/test-2.jpg'],
  surfaceType: [],
  highlights: [],
  tags: [],
  accessibleBy: [],
  premiumImages: [],
  ...overrides,
});

type TestLocationInput = Parameters<typeof createLocationRecord>[0];

/** Catalog-style location row with `areaId` wired to seeded areas. */
export const createTestLocation = async (
  input: TestLocationInput & { name: string }
): Promise<Awaited<ReturnType<typeof createLocationRecord>>> => {
  await ensureCuratedAreasSeeded();
  return createLocationRecord({
    region: 'Dubai',
    countryCode: 'AE',
    activityType: ActivityType.HIKING,
    description: input.description ?? 'Test catalog location',
    difficulty: Difficulty.EASY,
    season: ['year-round'],
    images: input.images ?? ['https://example.com/test.jpg'],
    highlights: [],
    surfaceType: [],
    tags: [],
    accessibleBy: [],
    status: LocationStatus.ACTIVE,
    areaId: input.areaId ?? defaultTestAreaId(),
    ...input,
  });
};
