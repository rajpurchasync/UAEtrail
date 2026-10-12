# System refactor plan — discovery, domains, surfaces

**Status:** In progress — **R1–R6 core shipped**; **R4 read-path exit** guarded; **R5 vNext** behind flags; **R8** client layer ongoing (see phase status §4)  
**Prerequisite read:** [`system-structure-deep-audit.md`](./system-structure-deep-audit.md) (§1–§15)  
**Baseline:** Local `main` — `ExploreExperience.tsx` ~895 LOC · `explore-map.ts` ~596 LOC · `ActivityDetailView.tsx` ~776 LOC  
**Gate for every phase:** `npm run verify:system:quick` minimum; phase close → `npm run verify:system`  
**Tier-1 touch:** update [`SYSTEM_COHERENCE.md`](../SYSTEM_COHERENCE.md) §7 rows **C17–C20** when a phase closes — not new audit markdown.

---

## 1. Executive summary

The product **domain model is sound** for a high-engagement outdoor social app (Area → Place → Activity, Host capabilities, Participation, Chat, Goals, Relationships). The **implementation drift** is in three places:

1. **Discovery** — one cached map blob + **four client projections** (`exploreCardModel`, list poster enrich, peek engagement, detail presentation).
2. **Orchestration** — `ExploreExperience` owns map, list, discover browse, people panel, compose, and host sheets in one file.
3. **Seeking** — runtime is **M2d** (activities-only write); **read paths** still branch on intent ids, demand pins, and `exploreMapItemIsSeeking` across ~80+ files.

This plan **does not** rewrite Mongo, split micro-frontends, or add a Programme entity until product commits. It **does** sequence refactors so each PR strengthens **one bounded context** and removes parallel logic.

---

## 2. Deep audit — findings (code-backed)

### 2.1 Severity matrix

| ID | Finding | Evidence | User impact | Scale impact |
|----|---------|----------|-------------|--------------|
| **F-D1** | Fat map read model | `buildExploreMapPayload` caps ~250 activities / ~1200 locations; items embed full `ActivityDTO` | Slow mobile parse; stale join counts | Redis stampede on cold cache |
| **F-D2** | Four discovery projections | `buildExploreCardModel` → `buildListFeedCards` → `enrichListFeedCard`; peek uses `activityPeekEngagement`; detail uses `buildActivityPresentationForDetail` / `resolveActivityDetailWirePresentation` | Same outing feels different on map vs list vs detail | Every CTA change touches 3+ modules |
| **F-D3** | God explore orchestrator | `ExploreExperience.tsx` ~895 LOC | Hard to ship browse vs map features safely | Merge conflicts, regression risk |
| **F-D4** | Seeking read branches | `exploreMapItemIsSeeking`, `participantIntentId` on `ExploreCardModel`, intent join aliases | Wrong join target if id drifts | Test matrix explosion |
| **F-D5** | Place detail duplication | `TrailDetail`, `CampDetail`, venue routes — C4 | Inconsistent tabs/SEO loading | Duplicate fixes per kind |
| **F-D6** | Detail view weight | `ActivityDetailView.tsx` ~776 LOC | Tabs/footers hard to evolve | Coupled to host sheets |
| **F-D7** | Map vs detail policy inputs | `explore-map-viewer-access.ts` builds engagement input separately from `build-activity-presentation.ts` | Subtle peek/detail mismatch | Support burden |
| **F-D8** | Programme absent | No `programmes` collection | N/A until product | Future campaign work blocked |
| **F-D9** | Pull-only freshness | `invalidateExploreMapCache()` only | “Who’s going” lags | Engagement loop weak |
| **F-D10** | Browse ≠ separate API | Discover browse / `/list` / search client-side on map pool | Correct at UAE scale | Breaks at directory-scale search |

### 2.2 What is already healthy (do not refactor away)

| Area | Why leave it |
|------|----------------|
| `collections.ts` manifest | Single storage vocabulary |
| `member-host-status.ts` | One host tier resolver |
| `composeActivityViewerAccess` + L1 `resolveActivityEngagementPolicy` | Right auth + engagement split |
| `activity_requests` / `activity_participants` | Clear participation states |
| `GET /me/coordination-attention` | Plan “Attentions” read model |
| Chat: inbox UI + dual transport | Documented; merge storage only with product decision |
| `executeActivityMapPeekAction` | Single peek action executor (keep; extend to card VM) |
| M2d write path | `isParticipantIntentStubWriteEnabled()` default **false** — writes seeking **activities** |

