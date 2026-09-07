# Explore Map — Detailed Implementation Plan

**Branch:** `experiment/new-ui`  
**Remote:** `purchasync/UAEtrail` (`git push purchasync experiment/new-ui`)  
**Not in scope for:** `uaetrail/main` until explicit merge approval  
**Companion doc:** [explore-ux-spec.md](./explore-ux-spec.md)  
**Last updated:** 2026-09-07

---

## 1. Purpose

This plan implements the mobile **map-first explore experience** for UAE Trail:

- **Supply side:** hosts publish hiking, camping, events, carpools; venues, shops, tour agencies appear as static listings.
- **Demand side:** participants post public “I want to go” intents; others join; a participant can convert to host.
- **Social:** auto messaging group per published activity/demand; members added on join approval.
- **Payments:** indication only (Free/Paid/Shared) — offline settlement, no checkout.

Work is **sequential by phase**. Do not skip Phase P0 (alignment layer).

---

## 2. Locked product decisions

| ID | Decision |
|----|----------|
| D1 | No pay links — labels only + “Payment arranged directly with the host.” |
| D2 | Carpool = **separate activity type** (`CARPOOL` / `'carpool'`), not `carPoolEnabled` on hiking |
| D3 | Carpool map shows **from and to** locations (two pins; polyline optional) |
| D4 | Optional `linkedActivityId` on carpool for future hike/camp link (UI deferred) |
| D5 | Simpler mobile create — ≤5 steps per type; advanced fields under “More options” |
| D6 | Sign-up/host: **Individual** (`GUIDE_OWNED`) or **Business** (`COMPANY`) via `/become-host` |
| D7 | Business chooses **Shop** or **Tour agency** (`tenant.businessMode`) |
| D8 | Demand posts **public by default** |
| D9 | Others **Join this plan** on demand posts |
| D10 | **Host this trip** converts demand → prefilled activity publish |
| D11 | Anyone can host after **Become a Host** approved; gate on publish not browse |
| D12 | **Auto group** on activity/demand publish; add members on join approve |

---

## 3. Current baseline (experiment branch)

### Built

| Area | Files |
|------|-------|
| Mobile map home | `src/components/explore/MobileExploreExperience.tsx` |
| Map + clustering | `src/components/ui/LocationsMap.tsx` |
| Emoji pins | `src/utils/mapPinEmoji.ts` |
| Explore API | `apps/api/src/lib/explore-map.ts`, `GET /api/v1/explore/map` |
| Mobile create (4-step) | `MobileCreateActivityFlow.tsx`, `mobileCreateFlow.ts` |
| Join request | `JoinRequestModal.tsx` |
| Become a Host | `src/pages/BecomeHost.tsx` |
| Map config | `src/config/platform.ts` |

### Gaps

- Generic bottom sheet copy (not type-specific)
- No Free/Paid badges on map sheet
- Carpool = hiking + `carPoolEnabled` hack in `mobileCreateFlow.ts`
- No `carpool` in ActivityType enum
- No demand posts, no activity-linked groups
- No tour agencies on explore map
- Join modal still framed for paid checkout flow

---

## 4. Target architecture

### 4.1 Frontend layers

```
ExploreMapItemDTO (API)
        ↓
exploreCardModel.ts   ← normalize to view model
        ↓
exploreCopy.ts        ← headline, badge, emoji, CTAs
        ↓
ExploreItemSheet.tsx  ← map tap + list tap
ExploreListRow.tsx    ← list only
LocationsMap.tsx      ← pins (incl. carpool dual pins)
```

**Rule:** Components must not hardcode visitor copy. Import from `exploreCopy`.

### 4.2 Data model additions

#### Activity (extend)

```ts
// API enum: ActivityType.CARPOOL = 'CARPOOL'
// Shared: ActivityType includes 'carpool'

carPoolFromLabel, carPoolFromLat, carPoolFromLng
carPoolToLabel, carPoolToLat, carPoolToLng
carPoolSeats, carPoolFree, carPoolPriceAed
linkedActivityId?: string | null   // future

// Legacy read-compat: carPoolEnabled → treat as carpool kind
```

#### ExploreMapItemDTO (extend)

```ts
source: 'activity' | 'venue' | 'shop' | 'agency' | 'demand'
kind: ActivityType | 'shop' | 'carpool'

priceLabel?: 'free' | 'paid' | 'shared'
priceDisplay?: string | null
fromLabel?, toLabel?, toLatitude?, toLongitude?
groupId?: string | null
demandMemberCount?: number
```

#### participant_intents (new collection)

