# API integration test fixtures

Use **`helpers/test-seed.ts`** as the single entry for geography and catalog rows in vitest.

| Helper | Use when |
|--------|----------|
| `ensureCuratedAreasSeeded()` | Before tests that need published areas in Mongo |
| `testAreas.hatta` (etc.) | Stable `{ id, slug, name }` from `CURATED_AREA_CATALOG` |
| `defaultTestAreaId()` | Default Hatta id for locations / activities |
| `buildTestLocationSubmitBody()` | Unit tests for `locationSubmitBodySchema` (no DB) |
| `createTestLocation()` | Active catalog row with `areaId` wired |
| `buildTestParticipantIntentInput()` | Find / `createParticipantIntent` bodies with map pin + `areaId` |

Do **not** paste literal `area-seed-*` strings in test files — import `curatedAreaSeedId` from `@uaetrail/shared-types` only in seed scripts, or use `testAreas` here.

`helpers/fixtures.ts` calls `ensureCuratedAreasSeeded()` for published event fixtures.
