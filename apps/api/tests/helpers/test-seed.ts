/**
 * Integration test seed — single entry for curated areas, catalog locations, and submit bodies.
 * Prefer `testAreas.*` / `buildTestLocationSubmitBody` over literal `area-seed-*` strings.
 */
import {
  CURATED_DESTINATION_CATALOG,
  CURATED_DESTINATION_CATALOG_BY_KEY,
  CURATED_DESTINATION_SEED_IDS,
  CURATED_DESTINATION_SEED_SLUGS,
  curatedDestinationSeedId,
  type CuratedDestinationSeedKey,
} from '@uaetrail/shared-types';
import type { LocationSubmitBody } from '../../src/domain/location-submit.js';
import { ActivityType, Difficulty, LocationStatus } from '../../src/domain/enums.js';
import { createLocationRecord } from '../../src/lib/activities-store.js';
import { seedCuratedDestinations } from '../../src/lib/seed-destinations.js';

let curatedAreasSeeded = false;

/** Idempotent — upserts full curated area catalog for integration tests. */
export const ensureCuratedAreasSeeded = async (): Promise<void> => {
  if (curatedAreasSeeded) return;
  await seedCuratedDestinations();
  curatedAreasSeeded = true;
};

export { CURATED_DESTINATION_SEED_IDS, CURATED_DESTINATION_SEED_SLUGS, curatedDestinationSeedId };

/** Published test areas — ids match `ensureCuratedAreasSeeded()`. */
export const testAreas = Object.fromEntries(
  CURATED_DESTINATION_CATALOG.map((row) => [
    row.key,
    { id: row.id, slug: row.slug, name: row.name },
  ])
) as Record<CuratedDestinationSeedKey, { id: string; slug: string; name: string }>;

export const defaultTestAreaId = (): string => testAreas.hatta.id;

export const testAreaSummary = (key: CuratedDestinationSeedKey): string =>
  CURATED_DESTINATION_CATALOG_BY_KEY[key].summary;

/** Minimal valid `locationSubmitBodySchema` body for unit tests (no DB). */
type LegacyParticipantIntentSeedInput = {
  kind: 'hiking' | 'camping' | 'rideshare' | 'event' | 'other';
  title: string;
  date: string | null;
  time: string | null;
  preferredArea: string | null;
  partySize: number;
  comment: string;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: 'general' | 'specific' | null;
  areaId: string | null;
  toLatitude?: number | null;
  toLongitude?: number | null;
};

/** Legacy `participant_intents` Mongo row shape for ops backfill tests. */
export const buildTestParticipantIntentInput = (
  overrides: Partial<LegacyParticipantIntentSeedInput> = {},
  areaKey: CuratedDestinationSeedKey = 'hatta'
): LegacyParticipantIntentSeedInput => {
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
  destinationId: defaultTestAreaId(),
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

/** Catalog-style location row with `destinationId` wired to seeded areas. */
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
    destinationId: input.destinationId ?? defaultTestAreaId(),
    ...input,
  });
};
