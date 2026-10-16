# Member surfaces — implementation plan (master checklist)

**Status:** Approved direction · **§19–§22 eng complete** · **§20** ops + post-migration residue remain  
**Last updated:** 2026-10-13 (D4 → consumer detail surfaces handoff doc)  
**Schedule:** Open people/profile UI work → **[`SYSTEM_COHERENCE.md`](../SYSTEM_COHERENCE.md) §8.3 S13-W1–W4** (lens URLs, dedupe browse module, member row VM).  
**Audience:** Eng + product — use this so context is not lost across PRs.

**Consumer detail shell work (D4):** execution checklist and conversation record live in [`consumer-detail-surfaces-plan.md`](./consumer-detail-surfaces-plan.md) — start at **§14** before coding phases 1–7.

**Tier 1 defers to:** [`NAVIGATION.md`](../NAVIGATION.md), [`DOMAIN.md`](../DOMAIN.md), [`DOMAIN_CANONICALS.md`](../DOMAIN_CANONICALS.md), [`SYSTEM_COHERENCE.md`](../SYSTEM_COHERENCE.md), [`CREATE_FLOW.md`](../CREATE_FLOW.md), [`MEMBER_MODEL.md`](../MEMBER_MODEL.md) — **update those as each phase ships** (see §10).

**Related experiment notes:** [`explore-browse-ia.md`](./explore-browse-ia.md) (topic + pin layers — **will change** when demand merges into Activity).

---

## 0. Decision record (locked)

- [ ] Team sign-off recorded in PR or issue linking this doc

| # | Decision |
|---|----------|
| D1 | **Four consumer tabs:** Explore · Plan · Chat · Profile (no Social tab, no Host tab). |
| D2 | **No consumer `/host` shell** — host = capability; per-activity manage on Plan + activity detail; business manage via Profile → shop/agency/guide URLs. |
| D3 | **Retire “trips”** as product + architecture term; **Activity** + **commitments** on Plan; redirects for legacy URLs. |
| D4 | **Catalog projections:** `/activity`, places, `/shop`, `/guide`, `/agency` — same detail pattern; not a separate host app. **Phased shell work:** [`consumer-detail-surfaces-plan.md`](./consumer-detail-surfaces-plan.md) (place/area/shop/agency; activity audit). |
| D5 | **Geography:** Region (emirate) → **Area** (curated, e.g. Hatta) → Place → Activity. |
| D6 | **Time-bound on map:** everything that is not a Place is an **Activity** with `activityMode`: **`hosted`** \| **`seeking`** (no separate map species “demand”). |
| D7 | **Availability** is **person + calendar slots** — separate from Activity; discoverable on Explore via map **People pill** → **Available** tab (and list Buddies); edited on Plan. **No extra map cluster overlay** — pill + panel is the map entry. |
| D8 | **Browse axis:** shared **topic** (hiking, camping, rideshare, …) across activities (both modes), places, and available people. |
| D9 | **Find FAB** creates Activity **`seeking`** (not a parallel entity in UX). |
| D10 | **Plan** owns: commitments (join/organize/seek), goals, saved (wishlist), availability editor — full create/edit, not read-only. |
| D11 | **No fifth tab** — Friends at `/buddies` (Profile/hamburger); **People** on Explore = discovery + availability, not chat. |
| D12 | **Business workspace** stays under **shop/agency/guide manage URLs** + Profile membership — not consumer `/host` branding. |
| D13 | **Wishlist / saved** — one API; **write UI primary on Plan `saved` lens**; Explore heart writes same store; Profile **teaser only** (no second list). |
| D14 | **Seeking ≠ availability** — seeking = Activity `activityMode: seeking` (map pin); availability = person slots in **People** browse (`peopleTab=available`), not activity pins. Never one entity. |

---

## 1. Target architecture (reference)

### 1.1 Main screens

| Screen | Route | Owns |
|--------|--------|------|
| Explore | `/explore` | Discover + Publish (FAB); map/list/browse/people |
| Plan | `/plan` | Commitments, goals, saved, availability, manage outing |
| Chat | `/chat` | Messages, compose DM/group; crew deep links |
| Profile | `/profile` + stack | Identity, visibility, history, journey map, badges, contributions, memberships → business manage |

### 1.2 Entity projections

| Entity | Route(s) | Plane |
|--------|----------|--------|
| Activity | `/activity/:id` | activities |
| Place | `/trail`, `/camp`, `/venue`, … | places |
| Area | `/area/:slug` | areas + discovery aggregate |
| Shop / guide / agency | `/shop/:id`, `/guide/:slug`, `/agency/:slug` | catalog (tenant public) |
| Member | `/member/:userId` | account (+ public availability slice) |

### 1.3 Cross-cutting

Notifications (deep link to **activity**, **Plan row context**, **chat thread**, **buddies requests** — not generic `/plan?segment=…` when entity exists), Share, Follow, Report, Auth — not tabs.

### 1.5 Explore discovery trilogy (product questions)

| Question | Answer on Explore |
|----------|-------------------|
| **What’s happening?** | Activities (`hosted` + `seeking`) + topic/when/area filters |
| **Who’s available?** | **People** layer + availability index (not a separate “Social” tab) |
| **Where can I go?** | Places + **Area** pages + shops/operators on area |

**When / where / how:** time on activity & availability slots; place/area on map; join/request/RSVP on activity detail; crew via Chat deep link.

### 1.4 Legacy redirects (maintain until analytics quiet)

| Legacy | Target |
|--------|--------|
| `/trips`, `/activities` | `/plan` or Profile history per query (`legacyTripsRedirect.ts`) |
| `/profile/my-trips` | Profile **history** + **journey map** (rename paths when ready) |
| `/host/*` (consumer) | Plan, activity manage, or business manage — **no new links** |
| `/profile/wishlist` | `/plan?tab=wishlist` (`planWishlistTabPath()`; legacy `lens=saved` normalizes) |
| `ExploreMapSource: demand` (wire) | Project as `activity` + `activityMode: seeking` until M2; then remove enum value |

### 1.6 Already on branch (do not redo)

- [x] `PLAN_PATH` `/plan`, legacy `/trips` → Plan or Profile history (`legacyTripsRedirect.ts`)
- [x] `MY_TRIPS_PATH` history/map split from Plan (rename to `PROFILE_HISTORY_*` still open)
- [x] Explore pin label **Activities** (wire key `trips` rename still open — Phase 2.3)
- [x] Bottom nav **Plan** label; middle tab routes to `/plan`
- [x] Plan **Upcoming · Wishlist** tabs + calendar layout; availability via `?lens=availability` (`src/plan/PlanPage.tsx`, `planTab.ts`)

---

## 2. Domain model checklist

### 2.1 Activity (unified time-bound)

- [x] Add `activityMode: 'hosted' | 'seeking'` to domain schema (Zod + Mongo + `ActivityDTO`)
- [x] Document in `DOMAIN.md` — seeking = former participant intent / “looking for”
- [x] Map **all** time-bound pins to `ExploreMapSource: 'activity'` on API build (§20 P1 wire); legacy `demand` enum + `pin=demand:` parsers until compat aged out
- [x] Seeking discovery UX — map/list/peek cards + `seekingOnMap` People browse rows route to explore pin (`exploreMapItemPathFromSeekingRow`); no duplicate seeking detail UI
- [x] `/activity/:id` for seeking — secondary deep link only (`activitySharePath`); join via `activityJoinCtaLabel` + same detail view eyebrow (`activityDetailEyebrowForActivity`); primary discovery stays explore pin/peek
- [x] Join requests: unify or alias `participant_intent_requests` → activity-scoped requests (M2a–M2c)

**Kinds (unchanged wire, aligned names):**

- [x] `activityType`: hiking, camping, event, rideshare (+ generic “activity” organize)
- [x] Align `src/config/activityTypes.ts` with `ScheduledActivityType` on wire
- [ ] `ParticipantIntentKind` values map into `activityType` + `seeking` mode (incl. guide → policy in MEMBER_MODEL)

### 2.2 Place

- [x] Keep **one** entity `locations` / Place; kinds in `PlaceKind` (`place-kind.ts`)
- [x] Add `areaId` on place rows (admin + seed + backfill)
- [x] Facilities (toilet, parking, …) = `PlaceKind` — area rollups + hub + **Spots** map pins (`placeKind` on explore payload)

### 2.3 Area

