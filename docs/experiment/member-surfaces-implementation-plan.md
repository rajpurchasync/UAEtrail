# Member surfaces — implementation plan (master checklist)

**Status:** Approved direction · **§19 eng complete** · **§20** ops + storage/UX remain  
**Last updated:** 2026-10-10 (§20 P1 wire, progress log §14)  
**Audience:** Eng + product — use this so context is not lost across PRs.

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
| D4 | **Catalog projections:** `/activity`, places, `/shop`, `/guide`, `/agency` — same detail pattern; not a separate host app. |
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
| `/profile/wishlist` | Plan `?lens=saved` or equivalent |
| `ExploreMapSource: demand` (wire) | Project as `activity` + `activityMode: seeking` until M2; then remove enum value |

### 1.6 Already on branch (do not redo)

- [x] `PLAN_PATH` `/plan`, legacy `/trips` → Plan or Profile history (`legacyTripsRedirect.ts`)
- [x] `MY_TRIPS_PATH` history/map split from Plan (rename to `PROFILE_HISTORY_*` still open)
- [x] Explore pin label **Activities** (wire key `trips` rename still open — Phase 2.3)
- [x] Bottom nav **Plan** label; middle tab routes to `/plan`
- [x] Plan **lenses** shell — Schedule · Calendar (placeholder) · Available · Saved · Goals (`src/plan/planLens.ts`, `Activities.tsx`)

---

## 2. Domain model checklist

### 2.1 Activity (unified time-bound)

- [x] Add `activityMode: 'hosted' | 'seeking'` to domain schema (Zod + Mongo + `ActivityDTO`)
- [x] Document in `DOMAIN.md` — seeking = former participant intent / “looking for”
- [x] Map **all** time-bound pins to `ExploreMapSource: 'activity'` on API build (§20 P1 wire); legacy `demand` enum + `pin=demand:` parsers until compat aged out
- [x] Seeking discovery UX — map/list/peek cards + `seekingOnMap` People browse rows route to explore pin (`exploreMapItemPathFromSeekingRow`); no duplicate seeking detail UI
- [ ] `/activity/:id` for seeking — secondary deep link only; keep join aligned with `explore-presentation` / `activityJoinCtaLabel` (no parallel layout)
- [x] Join requests: unify or alias `participant_intent_requests` → activity-scoped requests (M2a–M2c)

**Kinds (unchanged wire, aligned names):**

- [ ] `activityType`: hiking, camping, event, rideshare (+ generic “activity” organize)
- [ ] Align `src/config/activityTypes.ts` with rideshare on wire
- [ ] `ParticipantIntentKind` values map into `activityType` + `seeking` mode (incl. guide → policy in MEMBER_MODEL)

### 2.2 Place

- [ ] Keep **one** entity `locations` / Place; kinds in `PlaceKind` (`place-kind.ts`)
- [ ] Add `areaId?: ObjectId` on place rows
- [ ] Facilities (toilet, parking, …) = PlaceKind — surfaced on **Area** page, not mixed into topic=hiking unless grouped

### 2.3 Area (new)

- [ ] Collection `areas` (or documented equivalent) with slug, name, region, bounds, center, status
- [ ] Admin CRUD + seed (Hatta, Jais, …)
- [ ] `GET /areas/:slug` public card
- [ ] `place.areaId` + `activity.areaId` (new field)
- [ ] Point-in-polygon (+ place.areaId precedence) on publish — §4

### 2.4 Availability (new)

- [ ] Collection `member_availability` (or `availability_slots`) — see §5
- [ ] **Not** an Activity; **not** merged with seeking posts
- [ ] Visibility: public | buddies | hidden (MEMBER_MODEL)

### 2.5 OutingTopic (browse projection)

- [ ] Add `OutingTopic` + helpers: `topicFromActivity`, `topicFromPlaceKind`, `topicFromAvailabilityKind`
- [ ] Single matcher used by explore map/list (`explore-map.ts`, `exploreMapPinModel.ts`)
- [ ] Retire separate “Looking for” pill — use Activities layer + optional chip Hosted | Seeking | All

---

## 3. Explore — implementation checklist

### 3.1 Layers (URL + chrome)

- [ ] **Topic** row: hiking, camping, rideshare, events, shops, … (`explore-browse-ia.md` updated)
- [ ] **Layer** row: Activities (hosted+seeking) | Places | Shops | **People** (availability)
- [ ] Remove `pinKind=looking` / **Looking for** pill (`explorePinKindFilter.ts` — rename wire `trips` → `activities` when safe)
- [ ] `?area=:slug` constrains bbox + membership
- [ ] When / date presets apply to activities; availability uses date range on People