### 2.3 Your surfaces → refactor tracks

| Surface | Primary debt IDs | Phases |
|---------|------------------|--------|
| **Explore** (map, `list=1`, peek) | F-D1, F-D2, F-D3, F-D7, F-D9 | R1, R2, R4, R5 |
| **Browse** (`browse=1`, `/list`, search) | F-D2, F-D10 | R1, R5 (spec) |
| **My Plans** | Low — wire to coordination attention | R4 (join invalidation helps attentions indirectly) |
| **Chat** | Intentional dual transport | Out of scope unless outbox needed |
| **Profile** | C1/C2 naming only | S4–S5 parallel |
| **Entity detail** | F-D5, F-D6, F-D7 | R1 (wire), R3 |
| **Area / Place / Operator** | C4, map projection in `explore-map.ts` | R3, R4 |

---

## 3. Target architecture (end state)

```mermaid
flowchart TB
  subgraph api_read [API read models]
    MAP["ExploreMapDocumentV2\n(base cache)"]
    ENR["Per-viewer enrich\n(mapPeekActions, strips)"]
    DET["ActivityDetailViewV1\nper id + viewer"]
    CARD["DiscoveryCardProjection\nslim — optional on map items"]
  end

  subgraph fe [Frontend]
    VM["discoveryCardViewModel.ts\nsingle FE adapter"]
    SHELL["ExploreShell\nmap | browse | people"]
    PEEK["Peek / row / poster\n=density prop"]
    DETUI["ActivityDetailView\nthin — tabs from wire"]
  end

  MAP --> ENR
  ENR --> VM
  CARD --> VM
  DET --> DETUI
  VM --> PEEK
  SHELL --> VM
```

**Rules after refactor:**

- **No new business rules** in React for join/host/peek — L1 policy + wire only (L3).
- **ExploreCardModel** becomes a **deprecated alias** of `DiscoveryCardViewModel` or a thin re-export.
- **ExploreExperience** only composes shells; **< 250 LOC**.
- **Seeking** map identity = **`activity:{id}`** only; intent id is manage/storage legacy.
- **Place** pages share **`PlaceDetailCore`**; routes unchanged for SEO.

---

## 4. Refactor phases (ordered)

Phases are **sequential within each track**; **R1** and **R3** can run in parallel by different owners.

### R0 — Baseline & guards (1–2 days)

| Work | Detail |
|------|--------|
| Snapshot metrics | LOC on `ExploreExperience`, `explore-map.ts`, count of `buildExploreCardModel` call sites |
| Acceptance tests | Extend `activityDetailAcceptance.test.ts` with **RF-01**: “no new `switch` on join id in list feed actions” (grep guard) |
| Manifest | Add `discovery` projection files to `bounded-context-manifest.json` when R1 adds modules |

**Exit:** CI green; metrics table in this doc §10 updated.

---

### R1 — Discovery card unification (2–3 weeks, discovery context)

**Maps to:** C17 · F-D2 · F-D7  
**Bounded context:** `discovery` (+ shared-types)

| Step | Deliverable | Key files |
|------|-------------|-----------|
| R1.1 | **`DiscoveryCardProjection`** type in `packages/shared-types` (slim: title, meta, chips, image, `wireActions`, `entityRef`) | `discovery-card-projection.ts` |
| R1.2 | API builder **`buildDiscoveryCardFromMapItem(item, viewerEnrich)`** used by map enrich OR documented as FE-only phase-1 | `apps/api/src/lib/discovery-card-projection.ts` |
| R1.3 | FE **`buildDiscoveryCardViewModel(item, user)`** — replaces direct `buildExploreCardModel` in peek, `list=1` row, poster | `src/discovery/discoveryCardViewModel.ts` |
| R1.4 | **`buildEngagementPolicyInputFromMapItem`** shared helper (API) — single bag for map + detail parity tests | `activity-engagement-policy-input.ts` |
| R1.5 | Migrate consumers incrementally: `ExploreItemPeekParts`, `ExploreListRow`, `ListFeedPosterCard`, `ExploreBrowsePanel` | delete duplicate meta in `listPosterPresentation` where redundant |
| R1.6 | Tests: matrix test **RF-02** — same `ExploreMapItemDTO` fixture → same primary CTA across peek, row, poster |

