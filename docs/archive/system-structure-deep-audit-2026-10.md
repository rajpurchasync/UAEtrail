# Deep system design audit — storage, API, frontend, engagement model

**Status:** Expert review (repo-level), not a documentation alignment pass.  
**Baseline:** Local `main` @ `0f294bc` (33 commits ahead of `origin/main` @ `0e1bc26`).  
**Method:** Code paths in `apps/api`, `packages/shared-types`, `src/` — cross-checked with `SYSTEM_COHERENCE` §3, not replaced by it.

**Shallow companion (superseded for architecture decisions):** [`system-structure-unification-audit.md`](./system-structure-unification-audit.md) — file counts and F1–F7 only; read **this doc** for model correctness.

---

## 1. Executive judgment (is the architecture “right”?)

**For a complex, high-engagement outdoor social product in UAE/GCC at current scale:** the **domain model is directionally correct** but the **runtime architecture is a monolith optimized for product iteration**, with two structural bets that will dominate your future:

1. **Single global explore read model** (`GET /explore/map` → one cached payload, client-side filter).
2. **Fat unified DTO** (`ExploreMapItemDTO` embedding `ActivityDTO`, places, shops, demand, presentation fields).

Those bets are **reasonable for MVP / regional density** and **problematic for real-time social density** (live rosters, “friends going” freshness, hyperlocal map) without a **second-generation read path**.

**Verdict table**

| Dimension | Grade | Summary |
|-----------|-------|---------|
| Domain & storage model | **B+** | Clear aggregates; known dual-write tax (seeking); legacy collections handled |
| API authorization model | **A−** | Layered `viewerAccess` + L1 engagement policy is the right complexity |
| Read vs write separation | **C+** | Explore map is a materialized blob; detail is per-entity compose — inconsistent philosophy |
| Frontend architecture | **C** | Feature-rich but orchestration-heavy; partial React Query; no module boundaries in code |
| Engagement / social coherence | **B** | Graph + crew chat + join flows exist; no unified “activity timeline” or live layer |
| Operability at 10× scale | **D+** | Full-map rebuild + full-client download + cache stampede risk |

**Bottom line:** You do **not** need to throw away Mongo or the monorepo. You **do** need to stop adding **fourth presentation adapters** on the client and **second map read models** on the server without an explicit migration plan.

---

## 2. Canonical data flow (what the system actually does)

### 2.1 Write path (truth)

```
User action (join, publish, approve, chat, follow)
  → Express registrar (thin)
  → service OR *-store (activity-engagement-store, join-request, activity-invites-store, …)
  → Mongo collection(s) from collections.ts
  → side effects: notifications, group roster, invalidateExploreMapCache()
```

**Observation:** Writes are **mostly coherent per bounded context** (see manifest). Weak spot: **seeking** touches `participant_intents`, `activities` (activityMode seeking), locations, and map projection (`createSeekingActivityForIntent` — M1 dual-write).

### 2.2 Read path A — Explore (discovery)

```
GET /explore/map
  → buildExploreMapPayload()
       → Redis key explore:map:payload:v2 OR memory (60s)
       → else buildExploreMapPayloadUncached():
            - up to 250 published activities
            - up to 1200 locations
            - 250 shop tenants + merchant profiles + areas lens
            → ExploreMapItemDTO[] (often embeds full ActivityDTO)
  → enrichExploreMapPayloadViewerAccess() per request
       → batch participant/request/staff/buddy/invite context
       → mapPeekActions + mapPeekStrips per item (L1 helpers)
  → FE: useExploreMap() — ONE react-query key, entire items[]
  → FE: filter/pin/project in ExploreExperience, list, peek (client CPU)
```

**This is a materialized document store**, not a query API. Personalization happens **after** the shared blob (viewer enrich), which is clever for cache hit rate but means:

- **Guest and member share the same heavy base** (good).
- **Every member still downloads the full regional inventory** (bad at growth).
- **Freshness is TTL-bound** (60s Redis + invalidation), not event-driven (no map deltas).

### 2.3 Read path B — Activity detail (participation)