### 3.2 Map pins

- [ ] Activity pins: badge **Seeking** vs **Hosted** (iconography)
- [x] Map **People pill** → **Available** tab (`ExploreMapPeopleBrowseButton`, `PeopleBrowsePanel`) — **shipped**; supersedes area-cluster overlay idea
- [x] ~~Separate **area cluster** pins on map canvas~~ — **not needed** (2026-10-10); pill + panel already covers discovery

### 3.3 Search

- [ ] Query “Hatta” → **Area** card first → `/area/:slug`
- [ ] Topic + area + when returns activities (both modes), places, people index

### 3.4 FAB

- [ ] Organize → Activity `hosted`
- [ ] Find → Activity `seeking` (same wizard UX; new write path when storage merged)
- [ ] Add → Place contribute (unchanged)

### 3.5 Area detail page

- [ ] Route `/area/:slug`
- [ ] Sections: map strip, **activities** (hosted+seeking), places by kind, shops/operators, **available people** (week filter)
- [ ] CTAs: FAB with `areaId` prefill

---

## 4. Area resolution on create (checklist)

- [ ] On activity publish (`hosted` and `seeking`): compute `areaId` from (1) `registryPlaceId` → place.areaId, (2) else point-in-polygon on anchor lat/lng
- [ ] Tie-break: smallest area by area km² or admin `priority`
- [ ] Review step shows “Area: {name}” with override picker (published areas list)
- [ ] Persist `activity.areaId`; keep `region` emirate
- [ ] Demand migration: same for legacy intents → activities
- [ ] Availability: user selects `areaId` (+ region fallback); no required GPS home pin

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

- [x] `schedule` — joining, organizing, **seeking** (`SelfPlansSection`), **needs-you** (`PlanNeedsYouStrip`)
- [x] `saved` — wishlist list shell (`PlanSavedSection`); heart on Explore → same API
- [x] `goals` — full CRUD on Goals lens (moved off schedule default)
- [x] `availability` — **dedicated lens** (`?lens=availability`, `PlanAvailabilitySection`) — **OD-3 locked** (see §19)
- [x] `calendar` — month grid + day sheet (`PlanCalendarSection`, `planCalendarMarkers.ts`)
- [x] **Needs-you** strip atop `schedule` — actionable coordination only (`PlanNeedsYouStrip`, `buildPlanNeedsYouRows`). **Not** “looking for” / seeking — see **Seeking** (`SelfPlansSection`) + Explore Find.

