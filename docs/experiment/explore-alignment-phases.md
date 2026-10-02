# Explore alignment — phased plan

**Branch:** `main` (shipped Oct 2026) · **Goal:** Browse + **Organize / Demand / Add**, separate flows, API alignment — no merged wizards.

**Docs:** [`explore-backend-alignment.md`](./explore-backend-alignment.md) · [`explore-flow-registry.md`](./explore-flow-registry.md) · [`../CREATE_FLOW.md`](../CREATE_FLOW.md) · [`../ENGINEERING_PLAN.md`](../ENGINEERING_PLAN.md).

---

## Architecture snapshot (simple)

| | **Organize** | **Demand** (outdoor) | **Add** |
|--|--------------|----------------------|---------|
| Time-bound? | Yes | Yes | No (catalog) |
| Storage | `activities` | `participant_intents` | `locations`, shops |
| Map source | `activity` | `demand` | `venue`, `shop` |
| Browse tab | Activities | Activities | Places |
| Who | Host role | Any member | Member / host |
| Categories | Hiking, camping, events, rideshare, **activities** | **Same five** | Trail / spot / shop types |
| Approval | Host sets `participationMode` | Demand lifecycle | — |

**Future:** **Demand for goods or services** — separate flows (`demand.goods.*`), not the outdoor category list.

**Naming:** Tab **Activities** = Organize + Demand pins. Category **activities** = fifth outing type (runs, climbs…). In code use **`OutingCategory`**, not “Plan” or “published/seeking”. FAB may say **Find**; architecture says **Demand**.

**Hard rules:** separate flowId + lifecycle; step kits only; no unified create API.

---

## Track A — Engineering plan (shipped on `main`)

| Phase | Focus | Status |
|-------|--------|--------|
| 0–4 | Lint, detail unify, publish payload, routing → `/explore` | Done |
| 5–6 | API split, domain aliases, consumer feedback, copy guard | Done |
| 7–8 | Mobile tabs, signup profile wizard | Done |
| 9 | Explore shell hooks, become-host guard, manual smoke doc | In progress ([`PHASE9_MANUAL_SMOKE.md`](./PHASE9_MANUAL_SMOKE.md)) |

This track cleaned **how code is organized**; it did not finish **OutingCategory projection + FAB/registry + backend DTO fields**.

---

## Track B — Explore alignment (implementation order)

Phases are **sequential gates**. Later phases may start UI spikes only if they do not depend on missing API fields (noted per phase).

---

### E1 — Architecture & registry docs ✅

**Align:** Vocabulary, storage map, non‑negotiable separate flows.

| Deliverable | Status |
|-------------|--------|
| [`explore-backend-alignment.md`](./explore-backend-alignment.md) | Done |
| [`explore-flow-registry.md`](./explore-flow-registry.md) | Done |
| This phased plan | Done |

**Exit:** **Organize / Find / Add** match `compose.ts`; storage **Demand** = intent `find`; catalog IDs `organize.*`, `find.*`, `add.*`.

---

### E2 — Discovery layer (browse) — mostly done, verify & close

**Align:** Activities vs Places; same pills/filters on map + list; no activities on Places catalog.

| Work | Code / doc | Status |
|------|------------|--------|
| Tab order Activities → Places | `exploreBrowsePanelCopy.ts` | Done |
| Layer-aware pills (Activities: All/Hiking/Camping/Rideshare/Others; Places: Trails/Spots/Shops) | `exploreMapFilters.ts`, `useExploreBrowseUrlState.ts` | Done |
| List/map same filter model | `exploreMapPinModel.ts`, `useExploreBrowseList.ts` | Done |
| Unified filter chrome (desktop inline, mobile sticky) | `ExploreBrowseFilterChrome.tsx`, `ExploreFilterPillsRow.tsx` | Done |
| Colocated pin stacks + emoji badges | `exploreMapPinModel.ts` | Done |
| Get Directions (external) | `ExploreCardPresentation.tsx` | Done |
| Coach marks say “Activities” | `ExploreCoachMarks.tsx` | Done |

**Remaining (E2 close-out):**

- [ ] Remove redundant legacy filter keys in mobile panel if still duplicated (`ActivityListFilterKey` / venue filters).
- [ ] Optional: sticky map segment Places \| Activities (`view=` URL) if product wants it on map chrome.
- [ ] Run manual pass: [`E2_EXPLORE_BROWSE_SMOKE.md`](./E2_EXPLORE_BROWSE_SMOKE.md) (automated: `explore-map-layers` + `exploreMapPinModel` tests).
- [ ] Update [`explore-ux-spec.md`](./explore-ux-spec.md) checklist to match pill labels (Trails/Spots/Shops).

**Exit:** Browse URL + map + list behave identically; Places layer excludes published/seeking pins.

**Backend required:** None (uses existing `kind` + `source`).