```
GET /activities/:id
  → load activity + participants + previews
  → composeActivityViewerAccess() (social layers + entitlements)
  → parallel: myRequest, myParticipation, join invite, pending invite count
  → buildActivityPresentationForDetail() → L1 policy → presentation envelope
  → optional linked rideshare/parent fetches
  → redacted / full / private branches
```

**This is the correct shape** for authorization-heavy detail: **compose per viewer per entity**. It should remain the pattern for **any** “can I see crew / meeting / roster?” surface.

**Incoherence:** Map uses **precomputed wire** on items; detail uses **presentation envelope**. L1 policy now unifies rules, but **two projection pipelines** remain (acceptable if documented; risky if teams extend only one).

---

## 3. Domain model — deep critique

### 3.1 What is well-designed

| Decision | Why it fits engagement |
|----------|------------------------|
| **Activity** as core scheduled aggregate with join mode, requirements, crew chat | Matches “plan → join → go together” |
| **activity_requests** + **activity_participants** | Approval vs RSVP without duplicating “trip” entity |
| **activity_invites** (Join me) | Host-driven social loop on top of requests |
| **social_groups** per activity crew | Chat wall aligned to outing lifecycle |
| **Layered viewer access** (`composeActivityViewerAccess`) | Pro vs host vs guest without role-matrix UI |
| **L1 `resolveActivityEngagementPolicy`** | Single place for “what can this viewer do?” intents |
| **Tenant / host_capabilities** separate from UserRole | Avoids conflating platform staff with host tier |

### 3.2 Structural taxes (not bugs — architectural choices)

| Tax | Evidence | Cost |
|-----|----------|------|
| **M1 seeking dual-write** | `createSeekingActivityForIntent` mirrors intent → published seeking activity | Every map/join/demand feature touches **two roots**; tests multiply |
| **ExploreMapItemDTO god DTO** | `index.ts` ExploreMapItemDTO: activity, shop, demand, locationCard, linked rides, deprecated fields | FE **must** branch on `source`/`kind`; any new pin type inflates union |
| **Embedded ActivityDTO on map** | Map items carry full activity documents | Payload size + accidental mutation assumptions on client |
| **Place route proliferation** | Trail/Camp/Venue pages + PlaceDetailPage (C4) | SEO/history debt, not data model debt |
| **Shop = tenant + merchant_profile** | Documented split (C6) | Two-write consistency on manage save |

### 3.3 What a “cleaner” engagement model would add (you do not have yet)

For **high engagement** products, teams often add:

- **Activity lifecycle events** (published, join_requested, approved, roster_changed) → fan-out to notifications, map partial updates, plan hub — you have **notifications** but not a **unified event stream** in code.
- **Per-user discovery index** (friends going, followed hosts) — you approximate via **batch enrich** on map load, not incremental index.
- **Real-time channel** for map/crew (WebSocket/SSE beyond chat) — chat exists; **map does not subscribe**.

None of these are mandatory for launch quality; they **are** mandatory if “live map social proof” is a primary loop.

---

## 4. Backend — expert lens

### 4.1 Strengths

- **Registrar modularization** (`register*` files) — scalable team ownership.
- **`collections.ts` single source** — reduces storage sprawl.
- **explore-map-viewer-access** batches DB reads for enrich — avoids N+1 per pin on map request.
- **Invalidation** centralized (`invalidateExploreMapCache`) — coarse but **keeps map from lying** after writes.
- **shared-types** as contract — FE/API alignment is real (385+ import sites), not cosmetic.

### 4.2 Failure modes at scale

| Risk | Mechanism | Symptom |
|------|-----------|---------|
| **Cache stampede** | Single Redis key rebuilds full map | Latency spike on cold cache after deploy or mass invalidation |
| **Memory pressure** | `viewerEnrichedByKey` Map per viewer generation | API RAM grows with concurrent distinct viewers |
| **Payload ceiling** | 250 activities + 1200 locations + shops in one JSON | Mobile parse time, react re-render cost on `items` change |
| **Stale social proof** | 60s TTL + invalidate-only | “3 joining” lags after join until refetch |
| **Seeking edge cases** | Intent vs activity id on wire | Wrong handler if `source`/`activityMode` drift |