```ts
userId, kind, title, preferredDate, preferredTime?
latitude, longitude, visibility: 'public'
status: 'open' | 'closed' | 'converted'
convertedActivityId?, groupId, memberIds[], expiresAt
```

#### activity_groups (new collection)

```ts
activityId?, demandId?, name, hostId, memberIds[], createdAt
```

#### Tenant (extend)

```ts
businessMode?: 'shop' | 'agency' | null   // COMPANY only
agencyLatitude?, agencyLongitude?
```

### 4.3 API routes

| Method | Route | Phase |
|--------|-------|-------|
| GET | `/explore/map` | Extend each phase |
| GET | `/me/host-status` | P3 |
| POST | `/me/intents` | P5 |
| POST | `/me/intents/:id/join` | P5 |
| POST | `/me/intents/:id/convert` | P5 |
| POST | `/host/activities` (carpool fields) | P2 |
| Publish hooks → create group | P6 |

---

## 5. Phased implementation (sequential)

Execute **one phase at a time**. Update **Phase status** (§8) when complete.

---

### PHASE P0 — Alignment foundation

**Goal:** Copy/model layer before feature UI. No schema changes.

| ID | Task | Files | Done when |
|----|------|-------|-----------|
| P0-1 | UX spec in repo | `docs/experiment/explore-ux-spec.md` | ✅ Exists |
| P0-2 | `exploreCardModel.ts` | `src/explore/` | DTO → view model |
| P0-3 | `exploreCopy.ts` | `src/explore/` | All headline/badge functions |
| P0-4 | `explorePriceLabel.ts` | `src/explore/` | free/paid/shared logic |
| P0-5 | Delegate `mapPinEmoji.ts` → exploreCopy | `src/utils/mapPinEmoji.ts` | No duplicate maps |
| P0-6 | Vitest tests for copy matrix | `src/explore/*.test.ts` | CI green |

**Gate:** Tests pass → start P1.

---

### PHASE P1 — Supply sheet & list alignment

**Goal:** Type-specific copy, price labels, shared sheet. No new DB types.

| ID | Task | Files |
|----|------|-------|
| P1-1 | `ExploreItemSheet.tsx` | `src/components/explore/` |
| P1-2 | `ExploreListRow.tsx` | same |
| P1-3 | Wire map sheet | `MobileExploreExperience.tsx` |
| P1-4 | Wire list rows | same |
| P1-5 | Price badge + offline note | ExploreItemSheet |
| P1-6 | Venue Spot labels | exploreCopy |
| P1-7 | Event “hosting” headline | exploreCopy |
| P1-8 | Shop sheet | exploreCopy |
| P1-9 | Soften JoinRequestModal paid UX | `JoinRequestModal.tsx` |
| P1-10 | API `priceLabel` / `priceDisplay` | `explore-map.ts`, shared-types |

**Gate:** QA each seed pin type against UX spec checklist.

---

### PHASE P2 — Carpool as first-class type

| ID | Task | Files |
|----|------|-------|
| P2-1 | `CARPOOL` enum + shared `'carpool'` | enums, shared-types, activity-type.ts |
| P2-2 | From/to fields on Activity | types, entity-builders |
| P2-3 | Mongo migration legacy docs | mongo-migrations.ts |
| P2-4 | Host create API validation | routes/host.ts |
| P2-5 | Explore map carpool + to coords | explore-map.ts |
| P2-6 | Dual map markers | LocationsMap.tsx |
| P2-7 | Polyline from→to (optional) | LocationsMap.tsx |
| P2-8 | Carpool headline | exploreCopy |
| P2-9 | Filter `kind === 'carpool'` | MobileExploreExperience |
| P2-10 | Rename Rideshare → Carpool in UI | create flow, pills |

**Gate:** API create carpool; two pins; sheet shows from → to.

---

### PHASE P3 — Simpler mobile create + host gate

| ID | Task | Files |
|----|------|-------|
| P3-1 | `GET /me/host-status` | routes/user.ts |
| P3-2 | `useHostGate()` hook | `src/hooks/` |
| P3-3 | Per-type create flows | MobileCreateActivityFlow |
| P3-4 | Hiking/Camp: Where→When→Spots→Price→Publish | mobileCreateFlow |
| P3-5 | Event: Title→Where→When→Spots→Price→Publish | same |
| P3-6 | Carpool: From→To→When→Seats→Price→Publish | same |
| P3-7 | “More options” drawer | same |
| P3-8 | Redirect to `/become-host` if not approved | create flow |
| P3-9 | Remove rideshare→hiking hack | mobileCreateFlow.ts |
| P3-10 | Price toggle display-only | mobileCreateFlow |

