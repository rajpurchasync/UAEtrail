# Cleanup audit (2026-09-24)

Tooling: `npm run knip` (root + `apps/api` workspace). This pass removed confirmed dead files and tightened API route modules; larger extractions are tracked below.

## Frontend — removed (zero importers)

| Path | Notes |
|------|--------|
| `src/config/exploreUaeRegions.ts` | Superseded by `src/config/regions.ts` |
| `src/utils/shopPricing.ts` | Unused helper |
| `src/utils/userCityMapCenter.ts` | Unused (map center uses explore hooks / prefs) |
| `src/components/home/HomeHeroLiveProof.tsx` + `home/index.ts` | Never wired in `Home.tsx` |
| `src/components/layout/ListBrowseLayout.tsx` | Unused layout experiment |
| `src/components/mobile/AppSectionHeader.tsx` | Unused |
| `src/components/mobile/AppSnapRail.tsx` | Unused |
| `src/components/mobile/MobileAgeRangeSlider.tsx` | Unused |
| `src/components/mobile/MobileConsumerTabHeader.tsx` | Replaced by `MobileUnifiedTabHeader` |
| `src/components/mobile/MobileTabHeaderSlot.tsx` | Header slot removed from Layout |
| `src/components/mobile/MobileTabTitleBar.tsx` | Unused |
| `src/components/profile/ProfileUpNextSection.tsx` | Profile hub uses inline sections |
| `src/components/account/AccountActivityPreview.tsx` | Deprecated duplicate |
| `src/explore/ui/ExploreHeader.tsx` | Null stub; header in Layout |

## Frontend — API client (unified surface)

| Layer | Role |
|-------|------|
| `src/api/client.ts` | `apiRequest`, auth, refresh |
| `src/api/domains/*.ts` | One module per area; owns HTTP paths |
| `src/api/services.ts` | Single `api` object (spread domains + domain aliases) |
| `src/api/public.ts` | Place/activity fetch helpers for pages |
| `src/api/index.ts` | **Preferred import** for new code |

Legacy method names (`getPublicLocations`, `getHostTeam`, …) remain on `api` until call sites migrate; see `docs/DOMAIN_ADOPTION_PLAN.md`. Do not add new duplicate wrappers outside `domains/*` + `services.ts` aliases.

## Backend — coherence changes (this pass)

- `apps/api/src/lib/host-display-details.ts` — shared host public metadata parsing (was duplicated in `user.ts`).
- `apps/api/src/routes/user/registerHostApplicationRoutes.ts` — `/me/host-details`, `/me/host-application` (removed mid-file imports from `user.ts`).
- `apps/api/src/routes/user/registerPublicPlaceRoutes.ts` — `/explore/map`, public `/locations/*` (premium, list, view).
- `apps/api/src/routes/user/registerPublicActivityRoutes.ts` — public `/activities` browse, detail, join, RSVP.
- `apps/api/src/routes/user/registerMeEngagementRoutes.ts` — `/me/requests`, `/me/activities`, group chat, push, host-status, user search.

Route map unchanged: `routes/index.ts` mounts `user`, `host`, `admin`, `shop`, `social`, `chat`, `media`, `auth`.

## Backend — still monolithic (next extractions)

`apps/api/src/routes/user.ts` (~400 lines) still owns public tenant profile, rewards catalog, public member profiles, account deletion, `/me/locations` submit, participant intents.

## Intentionally kept (not stale)

- **Deprecated re-exports** in `PlacesMap`, `platform.ts`, `shared-types` — URL/API stability
- **`src/api/services.domain-aliases.test.ts`** — guards alias facade
- **Organisation vs Host naming** — domain adoption in progress
- **Knip “unused exports”** on copy constants, SEO schemas, host console — used for docs/codegen or future UI; trim only when product confirms

## Verify after cleanup

```bash
npm run typecheck
npm run typecheck:api
npm run test:frontend
npm run test:api
npm run knip
```

**API tests:** If nothing listens on `127.0.0.1:27017`, Vitest starts **in-memory MongoDB** automatically (`tests/global-setup.ts`). Force local Docker/mongo with `API_TEST_USE_LOCAL_MONGO=1`, or set `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/uaetrail_test`.

## Git / workspace hygiene

Many paths appear twice in `git status` (`src/foo` vs `src\foo`) on Windows — same files, not duplicates. Stage with `git add -A` from repo root when committing.