### 4.3 API naming — symptom not disease

Many `registerMe*` / `registerHost*` files reflect **capability-based HTTP surface**, not duplicate storage. The **disease** is **multiple projection functions** (`buildExploreCardPresentation`, `buildExploreMapPlanProjection`, mappers, FE `exploreCardModel`) without a single **named read model per surface**.

**Recommendation:** Introduce explicit **read model types** in shared-types (even if built in one API module):

- `ExploreMapDocumentV2` (current payload)
- `ActivityDetailViewV1` (detail + presentation)
- `DiscoveryCardProjection` (slim card for list/peek — **no full ActivityDTO**)

---

## 5. Frontend — expert lens

### 5.1 Architectural style today

| Pattern | Where | Assessment |
|---------|-------|--------------|
| **Route-level pages** | `src/pages` (~74) | Normal for SPA |
| **Feature folders** | `explore/`, `list/`, `activity/` | Good intent; **weak enforcement** |
| **God orchestrator** | `ExploreExperience.tsx` (~900 LOC), hooks wired in parallel | **High coupling** — browse, compose, people, host sheets, map viewport |
| **React Query** | `useExploreMap`, some plan/chat hooks | **Partial** — most features use ad-hoc `useEffect` + `api.*` |
| **URL as state** | `useExploreBrowseUrlState`, list routing | **Good** for shareable IA; spreads logic |
| **Auth** | `AuthContext` only (no server components) | Fine for Vite SPA |

### 5.2 Why it *feels* fragmented

The FE is not missing a `Button` component. It has **three discovery renderers** (map peek, compact row, 4:5 poster) × **four meta builders** (explore card, list poster, peek strips, detail hero) × **two action executors** (now unified for wire ids — recent win).

That is **presentation fragmentation**, which reads as “no design system” because **the same outing looks like four different products**.

### 5.3 What “good” would look like (without rewriting the app)

1. **`DiscoveryModule`** (logical, not necessarily a folder rename):  
   - Input: `ExploreMapItemDTO` + viewer join state  
   - Output: `DiscoveryCardViewModel` (single struct for title, meta, chips, wire actions, image)  
   - Surfaces: peek / row / poster consume **density** prop only  

2. **`ExploreShell`** splits `ExploreExperience`:  
   - `ExploreMapShell` (map + selection)  
   - `ExploreBrowseChrome` (URL sync)  
   - `ExploreComposePortal` (FAB)  
   Wired by composition at `ExploreExperience` **< 200 LOC**  

3. **React Query policy**:  
   - Entity keys: `['activity', id]`, `['explore','map']`, `['member','host-status']`  
   - Mutations invalidate **scoped** keys, not only full map  

4. **Ban** new `api.get*` calls inside leaf components — only in hooks/domains (lint rule).

---

## 6. UI/UX architecture (system, not pixels)

| Loop | System support | Gap |
|------|----------------|-----|
| Discover plan | Map + list + peek | Coherent IA; **inconsistent card grammar** |
| Join / approve | Detail + requests API | Strong |
| Crew chat | Group per activity | Strong; **not surfaced on map freshness** |
| Find people | People panel + discovery roster | **Separate data path** from map (intentional; hard to discover) |
| Host publish | Compose wizards + gates | Complex but centralized in explore compose |
| Return / Plan hub | `/plan`, calendar, wishlist | **Third navigation paradigm** vs explore URL state |
| Pro social depth | Entitlements on wire | Good backend; **FE must not re-derive** |

**High-engagement gap:** There is no **single in-app “pulse”** (what changed for me since last visit) — notifications exist, but architecture is **pull-based** (reload map, open plan).

---

## 7. Is consolidation worse than today?

| Proposal | Verdict |
|----------|---------|
| One mega `components/` | **Worse** |
| Micro-frontends per surface | **Worse** at your team size |
| **Slim discovery projection** + keep detail fat | **Better** |
| **Tile/bbox map API** alongside current map (phase 2) | **Better** at scale |
| **Event outbox** for roster/join → map patch | **Better** for engagement freshness |
| Delete `participant_intents` in favor of seeking activities only | **Better long-term**, **expensive** migration |