---

### E3 — Shared contract (`ComposeIntent` + `OutingCategory`)

| Work | Owner |
|------|--------|
| Add `ComposeIntent` (`organize` \| `demand`), `OutingCategory`, optional `OutingTopic` | `packages/shared-types` |
| Explore DTO: `composeIntent`, `outingCategory`, `outingTopic`, `participationMode` (Organize only) | shared-types |
| Mappers: `activityType` / intent `kind` ↔ `OutingCategory` | shared-types or API lib |

**Exit:** Types compile; frontend may import types but filters still use `kind` until E4.

**Depends on:** E1.

---

### E4 — Backend read path (explore map projection)

**Align:** Server sends Plan projection on map items; tests lock Activities vs Places rules.

| Work | Owner |
|------|--------|
| `buildExploreMapPayload` sets `composeIntent`, `outingCategory`, `outingTopic`, `participationMode` (Organize) | `explore-map.ts` |
| Demand mapper sets same on `source: demand` | `participant-intents-store.ts` |
| Include `participationMode` on published plan items (from activity DTO) | explore-map |
| Extend `apps/api/tests/explore-map-publish.test.ts` | API tests |
| Bump explore map cache key if DTO shape changes | explore-map |

**Optional same phase:** Persist `planFamily` / `planTopic` on Mongo (see E5) — if deferred, E4 is **derive-on-read only**.

**Exit:** Cached map payload includes Plan fields; tests green.

**Depends on:** E3.

---

### E5 — Backend write path (optional persistence + per-flow validation) — v1 done

**Align:** Each flow keeps its endpoint; validation schemas split by `flowId`.

| Work | Status |
|------|--------|
| Mongo optional `outingCategory`, `outingTopic` on activities | Done — `entity-builders.ts`, host create/update Zod |
| Organize publish sends category + topic | Done — `organizeActivityPublish.ts`, `composeFlowCatalog` |
| Per-flow Zod: `organizeHikingCreateSchema`, `demandRideshareCreateSchema`, … | Open |
| Tighten `locationSubmitBodySchema` — drop carpool/legacy enums on place submit | Open |
| Registry table ↔ schema names documented | Open — `explore-flow-registry.md` |

**Exit (v1):** New organize posts store `outingCategory` / `outingTopic`; map read prefers stored fields.

**Depends on:** E3 (E4 can ship before E5 if derive-on-read is enough for browse).

---

### E6 — Frontend flow registry + FAB routing

**Align:** FAB menus match registry; compose URLs encode flowId — still separate wizards.

| Work | Owner |
|------|--------|
| `composeFlowCatalog.ts` — `organize.*`, `find.*`, `add.*` | frontend |
| FAB: Organize menu, Demand menu (UI may label Find), Add menu | `compose.ts` |
| Wire `organize.rideshare` | `organizeFlow.ts` |
| Unit tests: registry covers every menu item | `compose.test.ts` |

**Exit:** Every FAB choice maps to exactly one `flowId` and one wizard entrypoint.

**Depends on:** E1 (E5 optional for menus that only use existing activityType).

---

### E7 — Wizard completeness (separate blocks & lifecycles) ✅ (v1)

**Align:** Each flowId owns steps, draft, submit, lifecycle — step kits reused only as UI blocks.

| Flow group | Status |
|------------|--------|
| `organize.*` | Done — rideshare + activity (FLOW-05) wizards; audience step on all kinds; catalog ↔ `getCreateFlowSteps` tests |
| `demand.*` | Done — FAB-aligned `DEMAND_TYPE_OPTIONS`; `demandFlow.test.ts` |
| `place.add.*` | Done — Trails/Spots/Shops/Others labels; `contributeFlow.test.ts` |
| Fulfill demand → organize | Done — `useExploreFulfillIntent`; documented in `CREATE_FLOW` + registry |

| Cross-cutting | Status |
|---------------|--------|
| Publish payload | Done — `organizeActivityPublish.ts` + `outingCategory` / `outingTopic` |
| Per-flow Zod split | Open (E5 optional) |
| Step kit extraction | Open — no shared draft reducer (by design) |

**Exit (v1):** Every FAB item maps to a non-stub wizard; participation on audience step (rideshare locked approval).

**Depends on:** E6.

---

### E8 — Subtype browse (Activities Others / topics) ✅ (v1)

**Align:** Pills and URL `subtype` + `outingTopic` on **OutingCategory** + **OutingTopic** — not title guessing.

| Work | Status |
|------|--------|
| URL `subtype` (events vs activities) under `filter=others` | Done — `exploreBuddySubtype.ts`, `useExploreBrowseUrlState.ts` |
| URL `outingTopic` under others + activities | Done — `exploreOutingTopic.ts`, `explorePath()` |
| Pin/list filter | Done — `exploreMapPinModel.ts`, `useExploreBrowseList.ts` |
| Sub-pill rows | Done — `ExploreBuddySubtypePillsRow`, `ExploreOutingTopicPillsRow`, `ExploreBrowseFilterChrome` |

