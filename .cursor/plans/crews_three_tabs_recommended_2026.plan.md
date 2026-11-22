# Find crew — three tabs (People · Professional · Community) + Recommended

**Program:** extends `MIG-PEOPLE-VOCAB-2026` (phase **P5d**)  
**Owner:** product-eng · **Bounded context:** `member_discovery` (+ `tenant` reads for Professional)  
**North star:** Crews is the third Explore triad leg — **list search first** (parity with Activities · Places), not a map-only social overlay. Participation surfaces stay **My crew** (`/crews`, `/groups`).

**Locked UX (user-approved 2026-11-22):**

| Layer | Behavior |
|-------|----------|
| **Crews map pill** | Opens **list discovery** (`/list?listCat=people` mobile; desktop → `/explore?list=1&view=people` drawer or navigate to `/list` — same as Activities/Venues list handoff). Retire desktop-only `crewsBrowseOpen` map overlay as primary. |
| **Top tabs (3)** | **People** (default) · **Professional** · **Community** |
| **People default** | **Recommended** facet + optional **pills** (Friends going · Available · Everyone) — not peer top-level tabs |
| **Fixed intents** | Always on **Activities map** pins **and** in People → **Available** (open/marked sub-lenses unchanged) |
| **Professional** | Guides + porters (member directory) **and** agencies / tour operators (`listCat=agencies` inventory) in one tab, two card contracts |
| **Community** | Discover clubs; join → **My crew**; **Teams** (`/groups`) never listed here |
| **Remove** | `hub` segment, `CrewsHubHome`, `buddies` → hub default |

---

## 1. Mental model vs surfaces

```text
EXPLORE TRIAD
  Activities map  ── pins: outings + fixed intent catalog (unchanged)
  Places map      ── venues
  Crews pill      ── LIST SEARCH (/list listCat=people)

CREWS LIST — peopleTab (canonical)
  people          ── Recommended + pills → legacy data lanes below
  professional    ── member pros + operator/agency businesses
  community       ── MIG-COMMUNITY-DISCOVER (feature gate until API)

MY CREW (/crews, /groups)
  friends · joined communities · private teams · Plan · Chat
```

**Truth order:** `packages/shared-types` · guards · `src/crew-discovery/*` · `src/list/crews/*` · minimal Tier-1 (`NAVIGATION.md` § Browse — people & crew, `MEMBER_MODEL.md` people browse table).

---

## 2. URL wire (canonical emit, inbound-only aliases)

### 2.1 Top tab — keep `peopleTab` param name (wire lexicon stability)

| Canonical `peopleTab` | UI label | Notes |
|----------------------|----------|--------|
| `people` | People | **Default** — omit from URL |
| `professional` | Professional | Replaces separate agencies-only list entry from Crews chrome |
| `community` | Community | Hidden/disabled until `MIG-COMMUNITY-DISCOVER` |

**Inbound-only** (parse in `productUrlInbound.mapInboundCrewBrowseTabValue`, never emit):

| Legacy value | Maps to |
|--------------|---------|
| `hub`, `buddies` | `people` + facet `recommended` |
| `available`, `discover`, `looking` | `people` + facet `available` |
| `going`, `friends`, `followed` | `people` + facet `friends` |
| `connect`, `all`, `trips` (goingTab) | `people` + facet `everyone` |
| `agencies`, `operators`, `guides` | `professional` (+ optional `proKind`) |

### 2.2 People facet — new param `peopleFacet`

| Canonical | UI | Default |
|-----------|-----|---------|
| `recommended` | Recommended | **Yes** (omit param) |
| `friends` | Friends going | |
| `available` | Available | Sub-lenses: existing `open=` (`all` \| `open` \| `marked`) |
| `everyone` | Everyone | Directory + quota |

Serialize: `peopleFacet` omitted when `recommended` and `peopleTab=people` (or both omitted).

### 2.3 Professional sub-filter — optional `proKind`

`guide` \| `porter` \| `agency` \| omit = all.

### 2.4 List category handoff