---

## 8. Recommended program (architecture, not doc)

| Phase | Name | Deliverable | Success metric |
|-------|------|-------------|----------------|
| **D1** | Read model names | `DiscoveryCardViewModel` + API builder from `ExploreMapItemDTO` | One builder test matrix; poster/peek/row diff only in CSS |
| **D2** | Explore shell split | `ExploreExperience` decomposed | File < 250 LOC; same E2E routes |
| **D3** | Map API bbox design | bbox or cursor pagination **spec** + load test | p95 payload < 500KB mobile |
| **D4** | Seeking single root | Plan to retire intent-only map ids | Reduced `exploreMapItemIsSeeking` branches |
| **D5** | Query layer policy | ESLint + migrate hot paths | No `api` in `.tsx` except pages/hooks |
| **D6** | Engagement freshness | Join/approve → targeted cache patch or shorter TTL for activities | Join count updates < 5s perceived |

Engagement policy work (L1, executor) was **necessary**; it does **not** replace D1–D3.

---

## 9. What we should not do

- Judge architecture by markdown checkbox alignment.
- Merge `explore` and `list` folders without merging **product IA**.
- Add more fields to `ExploreMapItemDTO` without version bump.
- Build a component library before **card view model** exists.

---

## 10. Changelog

| Date | Author | Note |
|------|--------|------|
| 2026-10-12 | Deep pass | Repo code review; local baseline 0f294bc |
| 2026-10-12 | Domain lens | §11–§15 — user taxonomy vs storage/API/FE surfaces |

---

## 11. Your domain taxonomy — where it lives (and whether it is clean)

Legend: **Align** = one write path + named read model for the job · **Split** = correct product split but multiple code paths · **Gap** = product concept missing or only in docs · **Debt** = works but fights scale or engagement.

| Your concept | Canonical in repo | Storage | Primary API | Frontend home | Verdict |
|--------------|-------------------|---------|-------------|---------------|---------|
| **Area** | Curated regional hub | `areas`; rollups via `locations.areaId`, `participant_intents.areaId`; activities tie via `activity.locationId → place.areaId` | `GET /areas/:slug`, `explore-map-area-lens.ts`, area section on public area routes | `/area/:slug`, `AreaDetailPage`, Find/Organize area pickers | **Align** — geography is modeled without duplicating activity rows |
| **Place** | Single `locations` row, many **kinds** | `locations` + `PlaceKind` (`hiking`, `camping`, `shop`, facilities, …) | `/places`, place registry, contribute | `/trail`, `/camp`, `/venue`, `PlaceDetailPage` (C4 merge target) | **Split** — one collection, **four+ route families**; map uses `source: venue` with mixed `kind` |
| **Activity** | Scheduled outing | `activities` | `GET /activities/:id`, `POST /host/activities`, join `POST /activities/:id/requests` | `/activity/:id`, peek/detail, Plan upcoming | **Align** — core aggregate is clean |
| **Host** | **User** who may publish (organize or find) | No `hosts` table — `auth_users` + auto **community** `tenants` + `GET /me/host-status` | `member-host-status.ts`, publish gates | Organize FAB, host sheets, `/host/*` for tenant ops | **Align** — host is capability, not entity (matches your definition) |
| **Operator** | Shop owner, agency, pro guide | `tenants` + `merchant_profiles` (shops); wire **organisation** | `/guide`, `/agency`, `/partner`, `/shop`; map excludes agency pins | Storefront pages; area hub `#operators` rail; browse **Agencies** taxonomy | **Align** if you use **operator = Pro storefront** — code says **never** “operator” in new UI (`/operator` redirect). Agencies/pro **not on map** — **by design** |
| **Chat** | DM + social groups + activity crew | `chat_messages` (1:1); `social_groups` + `social_group_wall` (groups/crew) | `/chat/*`, `/me/groups/.../wall`, SSE stream | `/chat` (`MESSAGES_PATH`), `src/messaging` → `@/chat` | **Split** — **two transports**, one inbox UI (documented in `COMMUNICATION.md`) — scalable if you do not merge storage casually |
| **Participation** | Request → confirm → attend | `activity_requests` (pending/waitlist); `activity_participants` (confirmed, check-in) | Join routes; host `GET/PATCH /host/requests` | Detail join, Plan manage, explore peek actions | **Align** — clear state machine |
| **Programme** | Multi-activity / multi-org initiative | **No collection** — “campaigns” in `DOMAIN.md` / partner future | None | None | **Gap** — do not model in `activities` flags; needs `programmes` or `campaigns` aggregate when you ship |
| **Relationship** | Friends, follow, ownership | `buddy_pairs`, `buddy_requests`, `user_follows`, `entity_follows`, `tenant_memberships` | `/me/buddies`, `/me/following`, `/me/entity-follows`, buddy routes | `/buddies`, people browse, profile follow controls | **Split** — writes in **social_graph**; **browse roster** in **member_discovery** (correct separation, easy to confuse in new features) |
| **Goal** | Time-bounded plan target | `user_goals` | `/me/goals` | Plan `?lens=goals`, profile teaser | **Align** |
| **Participants** | Confirmed joiners | `activity_participants` | On activity detail + host participant routes | Rosters, Who’s going (entitlement-gated) | **Align** |
| **Members** (Free / profile-complete host / Pro) | One account, tiered publish + entitlements | `auth_users.profile`; `tenants` + `host_applications` | `HostStatusDTO` — `signupProfileComplete`, `canPublish`, `publishingProfileKind`, Pro paths | `/welcome`, `/profile/pro-membership`, `useHostStatus` | **Align** — **do not** use `UserRole` for product gates |