- [x] Collection `areas` (or documented equivalent) with slug, name, region, bounds, center, status — **Phase 4**
- [x] Admin CRUD + seed (Hatta, Jais, …)
- [x] `GET /areas/:slug` public card + `/area/:slug` page
- [x] **`place.areaId`** on every catalog place (admin + Add + seed backfill)
- [x] Hosted geography = **`activity.locationId` → `place.areaId`** only on write (§4); legacy `activity.areaId` read fallback; polygon **not** authority for hosted publish

### 2.4 Availability (new)

- [x] Collection `member_availability` (or `availability_slots`) — see §5 — **Phase 5**
- [x] **Not** an Activity; **not** merged with seeking posts
- [x] Visibility: public | buddies | hidden (MEMBER_MODEL)

### 2.5 OutingTopic (browse projection)

- [x] Add `OutingTopic` + helpers — **Phase 2**
- [x] Single matcher used by explore map/list (`explore-map.ts`, `exploreMapPinModel.ts`)
- [x] Retire separate “Looking for” pill — use Activities layer + optional chip Hosted | Seeking | All

---

## 3. Explore — implementation checklist

### 3.1 Layers (URL + chrome)

- [ ] **Topic** row: hiking, camping, rideshare, events, shops, … (`explore-browse-ia.md` updated)
- [ ] **Layer** row: Activities (hosted+seeking) | Places | Shops | **People** (availability)
- [x] Remove **Looking for** map pill (seeking rolls into Activities); keep `pinKind=looking` / list `filter=looking` as **URL compat** only (`explorePinKindFilter.ts`, browse list handoff)
- [ ] `?area=:slug` constrains bbox + membership
- [ ] When / date presets apply to activities; availability uses date range on People

### 3.2 Map pins

- [x] Activity pins: badge **Seeking** vs **Hosted** (corner chips on map emoji pins — `mapPinIcons` + `resolveExploreMapActivityMode`)
- [x] Map **People pill** → **Available** tab (`ExploreMapPeopleBrowseButton`, `PeopleBrowsePanel`) — **shipped**; supersedes area-cluster overlay idea
- [x] ~~Separate **area cluster** pins on map canvas~~ — **not needed** (2026-10-10); pill + panel already covers discovery

### 3.3 Search

- [x] Query “Hatta” → **Area** card first → `/area/:slug` (`ExploreSearchAreaHints` + `searchPublishedAreasForQuery`)
- [ ] Topic + area + when returns activities (both modes), places, people index

### 3.4 FAB

- [ ] Organize → Activity `hosted`
- [ ] Find → Activity `seeking` (same wizard UX; new write path when storage merged)
- [ ] Add → Place contribute (unchanged)

### 3.5 Area detail page

- [x] Route `/area/:slug`
- [x] Sections: **upcoming activities** + **catalog places** previews; **available people** (week filter); map CTA via explore `?area=`
- [x] Map strip embed (`AreaHubMapStrip`), places by kind grouping, shops rail (shop pins only; pro/agency via activity host + profiles)
- [x] CTAs: FAB compose with `?area=` slug prefill on Find/Add curated area step (organize still uses catalog place `areaId`)

---

## 4. Geography (locked product contract)

**Authority:** admin **Area** registry (`areaId`) + **`place.areaId`** on every catalog row. Activities **do not** get a separate area field on write — `activity.locationId` → place. **No** polygon hit tests for tagging.

### 4.1 Shipped (Phase A — place-derived area)

- [x] Organize public publish: registry **place** must have **`place.areaId`** (`validateOrganizePlaceArea`; no activity-level area picker)
- [x] Host create: no **`areaId`** on activity body; publish gate uses **`place.areaId`**
- [x] Explore map activity items: **`areaSlug`** from linked place (legacy `activity.areaId` read fallback)
- [x] Area hub lists: activities by **`location.areaId`** (+ legacy activity row)
- [x] Find: **Area & map pin** step → `participant_intents.areaId`; seeking synthetic **`place.areaId`**
- [x] Admin places UI: **`areaId`** on catalog rows
- [x] Tier-1 docs: `DOMAIN.md`, `CREATE_FLOW.md`, `SYSTEM_COHERENCE.md`

### 4.2 Phase B — Add place & custom anchors (shipped)

- [x] **Add** wizard: **`curatedArea`** step before pin (hiking, camping, shop, others)
- [x] `POST /me/locations` + host `/locations`: require **`areaId`**; validate published area
- [x] Structured organize: catalog place only (no custom trail anchor); rideshare/generic anchor place gets **`areaId`** via bounds match on going-from pin

### 4.3 Phase C — Explore **Locations** lens (shipped)

- [x] Map canvas: **area name pins** + rollup stats (`source: area`, `pinKind=locations`)
- [x] Area peek sheet → Activities, seeking, Trails, Spots, Facilities (area page), Shops + area page (`ExploreAreaPeekActions`)
- [x] Keep **Activities** lens: per-outing emoji pins (unchanged)

### 4.4 Phase D — Matching & notifications (shipped)

- [x] Find in **area A**: in-app notification when upcoming **hosted** activities share `areaId` / `place.areaId`
- [x] Hosted publish in **area A**: notify active Find posters in same area (`seeking-area-match-notifications.ts`)
- [x] Copy: “An outing in {area} matches your looking-for post” / “Outings in {area} match what you are looking for”
- [ ] Optional: buddy overlap rules (deferred)

### 4.5 Phase E — Integration test fixtures (shipped)

- [x] **12 curated areas** in `CURATED_AREA_CATALOG` + `seedCuratedAreas` (summaries, bounds) — admin can edit live rows
- [x] Seed catalog places + Hatta multi-pin cluster wired via `seed-location-area-map.ts` + `backfillSeedCatalogLocationAreaIds`
- [x] Finish routing remaining API vitest files through `apps/api/tests/helpers/test-seed.ts` (`createTestLocation`, `defaultTestAreaId`, `buildTestParticipantIntentInput`)
- [x] No new literal `area-seed-*` in test files — use `@uaetrail/shared-types` `curatedAreaSeedId` (guarded by `test-seed-coherence.test.ts`)
- [x] `apps/api/tests/README.md` — one-page fixture guide

### 4.6 Availability (unchanged track)

- [x] Availability: user selects `areaId` (+ region fallback); no required GPS home pin

---

## 5. Availability — implementation checklist

### 5.1 Data model

- [ ] `MemberAvailability`: userId, kinds[], visibility, region?, areaId?, note?
- [ ] `slots[]`: `{ startDate, endDate, timeBand? }` (inclusive dates; multi-day ranges)
- [ ] Index for overlap queries: kind + area/region + slot range + visibility
- [ ] Auto-expire past slots in read model

### 5.2 Set & publish (Plan)

- [ ] Plan UI: calendar multi-select / range picker + kinds + area + visibility default from Profile
- [ ] Save = publish to index (when visibility ≠ hidden and ≥1 future slot)
- [ ] Distinct entry from FAB Find (seeking **activity** vs **availability**)

### 5.3 View surfaces

- [ ] Explore **People** list: filters topic, date range, area, buddies-only
- [x] Explore map entry: **People pill** + `peopleTab=available` (not cluster overlay); list **Buddies** + `/area/:slug` sections
- [ ] `/area/:slug` — available people section
- [ ] `/member/:id` — public slice per visibility
- [ ] Optional v2: activity detail “N members available near this date”

### 5.4 Guide kind

- [ ] Policy in MEMBER_MODEL: commercial guide = hosted Activity / agency profile; casual “can guide” = availability kind `guide` with clear copy

### 5.5 API

- [ ] `GET /me/availability` · `PUT /me/availability`
- [ ] `GET /explore/people?...` or extended `GET /explore/map` people facet
- [ ] Tests: overlap, visibility, buddies-only

---

## 6. Plan — implementation checklist

### 6.1 Lenses (URL `?lens=`)

- [x] `schedule` — joining, organizing, **seeking** (`PlanHostingUpcoming` + intents), **needs-you** (`PlanNeedsYouStrip`)
- [x] `saved` — wishlist list shell (`PlanSavedSection`); heart on Explore → same API
- [x] `goals` — full CRUD on Goals lens (moved off schedule default)
- [x] `availability` — **dedicated lens** (`?lens=availability`, `PlanAvailabilitySection`) — **OD-3 locked** (see §19)
- [x] `calendar` — month grid + day sheet (`PlanCalendarSection`, `planCalendarMarkers.ts`)
- [x] **Needs-you** strip atop `schedule` — actionable coordination only (`PlanNeedsYouStrip`, `buildPlanNeedsYouRows`). **Not** “looking for” / seeking — see **Seeking** (`PlanHostingUpcoming` intents) + Explore Find.