- Crews pill → `listCat=people` always for People + Community lanes.
- Professional may set `listCat=agencies` when showing **only** business rows (deep links) OR stay on `listCat=people` with `peopleTab=professional` and mixed feed — **ship mixed on `listCat=people` first**; agencies-only URLs still work via existing `listCat=agencies`.

### 2.5 Explore sync

- Mobile: `view=people` + `list=1` → full `/list` (existing).
- Desktop Crews pill: prefer **`listDiscoveryPathFromExploreSearch`** → `/list` or `explore?list=1&view=people` drawer (match Activities list toggle).
- Stop writing `crewsBrowseOpen: true` as default open path (deprecate overlay; keep parse for one release if needed).

---

## 3. TypeScript spine (single source)

**Replace** flat `CrewBrowseTab = 'hub' | available | going | connect` with:

```ts
export type CrewBrowseLane = 'people' | 'professional' | 'community';
export type CrewPeopleFacet = 'recommended' | 'friends' | 'available' | 'everyone';
export type CrewProfessionalKind = 'all' | 'guide' | 'porter' | 'agency';
```

**Resolver** `resolveCrewBrowseState(params) → { lane, peopleFacet, proKind, openLens }` in `src/crew-discovery/crewBrowseState.ts` (new).

**Internal data hooks** keep existing fetch keys:

| Facet / lane | Existing hook / API |
|--------------|---------------------|
| `recommended` | **New** client combiner (ordered merge; see §4) |
| `friends` | `going` tab → roster going |
| `available` | availability + catalog items |
| `everyone` | `connect` → directory |
| `professional` | `filterCrewsGuideDirectoryCards` + agencies list query (reuse list agencies model) |
| `community` | stub empty state + `MIG-COMMUNITY-DISCOVER` flag |

**Delete:** `CrewsHubHome.tsx`, `hub` branch in `CrewsTabBody`, `crewsShowsGuidesRail(hub)`, `listPeopleDiscoveryPath` default `crewBrowseTab: 'hub'`.

---

## 4. Recommended algorithm (v1 — client-only)

Signed-in merge (cap each slice, de-dupe by user/id):

1. Friends with outings soon (`friendsGoing`, date filter aware)  
2. Available members in geo/filter context (`availabilityPeople`)  
3. Fixed/open catalog items in bbox (`availabilityCatalogItems` / map catalog)  
4. Directory teaser (max 3, quota-aware)  

Guest: public map signals + sign-in gates on marked/everyone (current behavior).

No new API in v1 — guard with unit test on ordering/dedupe pure function `buildRecommendedCrewFeed.ts`.

---

## 5. UI composition

### 5.1 Chrome

| Surface | Component changes |
|---------|-------------------|
| Map panel (if retained short-term) | `CrewBrowsePanelTabs` → 3 lanes |
| List header | `ListCrewsExplorerHeader` + `CrewsStatsTabs` → lane tabs + **People facet pills** (horizontal scroll) |
| Body | `CrewsTabBody` routes by `lane`; People uses facet to pick `CrewBrowseTabContent` inner tab or Recommended list |

### 5.2 Professional tab

- Section A: member cards (guide/porter) — existing directory filters + `CrewsGuidesRail` patterns, no “escape to hub” link.
- Section B: agency/operator rows — import list agencies card row from venues/agencies list module (read-only discover).
- Optional `proKind` chips.

### 5.3 Community tab

- Copy from `exploreCrewsCopy` + north star; empty CTA “Coming soon” or hide tab when `!features.communityDiscover`.
- Join CTA routes documented → `/crews` after API (no fake join).

### 5.4 Copy

- `exploreCrewsCopy.ts`: tab labels **People · Professional · Community**; facet **Recommended**; retire **Overview** / hub strings.
- `productNorthStar.ts` only if user-visible tab names need global consistency.

---

## 6. Map pill → list (parity PR)

**Files:** `useExploreBrowseUrlApplyHandlers.ts` (`openCrewsBrowsePanel`), `ExploreMapMobileLayerChrome`, `useExploreExperienceModel.ts`, `exploreBrowseUrlHydrate.ts`.

**Behavior:**