**Exit:** Others → Events/Activities → topic pills filter map + list on projected fields.

**Depends on:** E4; E5 for persisted `outingTopic` on new publishes (legacy still derives from requirements).

---

### E9 — Product & domain docs

**Align:** Main docs describe behaviour; experiment docs describe architecture.

| Doc | Updates |
|-----|---------|
| [`DOMAIN.md`](../DOMAIN.md) | Organize vs Demand vs Add; OutingCategory; Host role |
| [`CREATE_FLOW.md`](../CREATE_FLOW.md) | FAB → flow IDs; defaults vs host toggle; status table |
| [`NAVIGATION.md`](../NAVIGATION.md) | Activities/Places browse params |
| [`explore-ux-spec.md`](./explore-ux-spec.md) | Pills, emojis, CTAs vs PlanFamily |

**Exit:** New contributor reads main docs + experiment alignment without chat context.

**Depends on:** E6–E8 product-stable.

---

### E10 — QA gate & merge readiness — shipped with `main`

| Work | Status |
|------|--------|
| Gate doc + `npm run test:explore-alignment` | Done — [`E10_EXPLORE_QA_GATE.md`](./E10_EXPLORE_QA_GATE.md) |
| Manual: Phase 9 + E2 smoke | Open — QA sign-off table in E10 doc |
| Seed: outing category / topic on featured activities | Done — `seed.ts` (+ boulder `activities` / `climbing`) |
| `copyGuard` / `exploreModuleBoundary` in alignment script | Done |

**Exit:** Automated gate green + manual checklists signed on `main` (ongoing regression).

---

### E11 — Saved map / wishlist + in-app match alerts

**Align:** Google-style **save on the map**; **manage under Profile** (`/profile/wishlist`, Settings link). **In-app** notifications when new **Organize** or **Demand** pins match saved intent. Demand remains on the public map.

| Doc | [`WISHLIST_MAP_ALERTS.md`](./WISHLIST_MAP_ALERTS.md) · [`flows/FLOW-11-profile-wishlist.md`](./flows/FLOW-11-profile-wishlist.md) |
| Depends on | E4/E5 plan fields; notification plumbing |

**Exit:** Save from explore; list/remove on `/profile/wishlist`; publish/intent fan-out + in-app notify (v1).

---

## Dependency diagram

```mermaid
flowchart LR
  E1[E1 Docs] --> E2[E2 Browse]
  E1 --> E3[E3 shared-types]
  E3 --> E4[E4 explore map]
  E3 --> E5[E5 write + Zod]
  E4 --> E8[E8 subtype browse]
  E5 --> E8
  E1 --> E6[E6 FAB registry]
  E6 --> E7[E7 Wizards]
  E7 --> E9[E9 Docs]
  E8 --> E9
  E9 --> E10[E10 QA]
  E2 --> E10
```

**Parallel allowed:** E2 close-out + E3; E6 + E4 after E3; E7 after E6 without waiting for E8.

---

## What not to do (regression guard)

| Anti-pattern | Why |
|--------------|-----|
| Single wizard for Organize + Demand | Different lifecycles and endpoints |
| Rename browse tab to “Plans” | Tab stays **Activities** |
| Force approval by outing category | Host chooses on Organize |
| Outdoor goods demand in same enum as hiking | Future `demand.goods.*` separate |
| Places tab showing scheduled outings | Discovery layer split |

---

## Quick status summary (today)

| Phase | Summary |
|-------|---------|
| **E1** | Done |
| **E2** | ~95% — automated suite + smoke doc (Others drill-down); manual QA pass open |
| **E3–E4** | Done (shared plan projection + explore map read path) |
| **E5** | v1 done — `outingCategory` / `outingTopic` on host create; per-flow Zod split still optional |
| **E6** | Mostly done — FAB **Rideshare** (`organize:carpool`), catalog tests, wizard seeds from catalog |
| **E7** | Done (v1) — catalog step parity tests; fulfill demand documented |
| **E8** | Done (v1) — `subtype` + `outingTopic` URL, pills, map/list filter |
| **E9** | Mostly done — `DOMAIN`, `NAVIGATION`, `CREATE_FLOW`, registry, `explore-ux-spec` browse pills |
| **E10** | In progress — automated script + seed QA pins; manual smoke sign-off open |
| **E11** | Done (v1) — profile saved map, explore save, match notify, `?pin=` deep links |

**Recommended next work:** Run **`npm run test:explore-alignment`** in CI locally; complete **E2** + **Phase 9** manual rows in [`E10_EXPLORE_QA_GATE.md`](./E10_EXPLORE_QA_GATE.md).