**Gate:** Host publishes in ≤5 taps; non-host blocked at publish.

---

### PHASE P4 — Tour agency & business mode

| ID | Task | Files |
|----|------|-------|
| P4-1 | `tenant.businessMode` | tenant-store, types |
| P4-2 | Become Host: Shop or Agency | BecomeHost.tsx |
| P4-3 | Agency coords | BecomeHost / settings |
| P4-4 | Shop → existing merchant path | shop-store |
| P4-5 | Explore `source: agency` | explore-map.ts |
| P4-6 | Agency sheet | ExploreItemSheet |
| P4-7 | Agency emoji 🏢 | exploreCopy |

---

### PHASE P5 — Demand posts (public)

| ID | Task | Files |
|----|------|-------|
| P5-1 | `participant_intents` + indexes | mongo-indexes |
| P5-2 | CRUD + join API | routes/user.ts, store |
| P5-3 | Demand on explore map | explore-map.ts |
| P5-4 | Demand copy 🙋 | exploreCopy |
| P5-5 | `MobileCreateDemandFlow.tsx` | new component |
| P5-6 | FAB: Host / I want to go | MobileExploreExperience |
| P5-7 | Filter pill “Looking” | MobileExploreExperience |
| P5-8 | Join this plan | ExploreItemSheet + API |
| P5-9 | Host this trip convert | API + create prefill |
| P5-10 | Link convertedActivityId | API |

---

### PHASE P6 — Auto messaging groups

| ID | Task | Files |
|----|------|-------|
| P6-1 | `activity_groups` collection | mongo-indexes |
| P6-2 | `activity-groups-store.ts` | new |
| P6-3 | Hook publish activity | activities-store |
| P6-4 | Hook create demand | P5 store |
| P6-5 | Add member on join approve | activity-engagement-store |
| P6-6 | Add member on demand join | P5 |
| P6-7 | `groupId` on DTOs | mappers, explore-map |
| P6-8 | Open group chat CTA | ExploreItemSheet |
| P6-9 | Group type activity/demand | social-groups-store |

---

### PHASE P7 — Deferred

| ID | Task |
|----|------|
| P7-1 | Carpool ↔ hike/camp link UI |
| P7-2 | Map search |
| P7-3 | MapTiler English tiles (env) |
| P7-4 | PWA / Capacitor full-screen |
| P7-5 | Demand expiry cron |

---

## 6. Execution order (strict)

```
P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7
```

**Do not start P2 before P0–P1 complete** (carpool UI would be rewritten).  
**Do not start P5 before P3** (convert needs host gate).  
**Do not start P6 before P5** (shared group infra).

---

## 7. Git workflow

```bash
git checkout experiment/new-ui
git pull purchasync experiment/new-ui

# After each phase
git commit -m "feat(explore): Phase Pn — summary"
git push purchasync experiment/new-ui
```

Do **not** push to `origin/main` without approval.

Suggested tags: `experiment/explore-p0`, `experiment/explore-p1`, …

---

## 8. Phase status

| Phase | Status | Completed | Notes |
|-------|--------|-----------|-------|
| P0 | Complete | 2026-09-07 | exploreCopy, exploreCardModel, explorePriceLabel, tests |
| P1 | Complete | 2026-09-07 | Shared sheet/list, API price fields, JoinRequestModal offline UX |
| P2 | Complete | 2026-09-07 | CARPOOL type, dual pins, from→to sheet, migration |
| P3 | Complete | 2026-09-07 | Host gate, per-type ≤5-step create, price labels, more options |
| P4 | Not started | — | |
| P5 | Not started | — | |
| P6 | Not started | — | |
| P7 | Deferred | — | |

_Update this table as work progresses._

---

## 9. Context from prior experiment work (already on branch)

These were implemented before this plan and should be preserved:

- Mobile map-first home (`MobileExploreExperience`)
- Dubai default zoom, emoji pins, marker clustering
- Esri street + English reference tiles
- Explore map API with activities, venues, shops
- Mobile 4-step create wizard (to be simplified in P3)
- Activity date bump script: `npm --workspace @uaetrail/api run bump-activity-dates`

---

## 10. References

- UX copy & checklist: [explore-ux-spec.md](./explore-ux-spec.md)
- Index: [README.md](./README.md)
- Become a Host: `src/pages/BecomeHost.tsx`
- Join flow: `src/components/ui/JoinRequestModal.tsx`
- Explore API: `apps/api/src/lib/explore-map.ts`
