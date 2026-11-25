# API integration test fixtures

Use **`helpers/test-seed.ts`** as the single entry for geography and catalog rows in vitest.

| Helper | Use when |
|--------|----------|
| `ensurecuratedDestinationsSeeded()` | Before tests that need published areas in Mongo |
| `testAreas.hatta` (etc.) | Stable `{ id, slug, name }` from `CURATED_DESTINATION_CATALOG` |
| `defaultTestAreaId()` | Default Hatta id for locations / activities |
| `buildTestLocationSubmitBody()` | Unit tests for `locationSubmitBodySchema` (no DB) |
| `createTestLocation()` | Active catalog row with `destinationId` wired |
| `buildTestParticipantIntentInput()` | Find / `createParticipantIntent` bodies with map pin + `areaId` |

Do **not** paste literal `area-seed-*` strings in test files — import `curatedDestinationSeedId` from `@uaetrail/shared-types` only in seed scripts, or use `testAreas` here.

`helpers/fixtures.ts` calls `ensurecuratedDestinationsSeeded()` for published event fixtures.