### 11.1 Special case: “Find” / looking for crew

Product: host publishes **seeking** (organizing or looking). Implementation:

- **M1/M2:** `activities` with `activityMode: seeking` **plus** `participant_intents` stub for manage/backfill.
- Map items may be `source: activity` or legacy demand pin.
- Join canonical path: **`POST /activities/:id/requests`** when seeking activity exists.

**Verdict:** **Debt** — dual root until D4 (single seeking root). This is the largest **domain-structure** tax under your **Activity + Host** row.

### 11.2 Place vs Shop vs Operator on the map

| Thing | On explore map? | Detail URL | In “Browse all entities” |
|-------|-----------------|------------|---------------------------|
| Trail / camp / facility | Yes (`source: venue`) | `/trail`, `/camp`, `/venue` | Yes (taxonomy + search) |
| Shop (retail) | Yes (pin + `source: shop` or venue shop kind) | `/shop/:id` | Yes |
| Agency / tour operator | **No** — appears via **hosted activities** + storefront | `/agency/:slug` | Browse **Agencies** lens / search terms |
| Pro guide | Optional pin; primarily activities | `/guide/:slug` | Browse / area operators rail |

This matches your **Operator** rule (agency/pro not map-first). **Engagement risk:** members must learn that **operators are discovered through trips**, not pins — product copy and browse taxonomy must carry that (partially in `exploreBrowseTaxonomy.ts`).

---

## 12. Frontend surface strategy — your list vs repo structure

You described six top-level strategies. Below: how they map to **routes/modules**, and whether **storage/API** back each surface with one read model.

```mermaid
flowchart LR
  subgraph tabs [Mobile bottom nav]
    E[Explore /explore]
    P[My Plans /plan]
    C[Chat /chat]
  end

  subgraph chrome [Header chrome]
    H[Hamburger MobileMenu]
    N[Notifications bell]
  end

  subgraph explore_modes [Explore sub-modes - same route]
    M[Map default]
    L[list=1 map-aligned rows]
    B[browse=1 visual discover]
    PEOPLE[view=people panel]
  end

  subgraph parallel [Parallel full-screen]
    LIST[/list poster feed]
    PROF[/profile hub + stacks]
  end

  E --> M
  E --> L
  E --> B
  E --> PEOPLE
  H --> LIST
  H --> B
  tabs --> PROF
```

