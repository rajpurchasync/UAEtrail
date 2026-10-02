# E10 — Explore alignment QA gate (`main`)

Use for regression checks on `main` after explore/demand shipped (Oct 2026).

## Automated gate (CI parity)

From repo root:

```bash
npm run test:explore-alignment
```

This runs:

| Area | Tests |
|------|--------|
| Module boundaries | `src/explore/exploreModuleBoundary.test.ts` |
| Consumer copy guard | `src/content/copyGuard.test.ts` |
| FAB catalog ↔ wizards | `composeFlowCatalog`, `organizeFlow`, `demandFlow`, `contributeFlow` |
| Browse filters | `exploreBuddySubtype`, `exploreOutingTopic`, `exploreRouting` |
| API map + plan projection | `explore-map-layers`, `explore-map-publish`, `explore-plan-projection`, `wishlist-match` |

Full monorepo CI: `npm run ci`.

## Manual smoke (required)

| Checklist | Doc |
|-----------|-----|
| Signup profile → explore location prompt | [`PHASE9_MANUAL_SMOKE.md`](./PHASE9_MANUAL_SMOKE.md) |
| Activities vs Places browse + Others drill-down | [`E2_EXPLORE_BROWSE_SMOKE.md`](./E2_EXPLORE_BROWSE_SMOKE.md) |
| Saved map + match notification (optional v1) | [`flows/FLOW-11-profile-wishlist.md`](./flows/FLOW-11-profile-wishlist.md) |
| Organize FAB flows (registry skip, carpool, reorganize) | [`E11_ORGANIZE_FLOWS_SMOKE.md`](./E11_ORGANIZE_FLOWS_SMOKE.md) |

**Preconditions:** `npm run dev:local` (or `dev:all`) + `npm run seed` on a fresh DB if map pins look stale.

**Seed QA pins:** After reseed, map should include published rows per **outing category** (`hiking`, `camping`, `events`, `rideshare`, `activities` + sample `outingTopic`) and active **demand** intents — see `apps/api/scripts/seed.ts` (featured events + `participant_intents` block).

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Engineering | | | `test:explore-alignment` green |
| Product / QA | | | E2 + Phase 9 manual pass |

Mark **E10** complete in [`explore-alignment-phases.md`](./explore-alignment-phases.md) when both automated and manual rows are signed.
