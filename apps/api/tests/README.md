# API integration test fixtures

Use **`helpers/test-seed.ts`** as the single entry for geography and catalog rows in vitest.

| Helper | Use when |
|--------|----------|
| `ensurecuratedDestinationsSeeded()` | Before tests that need published destinations in Mongo |
| `testDestinations.hatta` (etc.) | Stable `{ id, slug, name }` from `CURATED_DESTINATION_CATALOG` |
| `defaultTestDestinationId()` | Default Hatta id for locations / activities |
| `buildTestLocationSubmitBody()` | Unit tests for `locationSubmitBodySchema` (no DB) |
| `createTestLocation()` | Active catalog row with `destinationId` wired |
| `buildTestParticipantIntentInput()` | Legacy `participant_intents` ops backfill rows (legacy `areaId` field) |

Do **not** paste literal `area-seed-*` strings in test files — import `curatedDestinationSeedId` from `@uaetrail/shared-types` only in seed scripts, or use `testDestinations` here.

`helpers/fixtures.ts` calls `ensurecuratedDestinationsSeeded()` for published event fixtures.