| Your surface | User job | Route(s) | FE module roots | Backing read model | Alignment |
|--------------|----------|----------|-----------------|-------------------|-----------|
| **Explore** | Map or list, peek → detail for **activities + location-bounded places** | `/explore`, `list=1`, peek sheets | `src/explore/*`, `ExploreExperience`, selection hooks | **`GET /explore/map`** + client filter | **Split** — correct IA; **one blob** + **god orchestrator** |
| **Browse** | Search + open **any** entity (incl. agencies, people) | `/explore?browse=1`, `/list`, people `listCat=people`, global search | `src/list/*`, `ListDiscoveryExperience`, `PeopleBrowsePanel`, `exploreItemSearch.ts` | Still **`/explore/map`** for pins + **`/users/browse`** for directory + entity detail fetches | **Split** — “browse” is **not** a separate API; it is **projections** over discovery + member_discovery |
| **My Plans** | Goals + upcoming + **attentions** | `/plan` | `src/components/plan/*`, `src/plan/*` | Goals: `/me/goals`; upcoming: activity lists; attentions: **`GET /me/coordination-attention`** | **Align** — attentions are a proper cross-cutting read model |
| **Chat** | DM, groups, outing threads, unread | `/chat` | `Messages.tsx`, `src/messaging`, `@/chat` | `/chat/inbox`, wall + DM endpoints | **Align** for product; **Split** at storage (two transports) |
| **Profile** | Account, membership, settings stacks | `/profile`, `/profile/settings`, `/profile/pro-membership` | `Profile.tsx`, `src/member/*` | `/me/profile`, `host-status` | **Align** |
| **Hamburger** | Quick nav + browse + app downloads | `MobileMenu.tsx`, `discoverBrowseNav` | Links to Explore, Plan, Chat, Profile, Browse, install hashes | N/A (navigation only) | **Align** — not a data surface |

### 12.1 Naming friction (yours vs codebase)

| You said | Code / docs say | Recommendation |
|----------|-----------------|----------------|
| Browse = all entities | **Browse** also means map-first `/explore` in `NAVIGATION.md` | In architecture docs, use **Discover browse** (`browse=1`, `/list`) vs **Explore map** (`/explore`) |
| Participants vs Participation | `activity_participants` vs `activity_requests` | Keep **Participation** = process; **Participants** = confirmed rows |
| Operator | `organisation` / tenant / agency | Use **operator** only in product copy for tour agencies; code stays `agency` / `PublishingProfileKind` |
| Programme | campaigns (future) | When shipping, add bounded context row to `SYSTEM_COHERENCE` §3 — do not overload `activities` |

### 12.2 Where frontend structure is **not** clean for scale

| Issue | Symptom | Engages user how |
|-------|---------|------------------|
| **ExploreExperience** hub | Map + browse chrome + people panel + compose + host sheets | Every new pin type touches one file |
| **Duplicate list systems** | `list=1` rows vs `/list` posters vs Plan lists | Same activity, three card builders |
| **Place detail routes** | Trail/Camp/Venue vs unified place | SEO OK; **viewer access** and tabs duplicated |
| **Partial React Query** | Full map refetch on many mutations | Stale join counts on map |
| **People vs Chat** | Separate contexts (good) but similar cards | Wrong API if “browse people” imports chat domain |

---

## 13. Layer-by-layer alignment (storage → infra → API → FE)

### 13.1 Storage layer

**Strength:** `collections.ts` is a single manifest; legacy `events` migrated; participation split (`requests` vs `participants`) is correct.

**Gaps vs your model:**

| Gap | Impact |
|-----|--------|
| No **programme** aggregate | Cannot link series, festivals, or multi-host initiatives without N activities |
| **Demand** still has `participant_intents` alongside seeking **activities** | Join/map/id confusion |
| **Shop** = `tenants` + `merchant_profiles` | Two-write on manage (known C6) |
| **Member map pins** / journey | `member_map_pins` — engagement feature orthogonal to explore map (second pin story) |

### 13.2 Infrastructure layer

| Piece | Role | Fit for high engagement |
|-------|------|-------------------------|
| MongoDB | System of record | Fine; needs indexed read models for map bbox |
| Redis | Explore map payload cache | Good hit rate; **stampede** risk on cold start |
| SSE | Chat stream | Good for threads; **map does not stream** |
| S3 / media | Assets | Standard |
| No event bus | — | Join/approve → only `invalidateExploreMapCache()` | **Weak** for live social proof |