1. Guest: allow open → list with public slices (remove `if (!isSignedIn) return` or gate only protected facets).
2. Desktop: navigate/open list drawer with `view=people&list=1` + default lane/facet — **not** `crewsBrowseOpen` full-map replacement.
3. Mobile: keep `navigate(listDiscoveryPath({ listCat: 'people', crewBrowseLane: 'people', ... }))`.

---

## 7. Guards & manifest

| Guard | Change |
|-------|--------|
| `crewDiscoveryNamingGuard` | Forbid `hub` in `CREW_BROWSE_TAB_ORDER`; forbid `CrewsHubHome`; require `crewBrowseLane` vocabulary |
| `peopleVocabularyTouchpointsGuard` | Manifest `browseTabs`: `people`, `professional`, `community` |
| `crewPillarsAlignmentGuard` | communities pillar → Community lane |
| `peopleListBrowseUrl.test.ts` | New round-trips; hub → people |
| `browseListUrlState.test.ts` | Default `people` not `hub` |
| `memberSurfacesAcceptance.test.ts` | Update G-lang expectations |

**Manifest:** `scripts/people-vocabulary-touchpoints.json` phase `P5d-crews-three-tabs`.

---

## 8. Docs (minimal Tier-1)

- `docs/NAVIGATION.md` § Browse — people & crew: rewrite table (remove stale `looking` row); document 3 tabs + `peopleFacet`.
- `docs/MEMBER_MODEL.md`: people browse segment table align.
- Do **not** add new audit docs.

---

## 9. Implementation slices (merge order)

| PR | Scope | Verify |
|----|--------|--------|
| **PR-1 Wire** | `crewBrowseState.ts`, extend `productUrlInbound`, `browseListUrlState`, remove `hub` type | `peopleListBrowseUrl.test.ts`, `crewBrowseTab.test.ts` → rename |
| **PR-2 Shell** | Delete hub UI; default Recommended; update `listPeopleDiscoveryPath`, parsers | `typecheck:consumer-shell` |
| **PR-3 Tabs UI** | `CrewBrowsePanelTabs`, `ListCrewsExplorerHeader`, `CrewsStatsTabs` → lane + facet pills | visual QA |
| **PR-4 Recommended** | `buildRecommendedCrewFeed` + Recommended list component | unit test |
| **PR-5 Professional** | Unified tab body + agencies rows | list hygiene test |
| **PR-6 Map handoff** | Crews pill → list; deprecate `crewsBrowseOpen` primary | `exploreBrowseUrlHydrate.test.ts` |
| **PR-7 Community** | Feature-gated tab + copy | guards |
| **PR-8 Docs** | NAVIGATION + MEMBER_MODEL deltas | `verify:docs` |

**Gate before close:** `npm run verify:people-graph-plan` · `npm run verify:system:quick` · full `verify:system` when touching refactor-program close criteria.

---

## 10. Non-goals (this program)

- `MIG-COMMUNITY-DISCOVER` API implementation (UI shell only).
- Renaming `view=people` → `view=crews` (optional follow-up).
- `memberPeople*` / UPL hook renames (debt backlog).
- Changing Activities map fixed-intent registration (already shipped).

---

## 11. Risks

| Risk | Mitigation |
|------|------------|
| Desktop users expect map overlay | List drawer + map toggle (`ExploreMapProjectionToggle`) already on list |
| Broken bookmarks `peopleTab=going` | Inbound map → `peopleFacet=friends` |
| Agencies duplicate list | Professional tab reuses queries; no second catalog merge |
| `maxInProgressMigrations` | Keep `MIG-PEOPLE-VOCAB-2026` open; P5d is a phase inside it |

---

## 12. Acceptance checklist

- [x] Crews pill opens list search on mobile and desktop  
- [x] Default land: **People / Recommended**  
- [x] No `hub` segment in URL, UI, or types  
- [x] Fixed intents visible on activity map and under People → Available  
- [x] Professional shows guides/porters + agencies  
- [x] Community tab gated; Teams not in discover  
- [x] Guards green; Tier-1 nav table matches code  