**API:** `GET /me/coordination-attention` → `{ items: MemberCoordinationAttentionItemDTO[] }` (`kind`, `count`, optional `activityId` / `inviterDisplayName`). Kinds: `host_join_queue`, `joiner_pending_host`, `buddy_request_incoming`, `activity_join_invite`, `join_request_withdrawn`, `participant_revoked`, `join_request_rejected`. Copy + routes: `src/member/coordinationAttentionPresentation.ts` (not API `label`/`path`).
- [x] **Suggested** rail (wishlist ↔ explore map match; links out, no embedded map) — `PlanSuggestedRail` + `planWishlistExploreMatches` (§19 #3)

### 6.2 Manage outing (no /host)

- [x] Row tap → manage sheet on Plan (`HostedActivitiesSection` / `SelfPlansSection` + `ActivityManageSheet` / `ParticipantIntentManageSheet`)
- [x] Host join queue links → Plan hosted (`tripsPlansPath('hosted')`), not consumer `/host/requests`

### 6.3 Profile memory (not Plan)

- [x] Rename routes: `PROFILE_HISTORY_PATH`, `JOURNEY_MAP_PATH` (redirect from `my-trips`)
- [x] Past activities on Profile only — `/plan` redirects non-`view=plans` to history; Plan UI has no completed/past sections

### 6.4 Code moves

- [x] Rename `src/trips` → `src/member-plan` — **`src/trips` shims removed** (Oct 2026)
- [x] Remove `TripsMainTabs` from Plan; no “trips” UI strings (`verify` + grep) — Plan page uses `PlanLensTabs` only; `TripsMainTabs` remains on profile history / journey map

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

- [ ] `areas` + `areaId` on activities/places
- [ ] `member_availability` + explore people index

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
- [x] 4.2 `place.areaId` + admin link UI (API + `areaId` on admin place create/patch; visual picker TBD)
- [x] 4.3 `activity.areaId` + point-in-polygon on publish (seeking intents on create/update; organize review picker TBD)
- [x] 4.4 `/area/:slug` page + `?area=` explore filter
- [x] 4.5 Search boosts area entity (`areaSlug` in explore haystack; dedicated area search card TBD)

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
| G-area | Publish activity in Hatta bounds sets `areaId`; `/area/hatta` lists it |
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
| Plan page | `src/pages/Activities.tsx`, `src/member-plan/*` |
| Explore map | `apps/api/src/lib/explore-map.ts`, `src/explore/ui/exploreMapPinModel.ts` |
| Pin pills | `src/explore/explorePinKindFilter.ts`, `exploreBrowseTaxonomy.ts` |
| Find/demand | `src/explore/ui/demandFlow.ts`, `apps/api/src/lib/participant-intents-store.ts` |
| Compose | `src/explore/compose.ts` |
| Places/kinds | `packages/shared-types/src/place-kind.ts` |
| Legacy redirects | `src/member-plan/legacyTripsRedirect.ts`, `src/App.tsx` |
| Areas (new) | TBD `apps/api/src/routes/areas`, `src/pages/AreaDetail.tsx` |

**Handoff phrase:** “Continue **member-surfaces-implementation-plan** from **§20** (P0 ops, P1 storage, P2 UX, or §2.1 activity detail seeking).”

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
| 9 | ~~**§6.4 / §7.1 / §7.3 / §6.3**~~ **done** — `member-plan` rename, chat/groups, host guards, Plan forward-only | §6–7 | `hostMemberGuard`, `MessagesInboxList`, `Activities.tsx` |
| 10 | ~~**M2d**~~ **done** — `PARTICIPANT_INTENT_STUB_WRITE=false` after backfill | §8 M2 | `participant-intent-activity-readthrough.ts` |
| 11 | ~~**Ops tooling**~~ **done** — run `seeking:m2d-status` + backfill + `PARTICIPANT_INTENT_STUB_WRITE=false` **per env** (staging/prod) | §8 M1/M2d | `PRE_DEPLOY_CHECKLIST.md` |
| 12 | ~~**G-manage QA**~~ **done (eng)** — API `g-manage-coordination-join-approve.test.ts` + §11 guards; **staging UI** smoke in [`SEEKING_M2D_RUNBOOK.md`](../operations/SEEKING_M2D_RUNBOOK.md) | §6.1 | PRE_DEPLOY G-manage step |

**§19 queue:** **complete** for product engineering (2026-10-10). Remaining work is **ops per env** (#11 runbook) and optional **post-queue** (§20).

**Paused / explicit non-goals for now:** attention strip variants beyond needs-you (#1), goals projection polish, upcoming carousel (`plan-tab-ux-backlog.md`), **map cluster overlay** (#4 — pill path is enough).

---

## 20. Post-queue (after §19 — not blocking release)

| Priority | Item | Notes |
|----------|------|--------|
| P0 ops | Run [`SEEKING_M2D_RUNBOOK.md`](../operations/SEEKING_M2D_RUNBOOK.md) on **staging + prod** | `seeking:m2d-status --strict` before traffic |
| P0 QA | G-manage **browser** smoke on staging | Plan → Needs you → Hosted → manage sheet |
| P1 wire | Explore map: retire public `source: 'demand'` projection | **Done (wire)** — `activity` + `activityMode: seeking`; legacy `demand:` pin ids + `source: 'demand'` compat in parsers |
| P1 links | Seeking deep links prefer `pin=activity:{id}` | **Done** — `exploreSeekingMapItemPath` / `resolveSeekingExploreMapItemId`; API notifications + wishlist + FE share |
| P1 storage | Drop `participant_intents` writes entirely; archive collection | **Default stub write off** (opt-in `true` for rollback); collection archive after all envs backfilled |
| P1 cleanup | **Migration residue** (M2/M2d jargon, stub flag, demand pin compat, alias routes) | **After** runbook § “Residue cleanup” gates — see [`SEEKING_M2D_RUNBOOK.md`](../operations/SEEKING_M2D_RUNBOOK.md); no phase letters left in Tier-1 |
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
| | | **Next:** §20 P0 — staging/prod runbook + G-manage smoke; archive `participant_intents` after retention policy |

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
| 9 | areaId from pin on publish + admin areas | §4, Phase 4 | C |
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