### 13.3 API layer

**Clean placement (examples):**

- Host tier: **only** `member-host-status.ts`
- Activity visibility: `compose-activity-viewer-access.ts`
- Map personalization: `explore-map-viewer-access.ts` (batch enrich)
- Plan attentions: `member-coordination-attention.ts`

**Leaky boundaries:**

- Map build (`explore-map.ts`) knows shops, venues, demand, rideshare — **discovery context owns too much projection logic**
- Intent join aliases in `participant-intent-requests-store.ts` — participation + compose bleed
- Public area routes assemble operators + places + activities — **area hub is a mini-composer** (acceptable if it stays one module)

**API mount strategy** (`/me`, `/host`, `/chat`, `/shop`, `/admin`) **matches** your member vs operator split.

### 13.4 Frontend domain modules (`src/api/domains/*`)

| Domain file | Your concepts covered |
|-------------|----------------------|
| `explore.ts` | Area pins, map, intents |
| `activities.ts` | Activity, participation |
| `places.ts` / `placeRegistry.ts` | Place |
| `organisation.ts` | Operator storefronts |
| `shop.ts` | Shop commerce |
| `areas.ts` | Area hubs |
| `social.ts` | Relationship writes, wishlist, entity follow |
| `account.ts` | Member discovery browse |
| `member.ts` | Host status, coordination attention |
| `goals.ts` | Goal |
| `messaging.ts` / `chat.ts` | Chat (facade pattern) |

**Missing:** `programme.ts` (future). **Duplication risk:** `messaging` vs raw `chat` — guarded by ESLint in mature paths.

---

## 14. Scalable + engaging — scorecard against your model

| Requirement | Today | Blocker |
|-------------|-------|---------|
| Discover **area → place → activity** in one session | Area page + map pins + `areaId` filters | Map payload size; no incremental fetch |
| **Operator** discover without map pin | Agencies browse + activity publisher row | Users may not understand path |
| **Host** organize + seek same gates | `canPublish` + seeking activities | Dual-write intent stub |
| **Participation** loop with feedback | Requests, Plan attentions, notifications | Map/list not patched on join |
| **Relationship** → chat eligibility | `chat-policy.ts` + buddies | Correct; keep out of discovery DTO |
| **Goal** tied to real outings | Goals API + progress rules | Align |
| **Programme** spanning orgs | Not built | Product gap |
| **Chat** coordination per outing | One `social_groups` per activity | Strong |
| **Member tiers** without role soup | `HostStatusDTO` | Strong — keep discipline |

**Overall:** The **taxonomy you listed is mostly reflected in storage and bounded contexts**. Misalignment is concentrated in:

1. **Discovery read model** (one blob) vs **detail compose** (per entity).
2. **Seeking** dual root.
3. **FE projection sprawl** (peek / list / poster / detail).
4. **Programme** not modeled.
5. **Browse** as a product surface vs **explore/map** sharing one API.

---

## 15. Recommended structure program (mapped to your nouns)

| Priority | Initiative | Touches (your words) |
|----------|------------|----------------------|
| P0 | **DiscoveryCardViewModel** (D1) | Explore, Browse, Activity, Place on cards |
| P0 | **Seeking single root** (D4) | Host “looking for”, Activity on map |
| P1 | **Explore shell split** (D2) | Explore vs hamburger browse entry |
| P1 | **Place detail unification** (C4) | Place routes |
| P2 | **Map read vNext** (D3) | Area-scoped fetch, engagement freshness |
| P2 | **Programme aggregate design** | Programme — spec only until product commits |
| P3 | **Shop tenant + merchant single write API** | Operator shop |
| P3 | **Event outbox** for join/roster | Participation → Explore social proof |

This extends §8 with your vocabulary; execution order unchanged.

**Implementation:** full phased plan → [`system-refactor-plan.md`](./system-refactor-plan.md) (R0–R8); Tier-1 tracker **S8** + **C17–C20** in [`SYSTEM_COHERENCE.md`](../SYSTEM_COHERENCE.md) §7–§8.