**Do not:** Change `GET /explore/map` payload shape in R1.1 (additive fields OK with version comment).

**Exit:** `npm run test:explore-alignment` + new `discovery-card-projection.test.ts` (API + FE).

**Status (Oct 2026):** R1.1–R1.3 shipped — shared-types + API projection, `discoveryCardViewModel`, list/map row builders; `discoveryCardViewModel.test.ts` (RF-02). R1.5 — peek, list feed, map row, browse rails, `listPosterPresentation` / `listVenuePoster` tests on VM; `exploreCopy.test.ts` still targets `buildExploreCardModel` internals. R1.6 — RF-02 matrix in `discoveryCardViewModel.test.ts` (activity, poster, row, venue). Host/pricing — paid outings gated on `hostTiers.business` + publish-as agency/shop/partner (`activity-pricing.ts`).

---

### R2 — Explore shell decomposition (2 weeks, discovery FE)

**Maps to:** C18 · F-D3  
**Bounded context:** `discovery`

| Extract | Responsibility | New module (suggested) |
|---------|----------------|------------------------|
| `ExploreMapShell` | Map viewport, pins, selection, peek host | `src/explore/shell/ExploreMapShell.tsx` |
| `ExploreBrowseChrome` | URL state, filters, taxonomy pills | `src/explore/shell/ExploreBrowseChrome.tsx` |
| `ExplorePeoplePanelHost` | `view=people` panel only | `src/explore/shell/ExplorePeoplePanelHost.tsx` |
| `ExploreComposePortal` | FAB / compose query handling | `src/explore/shell/ExploreComposePortal.tsx` |
| `ExploreExperience` | Compose children, providers (`ListFeedActionsProvider` for map list) | shrink to wiring |

**Exit:** `ExploreExperience.tsx` **< 280 LOC** (~100 LOC wiring); `memberSurfacesAcceptance` / explore routing tests green; no behavior change (screenshot/manual QA map + browse=1 + list=1).

**Status (Oct 2026):** `useExploreExperienceModel`, `ExploreMapShell`, `ExploreExperienceBrowsePanels`, `ExploreExperienceOverlays` shipped; R2 exit LOC met on `ExploreExperience.tsx`.

---

### R3 — Place detail core (2–3 weeks, places context)

**Maps to:** C4 · F-D5  
**Bounded context:** `places`

| Step | Deliverable |
|------|-------------|
| R3.1 | `PlaceDetailCore` — load location, tabs, reviews, map block, viewer access |
| R3.2 | `TrailDetail` / `CampDetail` / venue page → thin wrappers (SEO title, canonical kind) |
| R3.3 | One test suite `place-detail-core.test.tsx` |

**Exit:** S6 row in SYSTEM_COHERENCE can move to “in progress”; `verify:system` green.

**Status (Oct 2026):** R3.1 shipped — `usePlaceDetailPage` (fetch), `PlaceDetailCore`, thin `PlaceDetailPage`; `placeDetailCore.test.ts`. R3.2 — `TrailDetail` / `CampDetail` / `EventDetail` thin wrappers on `PlaceDetailPage`. R3.3 — `placeDetailCore.test.ts` covers wrappers + hook ownership. Components shim `usePlaceDetailCore.ts` re-exports hook (R8.1 baseline −1).

---

### R4 — Seeking read-path retirement (2 weeks, compose + discovery)

**Maps to:** F-D4  
**Bounded context:** `compose`, `participation`, `discovery`

M2d already makes **activities** the write root. R4 removes **read** ambiguity:

| Step | Deliverable |
|------|-------------|
| R4.1 | Map build: stop emitting legacy `source: demand` items except migration window — feature flag `EXPLORE_MAP_DEMAND_PINS=0` |
| R4.2 | FE: `exploreMapItemSharePath` / pin selection — **activity id only** for seeking |
| R4.3 | Remove `participantIntentId` from `ExploreCardModel` / Discovery VM when unused on wire |
| R4.4 | API tests: `participant-intent-*` keep manage routes; map projection tests assert no demand-only pin when flag off |
| R4.5 | Docs: `CREATE_FLOW.md` one paragraph — Find creates seeking **activity** |

