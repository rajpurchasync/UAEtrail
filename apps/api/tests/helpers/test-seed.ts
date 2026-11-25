/**
 * Integration test seed — single entry for curated destinations, catalog locations, and submit bodies.
 * Prefer `testDestinations.*` / `buildTestLocationSubmitBody` over literal `area-seed-*` strings.
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

let curatedDestinationsSeeded = false;

/** Idempotent — upserts full curated destination catalog for integration tests. */
export const ensurecuratedDestinationsSeeded = async (): Promise<void> => {
  if (curatedDestinationsSeeded) return;
  await seedCuratedDestinations();
  curatedDestinationsSeeded = true;
};

export { CURATED_DESTINATION_SEED_IDS, CURATED_DESTINATION_SEED_SLUGS, curatedDestinationSeedId };

/** Published test destinations — ids match `ensurecuratedDestinationsSeeded()`. */
export const testDestinations = Object.fromEntries(
  CURATED_DESTINATION_CATALOG.map((row) => [
    row.key,
    { id: row.id, slug: row.slug, name: row.name },
  ])
) as Record<CuratedDestinationSeedKey, { id: string; slug: string; name: string }>;

export const defaultTestDestinationId = (): string => testDestinations.hatta.id;

export const testDestinationSummary = (key: CuratedDestinationSeedKey): string =>
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
  /** Legacy Mongo field on retired `participant_intents` rows (maps to availability `destinationId`). */
  areaId: string | null;
  toLatitude?: number | null;
  toLongitude?: number | null;
};

/** Legacy `participant_intents` Mongo row shape for ops backfill tests. */
export const buildTestParticipantIntentInput = (
  overrides: Partial<LegacyParticipantIntentSeedInput> = {},
  destinationKey: CuratedDestinationSeedKey = 'hatta'
): LegacyParticipantIntentSeedInput => {
  const destination = testDestinations[destinationKey];
  return {
    kind: 'hiking',
    title: `Find crew ${destination.slug} test`,
    date: '2026-12-20',
    time: '07:00',
    preferredArea: destination.name,
    partySize: 2,
    comment: 'Integration test seeking post with enough characters.',
    latitude: 24.86,
    longitude: 56.13,
    locationPrecision: 'specific',
    areaId: destination.id,
    ...overrides,
  };
};

export const buildTestLocationSubmitBody = (
  overrides: Partial<LocationSubmitBody> = {}
): LocationSubmitBody => ({
  name: 'Test trail',
  countryCode: 'AE',
  region: 'Dubai',
  destinationId: defaultTestDestinationId(),
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

/** Catalog-style location row with `destinationId` wired to seeded destinations. */
export const createTestLocation = async (
  input: TestLocationInput & { name: string }
): Promise<Awaited<ReturnType<typeof createLocationRecord>>> => {
  await ensurecuratedDestinationsSeeded();
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
    destinationId: input.destinationId ?? defaultTestDestinationId(),
    ...input,
  });
};