**API:** `GET /me/coordination-attention` → `{ items: MemberCoordinationAttentionItemDTO[] }` (`kind`, `count`, optional `activityId` / `inviterDisplayName`). Kinds: `host_join_queue`, `joiner_pending_host`, `buddy_request_incoming`, `activity_join_invite`, `join_request_withdrawn`, `participant_revoked`, `join_request_rejected`. Copy + routes: `src/member/coordinationAttentionPresentation.ts` (not API `label`/`path`).
- [x] **Suggested** rail (wishlist ↔ explore map match; links out, no embedded map) — `PlanSuggestedRail` + `planWishlistExploreMatches` (§19 #3)

### 6.2 Manage outing (no /host)

- [x] Row tap → manage sheet on Plan (`PlanHostingUpcoming` / history `HostedActivitiesSection` + `SeekingIntentsSection` + `ActivityManageSheet` / `ParticipantIntentManageSheet`)
- [x] Host join queue links → Plan hosted (`tripsPlansPath('hosted')`), not consumer `/host/requests`

### 6.3 Profile memory (not Plan)

- [x] Rename routes: `PROFILE_HISTORY_PATH`, `JOURNEY_MAP_PATH` (redirect from `my-trips`)
- [x] Past activities on Profile only — `/plan` redirects non-`view=plans` to history; Plan UI has no completed/past sections

### 6.4 Code moves

- [x] Rename `src/trips` → `src/member-plan` — **`src/trips` shims removed** (Oct 2026)
- [x] Remove `TripsMainTabs` from Plan; no “trips” UI strings (`verify` + grep) — Plan page uses `PlanPageTabs` (`src/plan/PlanPage.tsx`); profile history uses its own chrome

---

## 7. Chat · Profile · Host retirement

### 7.1 Chat

- [x] Context-first deep links from activity, notifications (`messagesGroupPath` + `activity` query; `openActivityGroupChat`; notification normalize)
- [x] Tab = inbox; de-emphasize empty-state DM discovery (no empty-state compose CTA; toolbar compose when threads exist)
- [x] **`/groups`** — list/manage only; thread always `/chat?group=` (`groupsManagePath`, `G-chat` acceptance guard)

### 7.2 Profile

- [x] Identity, settings, **visibility** entry (`ProfileSettingsIndex` → privacy/visibility; `ProfileVisibilitySection`)
- [x] Badges, contributions (**reviews** + **place suggestions** via Add/contribute) — Profile launcher → `/profile/badges`, `/contributions` (+ `/profile/reviews`); Explore `compose=add`; not duplicated on Plan (`memberSurfacesAcceptance`, `NAVIGATION.md` § Profile hub)
- [x] Memberships → **Pro / business / shop** → `/profile/pro-membership`, `/shop/manage`, etc. — **not** `/host/overview` for consumers (`G-arch`, `G-profile`)
- [x] Friends (`/buddies`) launcher — not a fifth tab (`ProfileQuickLauncher`)
- [x] **History** + **journey map** only here (not on Plan) — `PROFILE_HISTORY_PATH`; Plan redirects `view=completed`
- [x] Teaser links to Plan lenses (counts OK; **no** duplicate goals/saved/upcoming lists) — `ProfilePlanGoalsTeaser` → `planLensPath('goals')`
- [x] Guest **bottom nav**: prefer Explore + sign-in **or** dead tabs with single promise — `NAVIGATION.md` guest tab row; `GuestTabPlaceholder` on Plan/Chat

### 7.3 Retire consumer `/host`

- [x] Inventory all `/host` links in `src/` (consumer) — `hostMemberGuard` scans requests/activities/team + overview
- [x] Replace with Plan + activity manage + Profile business entry (`EmptyActivitiesBanner`, `OrganisationPublicProfile` owner CTAs)
- [x] `App.tsx` redirects for bookmarks (`participantHostBookmarkRedirect` + ProtectedRoute)
- [x] Keep host routes for **business workspace** only if renamed (`/studio` optional — noted in `API_ROUTING.md` consumer vs console)

---

## 8. API & storage migration phases

### Phase M0 — Projection only (low risk)

- [x] Explore map emits seeking items as `source: activity`, `activityMode: seeking`
- [x] UI removes Looking for pill; filters use mode
- [x] Still read `participant_intents` collection

### Phase M1 — Dual write

- [x] New Find publishes to `activities` with `seeking` + read intents for legacy (`participant-intent-seeking-activity.ts`)
- [x] Backfill script intents → activities (`npm --workspace @uaetrail/api run backfill-seeking-activities`)

### Phase M2 — Single write

- [x] Stop writing intents (M2d — `PARTICIPANT_INTENT_STUB_WRITE=false` per env)
- [x] Join requests on seeking rows → `activity_requests` (M2b–M2c)
- [x] Deprecate `participant_intents` in API docs (`API_ROUTING.md` M2d note)

### Phase M3 — Areas + availability

- [x] `areas` + `areaId` on activities/places — **Phase 4**
- [x] `member_availability` + explore people index — **Phase 5**

---

## 9. Implementation phases (execution order)

Use one PR per subsection where possible; check boxes when merged.

### Phase 0 — Docs charter (parallel)

- [x] 0.1 Update Tier-1 tables per §10 (minimal pass: NAVIGATION, DOMAIN, DOMAIN_CANONICALS)
- [x] 0.2 Stub `TRIPS_HOST_MANAGE.md` → superseded by NAVIGATION + COMMUNICATION
- [x] 0.3 This doc linked from `experiment/README.md`
- [x] 0.4 `scripts/bounded-context-manifest.json` — add `areas`, `availability`; remove trips hub wording
- [x] 0.5 `npm run verify:system` green after doc-only changes

### Phase 1 — Terminology & routes (partially done)

- [x] 1.1 `PLAN_PATH`, `PROFILE_HISTORY_PATH` / `JOURNEY_MAP_PATH` + legacy redirects
- [x] 1.2 Plan lenses shell (`?lens=schedule|calendar|availability|saved|goals`)
- [x] 1.3 Profile history paths (`PROFILE_HISTORY_PATH`, `JOURNEY_MAP_PATH`); `tripsConsumerNamingGuard`; consumer copy → Plan / History
- [x] 1.4 Mobile tab label **Plan** (middle tab → `/plan`) — `NAVIGATION.md` § Mobile tabs

### Phase 2 — OutingTopic + explore layers

- [x] 2.1 `OutingTopic` helpers in `shared-types` (`OUTING_TOPICS`, `parseOutingTopic`, `mapItemMatchesOutingTopic`)
- [x] 2.2 Unified topic filter on activities + places (`exploreOutingTopic` + shared matcher)
- [x] 2.3 Rename pin kind wire `trips` → `activities` (with backward compat parse)
- [x] 2.4 Update `explore-browse-ia.md` + taxonomy tests (`explorePinKindFilter.test.ts`)

### Phase 3 — Activity seeking projection (= **§8 M0**; do not duplicate M0 elsewhere)

- [x] 3.1 DTO: `activityMode` on map items
- [x] 3.2 Seeking badge on cards/peek
- [x] 3.3 Plan schedule shows seeking rows
- [x] 3.4 Remove Looking for pill

### Phase 4 — Areas

- [x] 4.1 Admin areas CRUD + seed
- [x] 4.2 `place.areaId` + admin link UI (`/admin/places` curated area + `/admin/areas` catalog CRUD)
- [x] 4.3 `activity.areaId` on publish — organize explicit pick + place link (polygon demoted for hosted)
- [x] 4.4 `/area/:slug` page + `?area=` explore filter
- [x] 4.5 Search boosts area entity (`ExploreSearchAreaHints` + `/area/:slug`)

### Phase 5 — Availability (M3)

- [x] 5.1 API + shared-types
- [x] 5.2 Plan availability editor (Available lens + day calendar multi-select)
- [x] 5.2b Plan **Calendar** lens month view (markers from `planCalendarMarkers` + map outing density)
- [x] 5.3 Explore People filters (wire roster UI to `/explore/people/availability`)
- [x] 5.4 Explore people availability API (`GET /explore/people/availability`; `clusters[]` unused on client)
- [x] ~~5.4b Map cluster overlay~~ — **skipped**; **5.3 map chrome** = People pill → Available tab (already live — `NAVIGATION.md` § Browse people)
- [x] 5.5 Area page + member profile public slice
- [x] 5.6 MEMBER_MODEL visibility rules

### Phase 6 — Activity storage merge (M1–M2)

- [x] 6.1 Create seeking via activities API (M1 dual-write on `POST /me/participant-intents`)
- [x] 6.2 Join unification **M2a–M2c** — `activity_requests` canonical for seeking; intent routes alias read/write
- [x] 6.3 Explore map stops merging legacy `demand:` pins (seeking via `activities` only; run backfill for old intents)

### Phase 7 — Host retirement & business paths

- [x] 7.1 Consumer `/host` bookmark redirect map (`participantHostBookmarkRedirect` in `ProtectedRoute`)
- [x] 7.2 Profile business entry audit (`ProfileConsumerHub` → `PRO_MEMBERSHIP_PATH`; Plan needs-you → hosted Plan; guards in `memberSurfacesAcceptance.test.ts`)
- [x] 7.3 Notification meta URLs canonical (`/plan`, `/activity/:id`, `/chat?…`) — API + `inferNotificationPath` normalize legacy `/trips` and `pin=demand:`; **no** `/host/overview` in consumer meta

### Phase 8 — QA gates

- [x] 8.1 Run §11 acceptance tests (`src/member/memberSurfacesAcceptance.test.ts` + `verify:domain`)
- [x] 8.2 `npm run verify:system` full (includes explore alignment)
- [x] 8.3 Explore alignment tests in `npm run test:explore-alignment` (no change required this slice)
- [x] 8.4 PRE_DEPLOY_CHECKLIST — seeking backfill step added (`backfill-seeking-activities`)

---

## 10. Tier-1 doc update checklist (per phase)

| File | When | What to add |
|------|------|-------------|
| `NAVIGATION.md` | Phase 0–1 | 4 tabs; Plan lenses; no trips; no consumer host; area route |
| `DOMAIN.md` | Phase 2–4 | Region→Area→Place→Activity; activityMode; availability; OutingTopic |
| `DOMAIN_CANONICALS.md` | Phase 1–5 | Paths, `areaId`, `activityMode`, notification meta |
| `CREATE_FLOW.md` | Phase 3–4 | Find → seeking activity; area on publish |
| `MEMBER_MODEL.md` | Phase 5 | Availability visibility; guide policy; host = capability |
| `SYSTEM_COHERENCE.md` | Phase 4–5 | contexts: areas, availability; remove trips hub |
| `API_ROUTING.md` | Phase 4–6 | `/areas`, `/me/availability`, deprecations |
| `COMMUNICATION.md` | Phase 7 | Crew entry from Plan/activity only |
| `ARCHITECTURE.md` | Phase 1 | 4-tab IA |
| `explore-browse-ia.md` | Phase 2–3 | No looking pill; People layer; activities unified |

---

## 11. Acceptance criteria (release gates)

| ID | Criterion |
|----|-----------|
| G-arch | No new consumer links to `/host` or bare `/trips`; `verify:system` passes |
| G-lang | No user-facing “Trips” tab/hub; activities terminology on Explore |
| G-topic | Topic=hiking returns hosted + seeking activities + hiking places in one filter API |
| G-seek | Find FAB creates seeking activity; appears as activity pin (not demand source) |
| G-area | Publish with `areaId` = Hatta (or place linked to Hatta); `/area/hatta` + `?area=hatta` list it |
| G-avail | Multi-day availability on Plan visible in People search for matching dates (visibility respected) |
| G-avail-map | From map: **People pill** opens **Available** roster (`peopleTab=available`); **no** per-user availability pins or area-cluster overlay on the canvas |
| G-plan | Goals + saved + schedule + availability editable on Plan without Profile duplicate lists |
| G-manage | Host approve join from Plan/detail without `/host` (Needs you → Hosted → manage sheet; automated guards in `memberSurfacesAcceptance.test.ts`) |

---

## 12. Non-goals (this program)

- [ ] Documented agreement not to pursue in this program:
  - Fifth bottom tab (Social)
  - Generic friend DM as primary discovery
  - Merging availability into Activity entity
  - OSM-auto areas v1
  - SEO city landings at scale before curated areas work
  - **Map availability cluster overlay** — area chips on the map canvas (redundant with **People pill → Available**)

---

## 13. Context recovery (for agents / new threads)

**Read order:** this doc → `NAVIGATION.md` → `DOMAIN.md` § Activity/Area/Availability → `explore-browse-ia.md`.

**Code hotspots:**

| Area | Paths |
|------|--------|
| Plan page | `src/plan/PlanPage.tsx`, `src/components/plan/*`, `src/member-plan/*` (history URL helpers) |
| Explore map | `apps/api/src/lib/explore-map.ts`, `src/explore/ui/exploreMapPinModel.ts` |
| Pin pills | `src/explore/explorePinKindFilter.ts`, `exploreBrowseTaxonomy.ts` |
| Find/demand | `src/explore/ui/demandFlow.ts`, `apps/api/src/lib/participant-intents-store.ts` |
| Compose | `src/explore/compose.ts` |
| Places/kinds | `packages/shared-types/src/place-kind.ts` |
| Legacy redirects | `src/member-plan/legacyTripsRedirect.ts`, `src/App.tsx` |
| Areas | `registerPublicAreaRoutes.ts`, `registerAdminAreaRoutes.ts`, `src/pages/AreaDetailPage.tsx`, `explore-map-area-lens.ts` |

**Handoff phrase:** “Continue **member-surfaces-implementation-plan** from **§23 P0** (per-env `seeking:deploy-gate`) then **§23 P1** open items (rideshare wire), **§5** availability depth, **§20 P2** migration residue — geography §4.3–4.6 and §19–§22 eng are closed.”

---

## 19. Resume queue (execution order — use this after hygiene PRs)

**Do not** reopen Phase 5 API/editor unless a gate fails (`G-avail`). **Do not** build full Calendar UI until #2. Hygiene/refactors (naming, doc drift) are parallel-only — they do not replace items below.

| # | Work item | Plan refs | Primary files / notes |
|---|-----------|-----------|---------------------|
| 1 | ~~**Plan needs-you strip**~~ **done** | §6.1 | `PlanNeedsYouStrip.tsx` |
| 2 | ~~**Plan Calendar lens UI**~~ **done** | 5.2b | `PlanCalendarSection.tsx`, `usePlanCalendarData` |
| 3 | ~~**Suggested rail**~~ **done** | §6.1, Phase 5+ | `PlanSuggestedRail.tsx`, `planWishlistExploreMatches.ts` |
| 4 | ~~**Map cluster overlay**~~ **skipped** — availability already on map via **People pill → Available** | 5.4b, §12 | `ExploreMapPeopleBrowseButton`, `peopleTab=available` |
| 5 | ~~**Phase 1.3** trips naming~~ **done** | Phase 1, §6.3 | `PROFILE_HISTORY_PATH`, `tripsConsumerNamingGuard.test.ts` |
| 6 | ~~**Phase 6.1** M1 dual-write~~ **done** — backfill + deprecate `demand` source still open | §8, Phase 6 | `participant-intent-seeking-activity.ts` |
| 7 | ~~**Phase 7**~~ **done** — consumer `/host` audit, bookmark redirects, notification meta | §7 | `notificationRouting.ts`, `authRouting.ts`, `ProtectedRoute` |
| 8 | ~~**Phase 8**~~ **done** — §11 automated gates + full `verify:system` green | Phase 8 | `memberSurfacesAcceptance.test.ts` |
| 9 | ~~**§6.4 / §7.1 / §7.3 / §6.3**~~ **done** — `member-plan` rename, chat/groups, host guards, Plan forward-only | §6–7 | `hostMemberGuard`, `MessagesInboxList`, `PlanPage.tsx` |
| 10 | ~~**M2d**~~ **done** — `PARTICIPANT_INTENT_STUB_WRITE=false` after backfill | §8 M2 | `participant-intent-activity-readthrough.ts` |
| 11 | ~~**Ops tooling**~~ **done** — run `seeking:storage-status` + backfill + `PARTICIPANT_INTENT_STUB_WRITE=false` **per env** (staging/prod) | §8 seeking storage | `PRE_DEPLOY_CHECKLIST.md` |
| 12 | ~~**G-manage QA**~~ **done (eng)** — API `g-manage-coordination-join-approve.test.ts` + §11 guards; **staging UI** smoke in [`SEEKING_STORAGE_RUNBOOK.md`](../operations/SEEKING_STORAGE_RUNBOOK.md) | §6.1 | PRE_DEPLOY G-manage step |

**§19 queue:** **complete** for product engineering (2026-10-10). Remaining work is **ops per env** (#11 runbook) and optional **post-queue** (§20).

**Paused / explicit non-goals for now:** attention strip variants beyond needs-you (#1), goals projection polish, upcoming carousel (`plan-tab-ux-backlog.md`), **map cluster overlay** (#4 — pill path is enough).

---

## 21. Activity detail tabs (Plan · Place · Buddies · Transport)

**Canonical program (exit criteria, phases, trace matrix):** [`activity-detail-tabs-implementation-plan.md`](./activity-detail-tabs-implementation-plan.md) — **tick boxes there only**; this section is a summary for §11 guards.

**Tier-1:** [`NAVIGATION.md`](../NAVIGATION.md) § Activity detail · [`CREATE_FLOW.md`](../CREATE_FLOW.md) (participation → crew) · [`DOMAIN_CANONICALS.md`](../DOMAIN_CANONICALS.md) §15.4 · [`MEMBER_MODEL.md`](../MEMBER_MODEL.md) (Pro vs crew) · [`COMMUNICATION.md`](../COMMUNICATION.md) (crew entry).

**Anti-duplication:** one policy owner per concern — converge on `buildActivityPresentationDTO` + wire `presentation` / `mapPeekActions`; FE maps wire → UI. Adding a new path **requires deleting** the old shim/matrix in the same PR (`activityDetailAcceptance.test.ts`).

### AD-0 — Decisions (locked 2026-10-11)

| # | Decision |
|---|----------|
| AD-1 | UI tabs **Plan · Place · Buddies · Transport** only; wire unchanged (`activity`, `rideshare`, `viewerAccess`, …). |
| AD-2 | Chrome: **emoji + activity title** (AD-2b); kind in hero chips. Tier-1 sync pending — see program doc D2. |
| AD-3 | **Transport tab always visible** (reach-by + sustainability; linked ride deepens content). |
| AD-4 | **RSVP** → participant + crew immediately; **approve** → crew + `?joined=1`; **pending/waitlist** → `canAccessCrewSurfaces: false`. |
| AD-5 | Host ops on **Buddies**; destructive/edit in **⋯** — no fifth Manage tab. |
| AD-6 | Pro = paid social depth via `applyActivityViewEntitlements`; not `canPublish`. |
| AD-7 | Peek: hero + **Participants** + **Logistics** strips; footer CTAs match detail policy per viewer state (§6 in program doc). |
| AD-8 | **Dynamic CTA matrix** (pre/joined × free/Pro × host empty/full × profile + rideshare touchpoints) — **§6.2** in program doc; golden tests **AD-CTA-01**. |

### AD phases (implement in order; tick when exit criteria met)

#### AD-0 — Alignment (docs + guards)

- [x] Tier-1 updated (NAVIGATION, CREATE_FLOW, DOMAIN_CANONICALS §15, MEMBER_MODEL, COMMUNICATION, SYSTEM_COHERENCE S7b)
- [x] Transport tab product rule matches code (always on)
- [x] Remove deprecated peek shim file; remove orphan `HostActivityDetailView`
- [x] `memberSurfacesAcceptance` AD-arch guards

#### AD-1 — Shell (mostly done)

- [x] `activityDetailCopy.ts`, `activityDetailTab.ts`, tab bar, mobile hero; **AD-2b title chrome** (kind in hero chips) — see program doc
- [x] `ActivityManageSheet` embeds `ActivityDetailView`
- [ ] Mobile UX pass: icon-forward footers, minimal copy (ongoing polish)

#### AD-2 — API crew exposure (mostly done)

- [x] `canAccessCrewSurfaces` on `viewerAccess`; pending redacted crew fields
- [x] RSVP + approve → group chat enroll; approve notification `?joined=1`
- [x] `activity-viewer-access.test.ts` / engagement tests
- [x] Remove client-only crew fallback when detail always sends wire flag (§22 NA-3)

#### AD-3 — Tab bodies (v3.2 aligned 2026-10-11)

- [x] Plan merge + host row + transport teaser (`activityDetailCopy` + Plan tab CTA → Transport); sustainability line on Plan + Transport
- [x] Place gated empty state (`ACTIVITY_DETAIL_PLACE_LOCKED_*`); crew-only access body + map
- [x] Buddies lock hint; **host hub on `/activity/:id`** (`ActivityDetailHostBuddiesHub` + `getHostActivityJoinRequests`); manage sheet remains secondary embed
- [x] Transport **reach-by** block always on Transport tab (`activityDetailReachBy.ts`); linked ride + empty encouragement
- [x] Welcome sheet (group chat + Place)
- [x] Tab-scoped sticky footer **intent** (`activityDetailTabFooters.ts` → directions / invite / view ride / join); participant shortcuts via `ActivityDetailMobileFooter`
- [x] Peek ↔ detail Plan footer parity helper (`activityEngagementCtas.ts` + tests); tab-scoped footers stay in `activityDetailTabFooters.ts`
- [x] Tab-scoped sticky footers wired (`plan_host_share`, `transport_empty`, directions, invite, view ride) — host no longer bypasses tab intent via global `HostActivityCtas` on mobile tabs
- [x] Mobile hero status strip (join state + spots); Plan Start/End grid hidden on mobile when tabs on
- [x] §9 footer-kind resolver (`resolveActivityDetailEngagement.ts`) — peek + detail tabs; tab panel modules under `detail/tabs/*` (Plan about, extras, place, transport, buddies)
- [x] Tab-scoped sticky footer render module (`ActivityDetailStickyFooter.tsx`) — kinds from `resolveActivityDetailEngagementFooterKind`
- [x] `ActivityPresentationDTO` on `GET /activities/:id` (wire); [x] FE consumes full `presentation` (tabs + `footerByTab`) — **AD-PRES-02** in program doc
- [x] Single pricing mode per activity (free / shared / paid) — no tiered packages; indicative amounts only; external signup parked

#### AD-4 — Peek parity

- [x] Three strips (facts in peek meta; **Going** + **Rides & spots** in `ExploreActivityPeekStrips`)
- [x] Product spec captured — program **§6.2** (states A–E, profile, host manage, rideshare); **§6.7** implementation order
- [x] **One brain:** L1 drives peek + detail actions; host peek via wire ids (**AD-PEEK-02/03**)
- [x] Matrix parity guest / joined / host states (**AD-PEEK-04**, **AD-CTA-01**)
- [x] Pro-gated `message_host` on wire (entitlements merge); peek host profile upsell partial

#### AD-5 — Pro entitlements

- [x] `ActivityViewerEntitlementsDTO` + `applyActivityViewEntitlements` (detail + explore map)
- [x] Roster mask + host profile gates on **detail**
- [x] Roster mask on **peek** people strip (**AD-PRO-01**)
- [x] Dev Pro: `UAETRAIL_CONSUMER_PRO_DEV=1` (until billing SKU)
- [x] Transport offer/add UI gated on `canOfferTransport` / `canAddLinkedRide` (surface-level polish)
- [x] Pro upsell links on locked host/roster (detail + explore people row)

#### AD-6 — Chat policy + share

- [x] `groupChatPostPolicy` on activity wire + sync to crew group wall (POST enforce via existing wall policy)
- [x] Host Buddies / manage sheet — `ActivityCrewChatPostPolicyCard` → `PATCH /host/activities/:id`
- [x] Share / OG — `activityPublicMetaDescription` + JSON-LD region-only location (no meeting in schema)
- [x] Organize wizard field for `groupChatPostPolicy` on create (optional)

#### AD-7 — Dedupe + convergence

- [x] Grep: no `HostActivityDetailView`, no `activityMapPeekActions.ts` re-export
- [x] Single L1 engagement owner; remove host peek bypass (**AD-DEDUPE-01**)
- [x] `verify:system:quick` green with Phase 4–5 matrix tests (**AD-CTA-01**)

#### AD-8 — Reviews UX

- [x] Post check-in review CTAs on Plan/Buddies (participant ↔ host/place; host ↔ participant)

**Gate per AD phase:** `npm run verify:system:quick` minimum; full `verify:system` before AD-7 close.

**Cross-track:** §22 **NA-*** runs in parallel — NA-1–NA-4 should complete **before** AD-7; NA-5+ optional after AD-8.

---

## 22. Viewer access naming & wire-first alignment (NA-*)

**Tier-1:** [`DOMAIN_CANONICALS.md`](../DOMAIN_CANONICALS.md) §15.10–§15.11 · [`SYSTEM_COHERENCE.md`](../SYSTEM_COHERENCE.md) **S7c** · rule `.cursor/rules/viewer-access.mdc`.

**Goal:** Policy stays on **`GET /activities/:id`** / **`GET /explore/map`** `viewerAccess` (+ `entitlements`, `mapPeekActions`). React only **maps wire → UI**; no second matrices, no sentence-long `CanView*` helpers.

### NA-0 — Audit inventory (locked 2026-10-11)

| ID | Symbol / area | Layer | Verdict | Phase |
|----|----------------|-------|---------|-------|
| A1 | `GET /activities/:id` → `viewerAccess` | HTTP | **Canonical** | — |
| A2 | `GET /explore/map` enrich → `viewerAccess.mapPeekActions` | HTTP | **Canonical** | NA-4 (mandatory wire) |
| A3 | `GET /me/host-status` → `HostStatusDTO` | HTTP | **Canonical** — capabilities only | — |
| A4 | `resolveActivityViewerAccess` | API social | **Keep** (documented §15); optional rename NA-6 | NA-6 |
| A5 | `composeActivityViewerAccess` → `applyActivityViewEntitlements` | API pipeline | **Keep** | NA-2 (inline context load) |
| A6 | ~~`resolveActivityViewEntitlementContext`~~ | API glue | **Done (NA-2)** — `loadActivityViewEntitlementContext` private in composer | — |
| A7 | `computeActivityDetailExposure`, `computeActivityViewerEntitlements`, `computeActivityMapPeekActions` | shared-types | **Keep** (`compute*` = policy) | — |
| A8 | `activityViewerEntitlementsCanViewFullBuddyRoster` | shared-types | **Remove** — use `entitlements.canViewFullBuddyRoster` | NA-1 |
| A9 | `activityViewerLevelCanAccessCrewSurfaces` | shared-types | **OK** — used inside `computeActivityDetailExposure` only | — |
| A10 | `listActiveTenantMembershipsByUser` | store | **OK** — tenant data access, not viewer UX | out of scope |
| A11 | `resolveActivityPresentation` + crew `?? (isHostUser \|\| isConfirmedParticipant)` | FE | **Drift** — wire must own crew | NA-3 |
| A12 | `resolveActivityMapPeekActions` client `computeActivityMapPeekActions` fallback | FE | **Drift** when map always enriches | NA-4 |
| A13 | `privateActivityExploreItem` client `mapPeekActions` compute | FE | **Drift** — optimistic host publish only | NA-4 |
| A14 | `resolvePeekDetailAccess` + `mapViewerAccessToUi` | FE | **OK** — wire → link/guest kind | — |
| A15 | `resolveBrowsePoster*` / `resolveListFeed*` | FE | **OK** — copy/layout, not access policy | — |
| A16 | Duplicate `src/explore/activityMapPeekActions.ts` | FE | **Gone** — canonical `resolveActivityPresentation.ts`; keep tests only | AD-7 ✓ |

### NA phases (order; tick when exit criteria met)

#### NA-0 — Audit + Tier-1

- [x] Inventory table (above) + §15.11 + S7c
- [x] Handoff phrase includes §22

#### NA-1 — DTO-first UI (small)

- [x] Remove `activityViewerEntitlementsCanViewFullBuddyRoster` export; components use `viewerAccess.entitlements?.canViewFullBuddyRoster` (+ `canAccessCrewSurfaces`)
- [x] No new `activityViewerEntitlementsCan*` exports in `packages/shared-types`
- [x] Gate: `memberSurfacesAcceptance` NA-arch helper ban

#### NA-2 — API pipeline surface area

- [x] Move buddy/host entitlement **load** into `composeActivityViewerAccess` — removed `activity-view-entitlement-context.ts`
- [x] `GET /activities/:id` calls **one** composer with `{ hostUserId, participantUserIds }`

#### NA-3 — FE crew wire-only (closes AD-2 open item)

- [x] `resolveActivityPresentation`: `canAccessCrewSurfaces` from `viewerAccess` only (default `false`)
- [x] `ActivityDetail` / `ActivityDetailView` defaults — no `?? true` crew fallback
- [x] Gate: `memberSurfacesAcceptance` NA-2 / NA-3

#### NA-4 — Peek wire mandatory

- [x] Explore map enrich sets `mapPeekActions` (incl. entitlements merge on API)
- [x] FE `resolveActivityMapPeekActions`: use wire when `mapPeekActions` defined (incl. `[]`); compute only when wire missing
- [x] `hostPublishedActivityPeekAccess` includes wire peek actions; `privateActivityExploreItem` no client compute

#### NA-5 — Presentation module names (optional, larger)

- [x] Peek engagement → `activityPeekEngagement.ts`; detail → `activityDetailPresentation.ts` (shim `resolveActivityPresentation.ts`)
- [ ] Update CREATE_FLOW / NAVIGATION pointers once; no duplicate modules

#### NA-6 — API `resolve*` → `build*` / `get*` (optional, high churn)

- [x] `buildActivityViewerAccess` canonical; `resolveActivityViewerAccess` alias; `composeActivityViewerAccess` uses `build*`
- [ ] **Only** if team wants HTTP-shaped verbs everywhere — not required for product ship

**Gate per NA phase:** `npm run verify:system:quick`; NA-3/NA-4 require `activity-viewer-access.test.ts` + `explore-map-viewer-access.test.ts` green.

### Schedule vs §21 AD

| NA phase | Best paired with AD | Notes |
|----------|---------------------|--------|
| NA-1 | AD-5 polish | Roster/host gates already on wire |
| NA-2 | AD-5 / AD-6 | Before more entitlement fields |
| NA-3 | AD-2 checkbox | Same PR encouraged |
| NA-4 | AD-7 dedupe | With peek parity guards |
| NA-5–NA-6 | After AD-8 or parallel §20 | Rename-only; no product block |

---

## 20. Post-queue (after §19 — not blocking release)

| Priority | Item | Notes |
|----------|------|--------|
| P0 ops | Run [`SEEKING_STORAGE_RUNBOOK.md`](../operations/SEEKING_STORAGE_RUNBOOK.md) on **staging + prod** | `seeking:deploy-gate` before traffic |
| P0 QA | G-manage **browser** smoke on staging | Plan → Needs you → Hosted → manage sheet |
| P1 wire | Explore map: retire public `source: 'demand'` projection | **Done (wire)** — `activity` + `activityMode: seeking`; legacy `demand:` pin ids + `source: 'demand'` compat in parsers |
| P1 links | Seeking deep links prefer `pin=activity:{id}` | **Done** — `exploreSeekingMapItemPath` / `resolveSeekingExploreMapItemId`; API notifications + wishlist + FE share |
| P1 storage | Drop `participant_intents` writes entirely; archive collection | **Default stub write off** (opt-in `true` for rollback); collection archive after all envs backfilled |
| P1 cleanup | **Migration residue** (stub flag, demand pin compat, alias routes) | **After** runbook § “Residue cleanup” gates — see [`SEEKING_STORAGE_RUNBOOK.md`](../operations/SEEKING_STORAGE_RUNBOOK.md); no phase letters left in Tier-1 |
| P2 perf | Explore map bbox / light DTO; chat SSE multi-instance | Architecture backlog from coherence review |
| P2 UX | `plan-tab-ux-backlog.md` (upcoming carousel, goals polish) | Explicitly paused in §19 |

---

## 14. Progress log (fill in as you ship)

| Date | Phase | PR / notes |
|------|-------|------------|
| 2026-10-09 | — | Plan doc created; partial Phase 1 routes (`/plan`, my-trips split) on branch |
| 2026-10-09 | audit | §15–§17 coverage + anti-duplication pass |
| 2026-10-10 | 5 + 1 | Availability API + Plan Available lens; People browse; areas; `planCalendarMarkers` projection; calendar lens placeholder |
| 2026-10-10 | hygiene | PeopleBrowseTab canonical naming; ExploreBrowsePanel prop trim; Tier-1 NAVIGATION quota/tab copy |
| 2026-10-10 | 6.1 | Plan needs-you strip (`PlanNeedsYouStrip`) — §19 #1 |
| 2026-10-10 | 5.2b / §19 #2 | Plan Calendar lens UI |
| 2026-10-10 | §19 #3 | Plan suggested rail (`PlanSuggestedRail`, `planWishlistExploreMatches`) |
| 2026-10-10 | §19 #4 | **Skipped** cluster overlay — map **People pill → Available** already ships |
| 2026-10-10 | §19 #5 | Profile history routes + consumer trips naming guard |
| 2026-10-10 | Phase 6.1 / §19 #6 | M1 dual-write — Find → `activities` (`activityMode: seeking`) |
| 2026-10-10 | M1 backfill | `backfill-seeking-activities` script + `seekingActivityId` on intent DTO |
| 2026-10-10 | Phase 6.3 | Explore map: no legacy `demand:` merge; seeking `composeIntent` on activity rows |
| 2026-10-10 | Phase 7 | Consumer `/host/overview` links removed; notification `/plan` + `activity:` pins; bookmark redirects |
| 2026-10-10 | Phase 8.1 | §11 automated acceptance tests wired into `verify:domain` |
| 2026-10-10 | Phase 8 | Full `verify:system` + `memberSurfacesAcceptance.test.ts` in `verify:domain` |
| 2026-10-10 | 6.2 M2b–M2c | Activity-canonical seeking joins; intent routes alias `activity_requests` |
| 2026-10-10 | 7.2 | Profile pro entry + Plan host queue links (no consumer `/host/requests` in needs-you) |
| 2026-10-10 | §6.3 / §7.1 | Plan forward-only; chat inbox coordination-first |
| 2026-10-10 | §6.4 | `src/member-plan` + deprecated `src/trips` shims |
| 2026-10-10 | M2 guards | `participant-intent-m2-guards.test.ts` in `verify:domain` |
| 2026-10-10 | M2d | Activity-primary Find (`PARTICIPANT_INTENT_STUB_WRITE=false`); `participant-intent-activity-readthrough.ts` |
| 2026-10-10 | §7.2–7.3 | Badges/contributions inventory + NAVIGATION drift fix; API_ROUTING consumer vs `/host` |
| 2026-10-10 | G-manage | Automated guards + PRE_DEPLOY staging step; §6.1 Needs-you ≠ seeking |
| 2026-10-10 | API hygiene | `coordination-attention`, `profile-stats`, `GET /me/journey-map`; surface route guards |
| 2026-10-10 | §19 #11 tooling | `seeking-m2d-status`, local backfill, roster `seekingOnMap`, removed `src/trips` shims |
| 2026-10-10 | Coordination perf | Buddy + activity-invite **counts** on `coordination-attention` |
| 2026-10-10 | §19 #12 API | `g-manage-coordination-join-approve.test.ts`; PRE_DEPLOY staging ops ordered steps |
| 2026-10-10 | §19 close | Queue complete; `SEEKING_M2D_RUNBOOK.md`; §20 post-queue (demand wire, ops) |
| 2026-10-10 | §20 P1 | Map wire `activity` + `activityMode: seeking`; `exploreSeekingMapItemPath` (API/FE/notifications/wishlist) |
| 2026-10-10 | §20 ops | Root `seeking:m2d-status` forwards `--strict`; plan-tab backlog reconciled with §19 |
| 2026-10-10 | §2.1 wire | `seekingOnMap` in People browse → `exploreMapItemPathFromSeekingRow` (peek path; no duplicate UI) |
| 2026-10-10 | P1 storage | `PARTICIPANT_INTENT_STUB_WRITE` defaults **off** (opt-in dual-write); API `.env.example` + contract test |
| 2026-10-10 | Local test | `test:seeking-local` (store + **POST /me/participant-intents** + map projection); DEV_RUN Find + G-manage API notes |
| 2026-10-11 | §21 AD-0 | Tier-1 alignment (NAVIGATION, CREATE_FLOW, DOMAIN §15, MEMBER_MODEL, COMMUNICATION, S7b); Transport always; removed `HostActivityDetailView` + peek re-export shim; AD-arch guards |
| 2026-10-11 | §21 AD-4 | Peek strips + `computeActivityMapPeekActions` parity (crew chat for joiners; no pre-join `message_host`); `filterActivityMapPeekActionsForViewer` |
| 2026-10-11 | §21 AD-5 | Pro entitlements on detail + explore map; `ActivityViewerEntitlementsDTO` |
| 2026-10-11 | §22 NA-0 | Viewer-access naming audit + §15.11 + S7c; phased NA-1–NA-6 |
| 2026-10-11 | §22 NA-1 | Dropped `activityViewerEntitlementsCanViewFullBuddyRoster`; detail roster uses wire `canViewFullBuddyRoster` |
| 2026-10-11 | §22 NA-2–NA-3 | Entitlement buddy load inside `composeActivityViewerAccess`; crew surfaces wire-only on detail |
| 2026-10-11 | §22 NA-4 | Peek actions wire-first; optimistic host publish includes `mapPeekActions` |
| 2026-10-11 | §21 AD-6 (partial) | `groupChatPostPolicy` on activity + crew group wall sync |
| 2026-10-11 | §21 AD-6 | Host `ActivityCrewChatPostPolicyCard`; public OG/JSON-LD without meeting |
| 2026-10-11 | §21 AD-8 | Post check-in review CTAs (Plan/Buddies); host roster link |
| 2026-10-11 | §21 AD-5/AD-6 | Transport entitlement gates; organize wizard `groupChatPostPolicy`; API create persists policy |
| 2026-10-11 | §20 local | Backfill seeking activities (4 created); strict gate includes backfill completeness |
| 2026-10-11 | §20 ops | `cancel-coordless-participant-intents` for intents backfill cannot migrate |
| 2026-10-11 | §21 AD-3/5 | Footer `message_host` parity; Pro upsell on locked host/roster; NA-5 peek module split |
| 2026-10-11 | §21 AD-3 v3.2 | Host Buddies hub on detail; Plan transport teaser; Place lock; Transport reach-by; tab footer resolver + tests |
| 2026-10-11 | §23 P1 / §3.2 | Map pin hosted/seeking corner badges; `activityEngagementCtas` peek↔detail Plan footer parity |
| 2026-10-11 | §23 P1 / §3.3 | Area-first explore search hints; Hosted/Seeking/All activity mode filter on map list |
| 2026-10-11 | §3.5 / §4 | Area hub previews (`GET /areas/:slug` preview + `AreaHubPreviewSections`) |
| 2026-10-11 | §4 Find | Seeking create requires explicit `areaId` when map pin; review picker in `CreateDemandFlow` |
| 2026-10-11 | §4 | Explicit organize publish area + Tier-1 geography contract |
| 2026-10-11 | §22 NA-5/6 | `activityDetailPresentation.ts`; API `buildActivityViewerAccess`; Tier-1 + S7b/S7c closed |
| 2026-10-11 | §20 tooling | Root `seeking:deploy-gate` alias; plan §2/M3 reconciled with Phases 4–5 |
| 2026-10-12 | §4.3–4.6 | Locations lens, area-match notifications, 12-area catalog + seed sync, admin areas UI, Phase E test fixtures |
| 2026-10-12 | §21 AD-8 | Dynamic peek/detail CTA matrix locked in activity-detail program **§6.2–§6.7**; Tier-1 pointers (NAVIGATION, CREATE_FLOW, DOMAIN §15.4) |
| 2026-10-15 | §21 AD-9 | Activity-detail **Phase 9** — kind page templates (`ActivityDetailByKind`, `*PlaceDetailPage`); fold/body IA ◐ — see activity-detail program §2.1 + §9 remove list |
| | | **Next:** AD-FOLD-01 / AD-BODY-01 close in activity-detail program; §23 P0 ops per env |

---

## 23. Post–§22 closure (ops + polish — not blocking local dev)

**Member-surfaces program (§19–§22):** engineering **complete**. Remaining work is **environment ops**, **doc drift hygiene**, and **explore polish** — not another AD/NA phase.

### P0 — per environment (staging → prod)

**Engineering is shipped** (`seeking-storage-ops.ts`, backfill scripts, default stub write off). **Do not re-implement** — run the checklist on each database only. Canonical steps: [`SEEKING_STORAGE_RUNBOOK.md`](../operations/SEEKING_STORAGE_RUNBOOK.md).

| Step | Command / action |
|------|------------------|
| Readiness | `npm run seeking:storage-status` |
| Backfill | `npm --workspace @uaetrail/api run backfill-seeking-activities` |
| Coord-less orphans | `cancel-coordless-participant-intents` if needed ([`SEEKING_STORAGE_RUNBOOK.md`](../operations/SEEKING_STORAGE_RUNBOOK.md)) |
| **Gate** | `npm run seeking:deploy-gate` (exit **0**) |
| Stub write | `PARTICIPANT_INTENT_STUB_WRITE=false`; restart API |
| UI smoke | G-manage: Plan → Needs you → Hosted → manage → approve ([`PRE_DEPLOY_CHECKLIST.md`](../PRE_DEPLOY_CHECKLIST.md)) |

### P1 — product polish (pick from §2–§3 open items)

- [x] Map pin **Hosted vs Seeking** badge/iconography (§3.2; cards/peek already mode-aware)
- [x] Explore search **Area** card first for “Hatta” (§3.3; `ExploreSearchAreaHints` + `/area/:slug`)
- [x] Organize publish **area** on review step (§4 — required pick; catalog pre-fill)
- [x] `activityTypes.ts` **rideshare** vs wire `ScheduledActivityType` alignment (§2.1 — picker stays hiking/camping/event)
- [x] Hosted \| Seeking \| All chip on Activities layer (`?activityMode=`, `ExploreActivityModePillsRow`)

### P2 — migration residue (after 30-day gate)

See [`SEEKING_STORAGE_RUNBOOK.md`](../operations/SEEKING_STORAGE_RUNBOOK.md) § Residue cleanup — stub flag removal, `demand:` compat, rename legacy test identifiers.

---

## 15. Coverage audit — progressive agreements (last ~15 turns)

Use this table to confirm nothing was lost. **Status:** C = captured in checklist · P = partial · G = gap closed in this audit.

| # | Agreement | Where in doc | Status |
|---|-----------|--------------|--------|
| 1 | Plan vs Profile vs history — Plan forward; past on Profile | §1.1, §6.3, D3 | C |
| 2 | Plan = manage + create goals/wishlist (not read-only Profile) | D10, §6 | C |
| 3 | Plan lenses Schedule / Saved / Goals (+ availability placement TBD) | §6.1 | C |
| 4 | No Social tab; availability + People on Explore | D1, D7, D11, §3.1 | C |
| 5 | No `/host` consumer shell; host = capability | D2, D12, §7.3 | C |
| 6 | shop/guide/agency = catalog projections | D4, §1.2 | C |
| 7 | Retire **trips** naming (arch + UI) | D3, §6.4, Phase 1 | C |
| 8 | Region → Area → Place → Activity | D5, §2.3, §4, Phase 4 | C |
| 9 | areaId explicit on organize/find + admin place link | §4, Phase 4 | C |
| 10 | Activity kind + Place kind + **OutingTopic** for “hiking” unified filter | §2.5, Phase 2, G-topic | C |
| 11 | **Seeking merged into Activity** (no demand map species) | D6, D9, §8 M0–M2, Phase 3 | C |
| 12 | **Availability** separate; multi-day calendar; map People pill + Available tab (no cluster overlay) | D7, D14, §5, Phase 5 | C |
| 13 | Find FAB → seeking **activity** (not parallel “demand” UX) | D9, §3.4 | C |
| 14 | Chat coordination-first; not chat-app discovery | §7.1, §12 non-goals | C |
| 15 | Notifications → entity/thread not hub URLs | §1.3, Phase 7.3 | C |
| 16 | Member **13 questions** mapped to surfaces | §16 table below | G |
| 17 | Needs-you / suggested Plan UX (later) | §6.1 bullets | G |
| 18 | Guest bottom nav policy | §7.2 | G |
| 19 | Explore **one mode indicator** (map/list/browse/people) — reduce chrome clutter | §17 OD-1 | G |
| 20 | Desktop browse right panel / earlier explore IA | **Out of scope** — see §17 | G |
| 21 | `rideshare` / `ACTIVITY_TYPES` alignment | §2.1 | C |
| 22 | Facilities on Area page (toilet, shop near Hatta) | §2.2, §3.5 | C |
| 23 | Buddy **Join me** / discovery quota (`WHOS_GOING_UX`) — **not** same as availability | §16 anti-dup #5 | G |
| 24 | Implementation master checklist doc | this file, experiment README | C |

---

## 16. User questions → single owner (no duplicate surfaces)

| User question | Primary owner | Do **not** duplicate on |
|---------------|---------------|-------------------------|
| Hosted activities this week | Explore (topic + when) + Area | Plan (except *my* rows on schedule) |
| Post what I want (seeking) | Explore FAB Find → Activity `seeking` | Separate “looking for” pill or demand source |
| Venues + self-plan + invite | Explore Places + Organize + activity invite | — |
| Connections’ outings | Explore People/filters + buddies graph | Social tab |
| Profile visibility | Profile settings + public `/member/:id` | Plan |
| Host manage participants | Plan schedule (organizing) + `/activity/:id` | `/host` for buddies |
| Signed up / arranged / goals / saved | Plan lenses | Profile full lists |
| Communicate | Chat | Plan, Explore |
| Roster + check-in | Activity detail + manage sheet | Host console (buddy) |
| Rate experiences | Profile contributions/reviews | Plan |
| Badges / share | Profile badges | Plan |
| Contribute places/shops | Explore FAB Add + Profile contributions | — |
| Account / memberships | Profile settings + pro + **shop/manage** | `/host` |

---

## 17. Anti-duplication & conflict rules (read before every PR)

| # | Rule | Violation to avoid |
|---|------|-------------------|
| 1 | **One time-bound map entity:** Activity (`hosted` \| `seeking`). | Keeping `pinKind=looking` or `source: demand` in UI after Phase 3. |
| 2 | **One availability model:** `member_availability` slots only. | “Available” boolean on profile without slots; duplicating as Activity. |
| 3 | **One wishlist store:** engagement API; Plan `saved` lens = primary editor. | Full wishlist UI on Profile **and** Plan. |
| 4 | **One join path per seeking post:** migrate intent requests → activity-scoped requests (Phase 6). | Permanent parallel `participant_intent_requests` + `activity_requests` for same UX. |
| 5 | **Join me / map buddy discovery** ([`WHOS_GOING_UX.md`](./WHOS_GOING_UX.md)) = roster/quota **on activity** & explore people browse. | Re-implementing as availability slots. |
| 6 | **Area** = curated `areas` + `areaId`; `areaLabel` string is display fallback only. | Third “area” concept in filters. |
| 7 | **Topic filter** = one `OutingTopic` matcher for activities, places, people query. | Separate hiking filters per layer that drift. |
| 8 | **Business ops** = shop/agency/guide **manage** URLs. | New consumer `/host` links; renaming `/host` to `/organize` as a **shell**. |
| 9 | **Phase 3 = §8 M0** only once. | Second “projection” project. |
| 10 | **M1 dual-write** before removing intent collection reads. | Big-bang cutover without backfill. |

### Open decisions (document when chosen; not blocking Phase 0–2)

| ID | Decision | Options |
|----|----------|---------|
| OD-1 | Explore chrome: single visible **mode** (map / list / browse / people) | One title vs pills (experiment UX) |
| OD-2 | Plan tab label | **Plan** vs **Home** / **This week** |
| OD-3 | Availability UI | **Chosen:** dedicated `?lens=availability` (2026-10-10). Calendar month UI is separate lens, not schedule block. |
| OD-4 | Business workspace route branding | Keep `/host/*` server routes with redirects vs rename to `/studio` |
| OD-5 | `src/trips` rename | `member-plan` vs `commitments` |

### Explicitly out of scope (this program)

- Replacing prior **desktop browse right-panel** / `list=1` vs `browse=1` work — already shipped; only align **topic/layer** vocabulary (Phase 2).
- **Marketing `/`** guest funnel — [`LANDING.md`](../LANDING.md) unchanged except cross-links.

---

## 18. Review checklist (run before marking program “aligned”)

- [ ] Every row in §15 marked C (or consciously deferred in §17 OD-*)
- [ ] No checklist item contradicts §17 anti-duplication table
- [ ] Tier-1 docs updated per §10 for last completed phase
- [ ] `npm run verify:system` + explore alignment tests green
- [ ] Grep: no new consumer `trips` hub strings; no new `/host` links in `src/` (consumer)