**Exit:** Grep `pin=demand:` only in redirects/tests; `explore-map-seeking-projection.test.ts` updated.

**Status (Oct 2026):** **Exit criteria met** for product read paths — activity-primary pins, `exploreMapPinResolve`, `seekingPinHygieneGuard`, `CREATE_FLOW` § Find, API seeking projection tests, demand pins off by default. Legacy `demand:` id parsing remains in `explore/routing.ts` + notification rewrite (6‑month compat per §6 risk register).

---

### R5 — Map read model evolution (3–6 weeks, discovery API — **design + optional slice**)

**Maps to:** C19 · F-D1 · F-D9 · F-D10  
**Bounded context:** `discovery`

| Step | Deliverable |
|------|-------------|
| R5.1 | **Spec** `docs/experiment/explore-map-vnext-spec.md` — bbox query, slim card DTO, cursor, cache keys per region |
| R5.2 | Refactor `explore-map.ts` → `explore-map-base.ts` (cacheable) + `explore-map-enrich.ts` (already partly `explore-map-viewer-access.ts`) |
| R5.3 | **Slice (optional):** `GET /explore/map?bbox=` behind flag — returns subset + same enrich |
| R5.4 | **Freshness:** on join approve, patch viewer’s enriched slice OR invalidate + `react-query` `setQueryData` optimistic join count |

**Exit:** Load test note (p95 payload); no regression on default `GET /explore/map` without bbox.

**Status (Oct 2026):** R5.1 shipped — [`explore-map-vnext-spec.md`](./explore-map-vnext-spec.md). R5.2 shipped — `explore-map-base.ts` + cache shell in `explore-map.ts` (wire-identical `GET /explore/map`). R5.3 shipped — `GET /explore/map?bbox=` (+ optional `cursor`, `limit`, `area`) behind `EXPLORE_MAP_VNEXT=1`; `explore-map-route.ts` + tests. R5.4 shipped — `VITE_EXPLORE_MAP_VNEXT` + scoped React Query keys, viewport bbox refetch on `/explore`, cache helpers (`exploreMapQuery.ts`); list browse keeps full fetch.

---

### R6 — Activity detail slimming (1–2 weeks, participation + discovery)

**Maps to:** F-D6 · F-D7  
**Bounded context:** activity detail (cross-cut)

| Step | Deliverable |
|------|-------------|
| R6.1 | Move tab panel bodies to `src/components/activity/detail/tabs/*` (already started) |
| R6.2 | `ActivityDetailView` — layout + tab state only; footers from `resolveActivityDetailWirePresentation` exclusively |
| R6.3 | Host sheets stay in `useHostActivitySheetBundle` — no second manage path |

**Exit:** `ActivityDetailView.tsx` **< 400 LOC**; activity detail acceptance tests green.

**Status (Oct 2026):** R6.1–R6.2 — `useActivityDetailViewModel`, `ActivityDetailBody`, join/pricing sidebar; `ActivityDetailView` shell-only (~170 LOC).

---

### R7 — Programme (product gate — **spec only**)

**Maps to:** F-D8

Deliverable: 1-page spec in experiment folder — aggregate fields, URL pattern, relation to activities — **no code** until PM approves. Prevents polluting `activities` with campaign flags.

**Status (Oct 2026):** Shipped — [`programme-aggregate-spec.md`](./programme-aggregate-spec.md).

---

### R8 — Client data layer (ongoing, cross-cut)

**Maps to:** S4 · F-D9

| Step | Deliverable |
|------|-------------|
| R8.1 | ESLint: no `apiRequest` / `api.` in `src/components/**` (except allowlist pages) |
| R8.2 | Standard keys: `['explore','map']`, `['activity', id]`, `['coordination-attention']` |
| R8.3 | Mutations: `joinActivity` invalidates activity + patches map query |

Runs in parallel with R1–R2; do not block R1.

**Status (Oct 2026):** R8.1 **done** — `componentsApiGuard` baseline **0** for `api.*` and **`api/client` imports** in `src/components/**`; fetch via `src/hooks/*ClientApi` + `accountSessionApi` / `lib/clientErrorReporting` for session + client error reporting. R8.2 — `clientQueryKeys.ts` (`coordination-attention`, `activity`, `reviews`, re-export `exploreMapQueryKey*`). R8.3 — `afterActivityJoinClientRefresh` in `JoinRequestModal` (single path for map + coordination + activity invalidation); `useMemberCoordinationAttention` on React Query. Pro naming — `ProProfileApplicationFlow` / `proProfileApplicationForm` (legacy `BecomeHost*` shims + `/become-host` redirect only). R5 ops — vNext promotion checklist in `EXPLORE_MAP_RUNBOOK.md`.

---

## 5. PR slicing rules (anti-regression)

1. **One bounded context per PR** when possible (manifest row in PR description).
2. **Remove list** — if adding `discoveryCardViewModel`, migrate **one** consumer and delete old branch in same PR.
3. **No** new `isHostRole` / role matrices in FE.
4. **Activity engagement** changes → update L1 tests in `shared-types`.
5. **User-facing route changes** → `NAVIGATION.md` + `routingCatalog.ts` in same PR.
6. Feature flags for map breaking changes (`EXPLORE_MAP_*`).

---

## 6. Risk register

| Risk | Mitigation |
|------|------------|
| R1 big-bang migration | One surface per PR (peek → row → poster) |
| R2 shell split breaks URL state | No changes to `useExploreBrowseUrlState` contract in R2.0 |
| R4 breaks old shared demand links | Keep redirect `pin=demand:` → resolve activity id server-side or client resolver 6 months |
| R5 bbox duplicates cache logic | Single builder function; two cache keys only after load test |
| Programme scope creep | R7 spec-only gate |

---

## 7. Success metrics

| Metric | Now (~) | After R1+R2 | After R4+R5 |
|--------|---------|-------------|-------------|
| `ExploreExperience` LOC | 895 | < 280 | < 280 |
| Card builder entry points | 3+ | 1 VM | 1 VM |
| `exploreMapItemIsSeeking` FE branches | many | fewer | minimal |
| Map payload | full region | full region | bbox optional |
| Time-to-visible join count after RSVP | TTL-bound | patched query | < 5s target |

---

## 8. Suggested timeline (single team)

| Month | Focus |
|-------|--------|
| M1 | R0, R1 (peek + row), R8.1 |
| M2 | R1 (poster), R2, R4.1–R4.2 |
| M3 | R3, R4 complete, R6 |
| M4 | R5 spec + optional bbox slice; R7 spec |

Adjust if **S7b** activity-detail polish still active — **do not** duplicate engagement policy work; R1.4 feeds both.

---

## 9. Relationship to other plans

| Doc | Relationship |
|-----|----------------|
| [`activity-detail-tabs-implementation-plan.md`](./activity-detail-tabs-implementation-plan.md) | **Complete** for CTAs; R6 is **structure** only |
| [`member-surfaces-implementation-plan.md`](./member-surfaces-implementation-plan.md) | Plan hub — consume R4 seeking clarity |
| [`HOST_CLEANUP_ROADMAP.md`](../HOST_CLEANUP_ROADMAP.md) | Parallel C1–C2; no conflict |
| [`system-structure-deep-audit.md`](./system-structure-deep-audit.md) | Evidence; this doc is **execution** |

---

## 10. Metrics changelog

| Date | ExploreExperience | explore-map.ts | ActivityDetailView |
|------|-------------------|----------------|-------------------|
| 2026-10-12 | 895 | 596 | 776 |
| 2026-10-12 R1 start | peek via `buildDiscoveryCardViewModel` | — | — |
| 2026-10-12 R1.1 | `list=1` rows + `buildListFeedCards` poster path | — | — |
| 2026-10-12 R1.4 | `activity-engagement-policy-input.ts` map + detail L1 bag | — | — |
| 2026-10-12 R2 start | `ExploreExperience` ~589 LOC — `src/explore/shell/*` | — | — |

---

## 11. Changelog

| Date | Note |
|------|------|
| 2026-10-12 | Initial plan from deep audit + domain lens |
