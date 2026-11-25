# Domain objects, canonical names & routing

**Purpose:** One vocabulary for **entities**, **wire/storage names**, **TypeScript symbols**, **public URLs**, and **HTTP paths**. Use this for naming and routing hygiene passes — not ad-hoc synonyms per PR.

**Related:** [`DOMAIN.md`](./DOMAIN.md) (glossary depth) · [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) (§ Naming vocabulary) · [`API_ROUTING.md`](./API_ROUTING.md) (HTTP) · [`NAVIGATION.md`](./NAVIGATION.md) (surface contract) · [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) (bounded contexts)

**Code entry:** `src/config/routingCatalog.ts` (paths — **import this in pages/components/utils**) · `src/config/platform.ts` (map config, feature flags, chrome helpers) · `packages/shared-types/src/entity-path.ts` (`EntityRef`)

**Checks:** `npm run verify:domain` · `npm run verify:routing-canon` (routing catalog vs `scripts/governance/routing-canonical-map.json`)

---

## 1. Canonical entities (product objects)

There are **five public entity kinds** on the wire (`EntityKind` / `EntityRef`):

| Kind | Product name | Mongo / wire | Never add |
|------|--------------|--------------|-----------|
| `place` | **Place** | `locations`, `LocationDTO` | Second “Venue” entity |
| `activity` | **Activity** (outing / plan) | `activities`, `ActivityDTO` | `Trip`, `TripDTO`, `Event` row |
| `organisation` | **Business storefront** (agency / partner tenant) — wire name `organisation`; see §1.5 | `tenants`, `/agency` · `/partner` | A second “organizer” entity table |
| `shop` | **Shop** (outdoor retail brand — profile only, no SKU catalog) | `merchant_profiles` + SHOP `tenants` | “Merchant”, “Partner” for shops |
| `person` | **Person** / member | `users` (profile fields) | “User” in consumer copy |

**Find crew** is not a sixth entity kind and **not** an Activity. Compose wire **`intent:*`** → **`member_availability`** (`PUT /me/availability`); map items use `source: availability`, pin `availability:{userId}:{slotId}`. **Hosting** remains compose **`activity:*`** → **`activities`**. **Joining a trip** is participation on one **hosted** `activityId` (`activity_requests` / RSVP) — distinct from posting availability. Retired: `activityMode: seeking` on activities, `/demand/:id`, `/me/seeking-posts`.

**Plan** (`/plan`) is the active member tab — **My Plans**: upcoming list or **calendar** (`layout=calendar` — joined, hosting, availability markers on the feed), wishlist + goals; **share availability** → explore **`compose=intent:open`** (`planAvailabilityPath()`). **Outing history** (`/profile/history`) is profile inventory. Wishlist: `tab=wishlist` / `planSheet=wishlist` (legacy `planAdd` parses). Operator schedule: **`/operator/overview`** — not a second `/hosting` page. Path helpers: `config/routingCatalog` + `src/plan/planRouting.ts` (inbound trip-hub query normalization merged in E3).

**Campaigns** (future) are not a seventh entity kind — they are **surfaces** that promote Activities and/or link to host storefronts (agencies, partners, shops) in “What’s happening” feeds. See §1.2.

---

### 1.1 Words that must not be confused

| Term | Layer | Meaning | Do not use for |
|------|--------|---------|----------------|
| **My Plans** | Consumer tab (`/plan`) | Forward commitments — upcoming, wishlist, goals, availability | FAB create menu; past outings (**profile history**) |
| **Host** | FAB (UI) | Publish a **hosted** map **Activity** | Bottom nav **My Plans** tab |
| **Find crew** | FAB (UI) | **Seeking** activity (fixed) or **Share availability** (flexible) | Generic “Find” menu; **Plan** as FAB label |
| **Add on map** | FAB (UI) | Member **place** or **facility** catalog submit | Backend `*Contribute*` module names |
| **Plan** | Leftover compose wire | Not accepted — use **Host** / **Find crew** wire (`host:*`, `seek:*`) | New FAB UI; **My Plans** tab name |
| **Contribute** | Leftover compose wire | Not accepted — use **Add on map** wire (`add:place:*`, `add:facility:*`) | Backend API name; use **place submit** / **facility submit** in code |
| **Organize** | Leftover compose + console | Not accepted — **Host** wire + **host** copy; `/publishing` publish workspace | Top-level FAB label |
| **Find** | Leftover compose | Not accepted — **Find crew** wire (`seek:fixed:*`, `seek:flexible`) | Top-level FAB label |
| **Add** | Wire token (v3) | `add:place:*` \| `add:facility:*` on `?compose=` (FAB **Add on map**) | Confusing with casual “add a friend” copy |
| **Create** | Product verb (OK) | Casual copy (“create a plan”) | — |
| **Compose** | **Wire / code only** | Query `?compose=…` — v3 `host:*` \| `seek:fixed:*` \| `seek:flexible` \| `add:*` ([§1.7](#17-program-cpc--catalog-ontology-fab-compose-wire)) | User-facing FAB buttons — reserved word for **message compose** later |
| **Host** | Product role | Anyone who **publishes** (buddy → pro guide → agency → shop owner → partner) | The Mongo `tenants` row name in UI |
| **Organisation** | Code + wire | **One tenant row** for all storefronts (guide, agency, shop, partner, …): `Organisation*`, `x-organisation-id`, `EntityKind: organisation` | Solo guide or shop in **consumer** copy — say **guide**, **agency**, **shop**, **partner**; Pro path = [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § One stack |
| **Organizer** | Retired label | — | Product noun is **host** (activity) or **tenant** (storage) |
| **Partner** | Product kind | Hotel / campaign / brand **host storefront** — not a shop, not a tour agency | Outdoor gear **shop**; do not call shops “partners” in UI |
| **Agency** | Product kind | **Tour operator** — join trips remotely; storefront is **not** “visit this pin to join” | Gear **shop**; map **Place** venue |
| **Shop** | Product kind | **Outdoor retail** — directions, contact, profile; may have a **map pin** (Place) + `/shop/:id` (no in-app catalog) | Tour **agency**; hotel **partner** |

**Member profile “public”** does **not** mean guests. Setting `profileVisibility: public` allows other **signed-in members** to open the **public card** on `/member/:id`. **Guests** get sign-in prompt only (API policy in P3). See [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Profile visibility.

Full glossary depth: [`DOMAIN.md`](./DOMAIN.md) · FAB spec: [`CREATE_FLOW.md`](./CREATE_FLOW.md).

---

### 1.2 Map discovery: **Where** vs **Who**

Explore and campaigns answer two questions. Do not merge them in copy or DTOs.

| Lens | Question | Map / feed examples | Entity kinds |
|------|----------|---------------------|--------------|
| **Where** | What **place** or **pin** is here? | Trails, camps, venues, **shop pin**, future **partner pin** (hotel) | `place`, shop as **Place** + `shop` storefront |
| **Who** | Who can I go with — friends, teams, guides/operators, intent (available as hiking, guide, …) | Activities, demand, explore **people browse** (`view=people`, list people), **`/crews`** friends hub | `activity`, `person`, **buddy** (wire), **`/me/member-discovery/*`**, **`member_availability`** (intent) — not chat. Crew pillars: `packages/shared-types/src/crew-pillars.ts`. |

An **Activity** is **Who + When** (often anchored to **Where** via `locationId`). A **tour agency** is **Who** (brand + trips) without requiring a visit pin to participate. A **shop** is primarily **Where** (get directions) plus contact and outbound website on `/shop/:id` — no in-app product catalog.

---

### 1.3 Host storefront kinds (`PublishingProfileKind` — target wire)

One **person** account; zero or more **storefronts** (tenant-backed public brands). Orthogonal to `EntityKind` (§1.5).

| Kind | Product | Map pin? | Join / book model | Public URL (today) |
|------|---------|----------|-------------------|-------------------|
| `community` | Buddy host (no brand page) | Via activities/seeking only | Host on map | `/member/:userId` only |
| `pro_guide` | Pro individual — same person as community, plus Pro membership | **No** person pin | Activity join / request | **`/member/:userId`** |
| `agency` | Tour **operator** (company profile) | **No** agency pin | Activities + paid trips | `/agency/:slug`; linked users show **operator name** on member profile |
| `shop` | Shop **operator** | **Yes** (shop pin) | Directions, **opt-in** phone / in-app chat, outbound website | `/shop/:id`; linked users show **operator name** on member profile |
| `hospitality` | Business Pro — hotels, venues | Often **yes** | Stays + linked campaigns (future) | TBD |
| `partner` | **Partner** Pro path (top-level) | Often **yes** (campaign pin) | Campaigns + linked Activities (future) | `/partner/:slug` |

**Shops ≠ agencies ≠ partners** — separate Pro applications and map rules. Code today: `hostProfileType` `individual` \| `agency` \| `shop`; extend with business **subtype** on Pro Business path ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Pro membership ladder).

---

### 1.4 Shop listing lifecycle (Where + storefront)

| Stage | Who | Product behavior |
|-------|-----|------------------|
| **Catalog / admin** | Platform admin | Shop **Place** + public `/shop/:id` for discovery; no owner console |
| **Claimed** | Business via **Pro Membership** | Ownership verified; moves toward managed tenant |
| **Managed** | Pro shop tenant | Owner console, team, profile edit |

**Agencies** and **Pro guides** are **Who**-led (no agency/guide map pins). **Shops** are **Where + Who** (pin + profile). **Partners** may combine pin + campaign surfaces (§1.2). **Pro guides** use the **member profile** as the public individual surface; **shop/agency** use **operator profiles**, discoverable from member cards when the user is linked.

---

### 1.5 `EntityKind` (URLs) vs `PublishingProfileKind` (brand type)

| `EntityKind` | Role on the wire | Paired with |
|--------------|------------------|-------------|
| `place` | Navigable POI | `PlaceKind` (`hiking` = **Trail** in UI, `shop` pin, …) |
| `activity` | Scheduled outing | Host tenant + participation |
| `person` | Member card | `profileVisibility` + profile `viewerAccess` (§15) |
| `shop` | Shop **storefront** profile | `PublishingProfileKind: shop` |
| `organisation` | Business **storefront** slug (`/agency`, `/partner`) | `PublishingProfileKind`: `agency` \| `partner` |

**Do not** rename `EntityKind.organisation` in a drive-by PR. Add `PublishingProfileKind` in `shared-types` and resolve from `tenants` + `host_applications`. Consumer copy: **Host** (individual on an outing) / **guide** / **agency** / **shop** / **partner** — not “organisation.” **Operator** = agency/shop **workspace** UI. **Organize/publish** = capabilities on **`GET /me/status`** (`profileComplete`, `publish.*`) — not `/me/*` personas. Retired in **architecture/API**: `host` paths and new `Host*` hooks; see `MEMBER_MODEL.md` § Naming vocabulary.

---

### 1.7 Program CPC — catalog ontology, FAB, compose wire

**Tracker:** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.4 (debt **C26**). **`MIG-PLATFORM-COMPOSE-OPERATOR-2026`** — target compose emit **`activity:*` \| `place:*` \| `intent:*`**; wishlist **not** a compose kind; legacy **`seek`/`host`/`add`/`availability` emit forbidden** from `src/` after PR-A (inbound parse in shared-types only).

**Simple lens (product):** **What** = Activity · **Where** = Area / Place / Facility · **Who** = Person / Host / Operator · **How** = participate (**context only** — not a fourth catalog entity) — see [`DOMAIN.md`](./DOMAIN.md) § What · Where · Who · How. Do **not** use “destination place” in copy or new code names.

#### Catalog entities (persistence targets)

| Wire / storage | Product | FAB | Notes |
|----------------|---------|-----|--------|
| `locations` (places) | **Place** | **Add on map** → Place | `PLACE_CATALOG_KINDS` after CPC amenity split |
| `facilities` (**CPC-2**) | **Facility** | **Add on map** → Facility | `parentPlaceId?`, `areaId`, `facilityKind` |
| `activities` | **Activity** | **Host** \| **Find crew** (fixed map post) | Not catalog |
| `member_availability` | **Availability** | **Find crew** → flexible | No map pin; **Find crew → Available** lists members with future slots (`GET /explore/people/availability`); day+type **notify** + FAB hosted preview only |
| `areas` | **Area** | — | Hub |
| `tenants` + merchant | **Shop storefront** (`EntityKind.shop`) | — | **Operator workspace** `/publishing/*` — not FAB |
| — | **Operator workspace** | — | Person + tenant header; guide/agency/shop |

**Register** = provenance + moderation/publication — field `registeredByUserId` (alias `submittedById` during migration). **No** `Contribute` API resource.

#### Lifecycle (catalog rows)

| Axis | Values |
|------|--------|
| `moderationStatus` | `pending` \| `approved` \| `rejected` \| `suspended` |
| `publicationStatus` | `listed` \| `unlisted` \| `anchor_only` |

Member **Add** → typically `pending` + `unlisted`; public `/place` or `/facility` when policy allows ([`CREATE_FLOW.md`](./CREATE_FLOW.md)).

#### FAB product verbs vs wire

| UI (FAB) | Meaning | Wire `compose` (emit) |
|----------|---------|------------------------|
| **Create Trip** | Publish outing you lead | `activity:<kind>` |
| **Find crew** → fixed | Fixed map availability slot | `intent:fixed:<kind>` |
| **Find crew** → flexible | Member availability (open days) | `intent:open` |
| **Add on map** | Submit **place** or **facility** | `place:<kind>` \| `place:facility:<kind>` |
| **Want to go** (Plan) | Save venue for later | *(none)* — `POST /me/wishlist` |

**Intent** = Find crew product pillar (flexible + fixed). Inbound `host` / `seek` / `add` bookmarks parse to the rows above. Detail: [`CREATE_FLOW.md`](./CREATE_FLOW.md).

**Compose** remains the **query param name** only — not FAB copy ([§1.1](#11-words-that-must-not-be-confused)).

#### URLs (target, CPC-6)

| Entity | Canonical path |
|--------|----------------|
| Place | `/place/:id` |
| Facility | `/facility/:id` |
| Activity | `/activity/:id` |
| Submissions inventory | `/profile/submissions` |

Redirects: `/trail`, `/camp` → `/place/:id`. Event aliases (`/event`, `/event-spot`, `/community-activity`) → `/venue/:id`. `/place/:id` still serves any catalog place.

#### Catalog reads (target)

- `GET /places/catalog` — **places** only (`segment=place`); `purpose=organize_picker` \| `map` \| …
- `GET /facilities/catalog` — amenities; filters `areaId`, `parentPlaceId`, `facilityKind`
- `GET /explore/map?q=&country=&area=&venue=` — find spots/events by country, area, and venue **name** (`geoRef` + title text)
- `GET /geo/tree` — hierarchy for explore search hints and **`/geo`** tree page; country URLs at `/geo/country/:code`; area hubs stay `/area/:slug`; geo node pages at `/geo/n/:id` (country / state / venue summaries). Event-venue consumer URL is **`/venue/:id`** (`placeDetailPath('event', id)`); `/place/:id` remains a working hub for all place kinds.

Evolve from today’s `GET /places/registry` → **`GET /places/catalog`** (places only). Implementation map: `SYSTEM_COHERENCE.md` §8.4.9.

---

### 1.6 Member engagement: Follow · Wishlist · Goal (not “favorites”)

| Product | What | Storage / API | Notes |
|---------|------|---------------|--------|
| **Follow** | People you want updates from | `user_follows` · `POST /me/following/:userId` | **Friends** (buddies) auto-follow on accept |
| **Follow** | Venues and brands you watch | `entity_follows` · `/me/entity-follows` | Map/list **Follow** control — not the wishlist star |
| **Wishlist** | Private “save for later” | `user_wishlist` · `/me/wishlist` | **Venues** (`locationId`) and **activities** (`activityId`) only — not demand, not people |
| **Goal** | Time-bounded target count | `user_goals` · `/me/goals` | Progress from joined/hosted outings + visited map pins — not wishlist saves |

**Journey map** (`/profile/history/map`, `POST /me/map-pins`): personal **visited** vs **want to go**. Catalog **Want to go** venues (`user_wishlist` `locationId`) compose onto the same map as joined/hosted/self pins. Goal progress uses **visited** + attendance, not wishlist rows.

**Retired product term:** “Favorites” — do not use in UI or new API paths.

---

### 1.6a Teams vs Communities (private vs discoverable)

| Product | Job | Storage (today) | Discover? |
|---------|-----|-----------------|-----------|
| **Team** | Private crew — roster-first; optional team wall chat for adults | `member_groups` with `kind: team` + `teamLabel` (`family` \| `friends` \| `colleagues` — labels only) | **No** — invite / link only |
| **Outing crew** | Chat for one published activity | `member_groups` with `kind: outing_crew` + `activityId` — **not** a team | No |
| **Community** | City-scoped discoverable group (e.g. women’s hiking · Dubai) — Strava-club style | **Future** `community_groups` + `geoRef` — **not** `social_groups` | **Yes** — Find crew → **Communities** list, sorted country → city |

**Teams:** Create = name + team type label + invite adults; **Family** teams may add **children under 12** on the roster (`SOCIAL_TEAM_KID_ROSTER_MAX_AGE_YEARS`). **Operators / Partners** remain tenants (`agency`, `partner`) — monetization and campaigns, not Teams.

**Communities (program `MIG-COMMUNITY-DISCOVER`):** public/private visibility, join policies (open · request · invite), community home, activities hosted **as** the community; directory under Explore Find crew — same projection discipline as `GET /explore/map` / list (no parallel client catalog merge).

**Do not** call Teams “social groups” in consumer copy. **Do not** overload **Community host** (friend publish tier in `MEMBER_MODEL.md`) with **Community** (discoverable group).

### 1.6b Group primitives (consumer model)

| Primitive | Job | Storage | Discoverable? | Not this |
|-----------|-----|---------|---------------|----------|
| **Team** | Private roster (labels: Family · Friends · Colleagues); optional wall chat (adults) | `member_groups`, `kind: team`, `teamLabel` | No | Outing crew; operator tenant |
| **Outing crew chat** | One thread per confirmed **Activity** outing | `member_groups`, `kind: outing_crew`, `activityId` | No — inbox **Outings** | A Team; the Activity entity row |
| **Community** | City-scoped discoverable club (Strava-style) | Future `community_groups` + `geoRef` | Yes — Explore Find crew | `member_groups`; buddy **Community** publish tier |
| **Direct chat** | 1:1 member messages | `chat_messages` (peer pair) | — | Group wall |
| **Operator / Partner** | Brand storefront, trips, campaigns | `tenants`, activities they host | Via map / deals (future) | Teams or Communities |

**Wire:** Prefer `kind` + `teamLabel` on group DTOs. Legacy `type: activity` is inbound compat only — normalize to `outing_crew` in storage and API responses (`resolveMemberGroupShape` in `@uaetrail/shared-types`).

**Out of scope for “groups”:** generic chat-only rows without roster or `activityId`, and **`member_groups` for operators** — those stay on tenant / publishing surfaces.

---

## 2. Three naming layers (always specify which you mean)

| Layer | Use for | Examples |
|-------|---------|----------|
| **Product / UI** | Copy, nav labels | Place, Activity, **Host** (FAB + individual on this outing), **Operator workspace** (agency/shop), Friends, Pro Membership — not **Compose** for FAB |
| **Code (modules)** | Files, hooks, components — **bounded context** from [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §3 | `src/explore/*`, `src/member-plan/*`, `useMemberStatus`, `tenantActivityClientApi`, `routes/publishing/*` — see **§13** |
| **Wire / storage** | HTTP paths, Mongo until versioned migration | `/locations`, `LocationDTO`, `activity_requests`, `hostUserId`, `x-organisation-id` |

**Rule:** Product says **Place**; API may still say `/locations` and `LocationDTO` until a deliberate migration. Do **not** introduce new `Location*` **product** names in UI.

---

## 3. Public URL canon (browser paths)

Built only via **`routingCatalog`** or `@uaetrail/shared-types` `entity-path` helpers:

| Entity | Pattern | Builder |
|--------|---------|---------|
| Place (hike / camp) | `/place/:id` | `placeDetailPath('hiking'|'camping', id)` · stale `/trail`·`/camp` → wire + nginx |
| Place (event venue) | `/venue/:id` | `placeDetailPath('event', id)` |
| Activity (all outing types, incl. `activityType: event`) | `/activity/:id` | `activityDetailPath(id)` |
| Activity crew (roster, host actions) | `/activity/:id/crew` | `activityCrewPath(id)` |
| Event venue place | `/venue/:id` | `placeDetailPath('event', id)` · stale `/event/:id` → wire + nginx |
| Individual (community or Pro) | `/member/:userId` | `memberProfilePath(userId)` · `resolveActivityPublisherProfilePath` |
| Agency brand | `/agency/:slug` | `agencyProfilePath(slug)` |
| Partner brand | `/partner/:slug` | `partnerProfilePath(slug)` |
| Person (community host) | `/member/:userId` | `memberProfilePath(userId)` |
| Shop | `/shop/:id` | `shopPublicPath({ id })` |
| Browse | `/explore` (+ query) | `explorePath()` in `src/explore/routing.ts` |
| Plan tab | `/plan` | `PLAN_PATH` · UI label **My Plans** (`PRODUCT_PLAN_SURFACE_TITLE`) · path helpers `src/plan/planRouting.ts` (not “trips” product term) |
| Outing history (profile) | `/profile/history` | `PROFILE_HISTORY_PATH` |
| Journey map | `/profile/history/map` | `JOURNEY_MAP_PATH` |
| Legacy my-trips URL | `/profile/my-trips` | Redirect → `PROFILE_HISTORY_PATH` (`MY_TRIPS_PATH` deprecated) |
| Personal hub | `/profile` | `PROFILE_PATH` |
| Member badges | `/profile/badges` | `PROFILE_BADGES_PATH` — achievements only (no Trail Points) |
| Legacy rewards wallet | `/trail-points`, `/my-rewards`, `/rewards` | Redirect to `PROFILE_BADGES_PATH` |
| Legacy community feed | `/community` | `COMMUNITY_PATH` → `/explore` redirect only (feed removed) |
| Legacy membership marketing | `/membership` | `MEMBERSHIP_MARKETING_PATH` → explore redirect |
| Pro / business | `/profile/pro-membership` | `PRO_MEMBERSHIP_PATH`, `proMembershipPath()` |
| Publishing console | `/publishing/*` | `OPERATOR_*_PATH` in `src/config/surfacePaths.ts` |

**Parse inbound links:** `parseEntityRefFromPathname(pathname)` → `EntityRef`.

**Stale bookmark paths** (do not link in new UI): legacy hubs, `/trail`·`/camp`·`/event`, `/messages`, `/host/*`, profile-nested settings, etc. — **no SPA `<Navigate>` bookmark routes** (GW-7). Stale links normalize via **`canonicalizeInboundProductPath`** (`entity-path` + `notification-bookmark-path`) from notifications, auth `?redirect=`, and participant console fallbacks; detection literals in `src/config/inboundBookmarkPaths.ts`. Detail: [`NAVIGATION.md`](./NAVIGATION.md) § Stale URLs (GW-7).

### 3.1 Consumer detail tab wire ids

Query param **`tab`** where noted. **UI labels** may differ from wire ids (activity). **Code:** activity `src/activity/activityDetailTab.ts`; place `src/place/placeDetailTab.ts`; area/shop/org `src/area|shop|organisation/*DetailTab.ts`; guard canon `src/config/consumerDetailTabWireCanon.ts`. **Plan:** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §6.2 / `consumerDetailQaMatrixGuard`.

| Surface | Route prefix | Wire tab ids (canonical → target) | Deep link |
|---------|--------------|-----------------------------------|-----------|
| Activity | `/activity/:id` | **`presentation.sections`** (no tab bar). **Embed/manage:** same `sections` + `footerByTab` | Legacy `?tab=` → scroll anchors (deprecated). **FE:** `ActivityDetailByKind` → `*ActivityDetailPage` → `ActivityDetailPageShell` → `ActivityDetailSections` |
| Place (trail/camp/venue) | `/trail`, `/camp`, `/venue` | **Public scroll** (no tab bar). Legacy wire: `overview` · `facts` · `transport` · `guide` (alias `location` → `transport`) | `?tab=` deprecated · `src/place/placeDetailTab.ts`; **FE:** `*PlaceDetailPage` → `PlaceDetailPage` → `PlaceDetailPageShell` → `PlaceDetailSections` — L1 `buildPlaceDetailPageModel`; kind facts `PlaceDetailKindFacts` (trail / camp / event) |
| Destination hub | `/destination/:slug` | `overview` · `places` · `activities` (people on overview) | `?tab=` · `src/area/destinationDetailTab.ts` |
| Shop public | `/shop/:id` | `about` · `location` | `?tab=` · `src/shop/shopPublicDetailTab.ts` (inbound `?tab=products` → `about`) |
| Organisation public | `/agency`, `/partner` | `about` · `outings` · `contact` | `?tab=` · `src/organisation/organisationPublicDetailTab.ts` |

**Aliases (one release when renaming place tabs):** `location` → `transport`; document in Phase 3 PR.

**Guards (Phase 7):** entity detail routes must use `MobileDetailShell` / `EntityPublicDetailShell`; tab ids must match this table.

### 3.2 Detail surface data lineage (read ↔ write)

Detail UIs must load from the **canonical read API** for that entity; writes use the **same bounded context** (no parallel Mongo shapes in pages). **FE:** `src/hooks/*ClientApi` facades only (`detailSurfaceDataLineageGuard.test.ts`). **Manifest:** `scripts/governance/bounded-context-manifest.json`.

| Surface | Route | Data owner (Mongo / service) | Who writes | Read HTTP | FE facade (consumer) | Notes |
|---------|-------|------------------------------|------------|-----------|----------------------|--------|
| **Activity** | `/activity/:id` | `activities` + participation | Member **Organize/Find** FAB, host publish (`member-publish-gate`) | `GET /activities/:id` (`viewerAccess`, presentation) | `usePublicActivityDetail` | Not trail inventory — scheduled outing |
| **Member (person)** | `/member/:userId` | `users` profile | Member `PATCH /me/profile` | `GET /member/:userId/profile` | `memberPublicProfileApi` | ≠ tenant storefront |
| **Organisation (pro)** | `/agency`, `/partner` | `tenants` storefront | Host onboarding / `organisationConsoleApi` | `GET /tenants/:slug` (public profile bundle) | `organisationConsoleApi` | Shop tenants → `/shop/:id`; individual Pro → `/member/:userId` |
| **Shop** | `/shop/:id` | `tenants` / merchant (+ optional place pin) | **Operator** Pro onboarding — **not** FAB **Add → Shops** (`add.place.shop` is community **place** submit); see [§1.7](#17-program-cpc--catalog-ontology-fab-compose-wire) | `GET /shop/shops/:id` | `shopPublicClientApi` | `EntityKind.shop` = storefront tenant; no product catalog HTTP |
| **Place** | `/place/:id` (CPC-6; legacy `/trail`·`/camp`·`/venue`) | `locations` (place rows) | Admin `/admin/places`; member **Add → Place**; host **new spot** (photo + pin; city from coords) stays DRAFT until admin activate (`registryListed` + `activity_venue_live`); submit **`destinationId`** | `GET /places/:id`; `GET /places/catalog`; linked **facilities** via **`onSiteId`** | `placeDetailClientApi` | Place catalog excludes facilities after CPC |
| **Facility** | `/facility/:id` | **`facilities`** (**CPC-2**) | Admin `/admin/facilities`; member **Add → Facility** | `GET /facilities/:id`; `GET /facilities/catalog` | TBD `facilityDetailClientApi` | **`destinationId`** + optional **`onSiteId`** |
| **Destination** | `/destination/:slug` | `areas` store (logical destinations) | **Admin** `/admin/destinations` (publish `status`; `/admin/areas` redirect) | `GET /destinations/:slug` (preview slices) | `destinationHubClientApi` | Previews filter published activities + active places by **`destinationId`** |

**Registry:** place catalog browse uses `GET /places/registry` (explore map) — detail pages use **per-id** `GET /places/:id`, not the registry blob.

**API lineage contracts:** `apps/api/tests/detail-surface-lineage-contract.test.ts` (admin area/place publish → public GET; member profile → public profile).

**Cross-links:** [`CREATE_FLOW.md`](./CREATE_FLOW.md) (member writes) · [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) · geography § in this doc · [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §6.2 / `consumerDetailQaMatrixGuard` §18.

### 3.2.1 Discovery projection → detail page → actions (L1–L3)

Map/list **peek** and entity **detail** share one engagement contract per viewer state. **Policy** lives on the API (`viewerAccess`, `presentation`, `mapPeekActions` / `mapPeekStrips`); React only maps wire → UI (`resolvePeekDetailAccess`, `resolveActivityDetailWirePresentation`, `executeActivityMapPeekAction`). **Guards:** `detailSurfaceWiringAcceptance.test.ts`, `mapDetailEngagementParity.test.ts`, `activityDetailAcceptance.test.ts`.

| Surface | L2 map peek | L3 consumer shell | Detail CTA | Participation / actions on L3 |
|---------|-------------|-------------------|------------|-------------------------------|
| **Activity** | `ActivityMapPeekHost` → `ActivityPeekCard` → `peek/activity/*` | `ActivityDetailByKind` → `*ActivityDetailPage` → scroll body + wire CTAs | `PeekDetailLink` + `view_detail` in `mapPeekActions` | Join/RSVP: `POST /activities/:id/requests`; **public** slots from `presentation.sections` + `mapPeekActions`; embed: `footerByTab`; guest: `ActivityDetailGuestGate` |
| **Place** | `PlaceMapPeekHost` → `PlacePeekCard` (`PlacePeekHero` · `PlacePeekBody` · `PlacePeekActions`) | `*PlaceDetailPage` → `PlaceDetailPageShell` → `PlaceDetailSections` | **Plan trip** · `PeekDetailLink` **View details** | `PlacePlanList` (page and peek) from `GET /places/:id/activities`; reviews; transport; `nearbyFacilities`; premium guide `PlacePremiumGuidePanel` |
| **Destination** | `mapPeekSlots` → `DestinationPeekBody` / `DestinationPeekActions` | `DestinationDetailPage` → `DestinationDetailView` (`MobileDetailShell`) | Links to `/destination/:slug`, explore `?destination=` | Browse-only hub — join on child **activity** rows |
| **Shop** | `ShopPeekActions` + `PeekDetailLink` | `ShopPublic` → `ShopPublicPage` (`EntityPublicDetailShell`) | `/shop/:id`; guest map rows may gate in peek | Reviews on tenant id; outbound **website** link only (no product grid) |
| **Agency** | Catalog / activity publisher row (not `source: agency` map rows) | `OrganisationProfile` → `OrganisationPublicProfile` (`EntityPublicDetailShell`) | `resolveActivityPublisherProfilePath` from activity | Message/follow; listed outings → `/activity/:id` |
| **Member** | People browse / roster links | `MemberProfile` (`viewerAccess` on `GET /member/:userId/profile`) | `/member/:userId` | Buddy add, follow, `MessageMemberButton` |

### 3.2.2 Member profile — one page, browse lenses

**Route:** `/member/:userId` only (`MemberProfile` → `MemberProfileView`). **My Crews** (`/crews`), Explore people panel, activity host rows, chat avatars, and notifications all **link here** — no parallel “friends profile” or “public profile” routes (stale `/buddies` rewrites to `/crews`). Self hub stays `/profile`; owner **public preview** uses `/member/:id?view=public` on the same layout. Users linked to a **shop or agency operator** show the **operator display name** on the card (link → `/shop/…` or `/agency/…`); Pro **guides** do not get a separate storefront link — the member card is the individual public surface.

**Path helpers:** Wire URLs — `memberProfilePath(…)` (`packages/shared-types/src/entity-path.ts`), including `{ publicPreview: true }` → `view=public`. Consumer surfaces — **`memberProfileLink(userId, lens)`**; owner preview — **`memberPublicPreviewLink(userId)`** (`src/member/memberProfileLink.ts`) so people browse, friends list, roster chips, notifications, chat avatars, and the self-hub public preview share one builder. `discover=1` + `from=discover` = directory quota on `GET /member/:userId/profile`; other lenses set `source=` only. Public preview is not a browse lens.

| Browse lens (`source`) | Where user starts | Who may **see roster / card** | Who may **open** `/member/:id` (API `viewerAccess`) |
|------------------------|-------------------|-------------------------------|-----------------------------------------------------|
| **`discover`** (public directory) | People **Connect** / `GET /users/browse` | Members with `profileVisibility: public` in directory | **Signed-in**; discover opens count toward quota (**Pro** = unlimited per `memberHasUnlimitedDiscovery`) |
| **`host`** | Activity host row, **Looking for**, approved outing context | Participants + hosts on shared / hosted activities | **Signed-in** with `host_of_activity`, `activity_participant`, or public card when visibility allows |
| **`friends`** | **My Crews** (`/crews`), **Going** / network roster | Accepted friends (+ followed where shown) | **Accepted friend** → `exposure: full`; others follow visibility rules |
| **`available`** | People **Available** tab | Members signaling availability | **Any signed-in member** (public card minimum; trusted fields per §15) |
| **`organic`** (default) | Deep links, search, notifications | N/A | `resolveProfileViewerAccess` + `profileVisibility` |

**Exposure on the page:** one layout; **field depth** is `viewerAccess.exposure` (`public` vs `full`) — not a different React tree per lens. Frontend must not branch authorization on `source=`; lens only affects API discover flag and analytics.

**People browse L1 rows:** `memberBrowseRowModel.ts` (`MemberBrowseRowVm`) — directory, availability, going, seeking → `CrewBrowseMemberRow`; parallel to `discoveryCardModel` for map catalog pins.

**Creation (writes) → read:** Organize/Find FAB → `POST` host activities / seeking (`CREATE_FLOW`); places → admin or **Add** contribute → `locations`; shops/agencies → tenant onboarding; areas → admin publish. After publish, the same ids appear on `GET /explore/map` (L1 `discoveryCardModel`) and on the entity `GET` above.

---

## 4. Explore URL canon

| Concern | Canonical | Avoid |
|---------|-----------|--------|
| Map home | `EXPLORE_MAP_PATH` (`/explore`) | `/map`, bare `/shop` |
| FAB deep link (wire) | `compose=activity:*` \| `place:*` \| `intent:open` \| `intent:fixed:*` — inbound `host`/`seek`/`add` parse only; product = **Create Trip · Add a venue · Find a Crew** | User-facing “Compose”; `/host/activities/new` for consumers |
| Panel/filter query | `explorePath({ panel, filter, … })` | Raw `` `/explore?${...}` `` outside `explore/routing.ts` |
| Archived seeking (ops only) | Activity detail or `/explore?list=1`; map pin `availability:{userId}:{slotId}` | `exploreSeekingMapItemPath` map pins; `/demand/:id`; `demand:` pin ids |
| Full-screen list browse | `LIST_DISCOVERY_PATH` (`/list`) + `listDiscoveryPath()` | `/list/hiking`, `/shops` as category site roots |
| List ↔ map handoff | `exploreMapPathFromListSearch()`, `listDiscoveryPathFromExploreSearch()` | Second filter vocabulary on `/list` |

Explore URL builders live in `src/explore/routing.ts` (re-exported from `config/routingCatalog`); list helpers in `src/list/browse/browseListRouting.ts`. The old `utils/exploreRouting` shim is **removed** (`exploreModuleBoundary.test.ts`).

### 4.1 Browse vs entity paths (mental model)

**North star:** members **discover people and plans** on one browse surface; they **open one record** when they care about join, follow, or share.

| Layer | URL pattern | Job | Cache / load |
|-------|-------------|-----|----------------|
| **Browse (feed)** | `/explore?…` and optionally `/list?…` | Map-first discovery; topic + pin-kind filters (Trips, Looking for, Spots, Shops) live in **query**, not path segments | One read model: `GET /explore/map` (filters on query). `/list` uses the slim map projection (same Redis catalog, lighter nested fields). Client cache keys = **canonical serialized browse state** (`explorePath`, list URL state). **Catalog list** is `ListDiscoveryExperience` (thumbnails / list / calendar, date-sorted): full-screen `/list` on mobile and hamburger **Browse**; a resizable left drawer on desktop `/explore?list=1`. Inbound `/explore?list=1` / `browse=1` rewrite to `/list` on mobile only. **People** = `CrewsBrowsePanel` on the map (`view=people`). **Explorer cards (Activities):** `buildListFeedCards` → `listFeedPosterStandard.ts` + `listPosterPresentation.ts` (title/place/schedule from `ActivityDTO`; requirement pills from stored `requirements[]`). **Places category (`listCat=venues`):** location-bounded **venues + gear shops** (no separate list category for shops; legacy `listCat=shops` → Places + `filter=shop`). **Agencies** stay a separate list category (brand/operators, not map pins). Place facts persist on `locations`: `areaLabel` (+ synced `area:` tag), `childFriendly`, `accessibility`, `parkingLat`/`parkingLng` — set via member/host `POST …/locations` (`locationSubmitBodySchema`), admin place CRUD, and explore contribute publish. **Buddies** list/search bucket (`listCat=people`, `searchScope=people`, UI label Buddies) uses **member_discovery** roster (`ExploreMemberDiscoveryList`) — not demand/`GET /explore/map`; **Looking for** stays Trips sub-filter + map pill only. |
| **Entity (document)** | `/activity/:id`, `/trail/:id`, `/venue/:id`, `/shop/:id`, `/agency/:slug`, `/member/:userId`, … | Share link, notification target, SEO snippet, per-record auth (`viewerAccess`) | Per-entity fetch + cache (`activity`, place, shop, tenant). **Not** used as “browse all hikes” hubs. |
| **Personal (not public browse)** | `/plan`, `/profile/history`, `/profile`, `/settings` | Upcoming + goals; history + journey map; profile hub; **app settings** (not `/profile/edit`) | `/me/*` APIs; separate from explore map payload. |

**Do not add** parallel browse roots such as `/map`, `/activities` (catalog), `/places`, `/shops` as top-level **category pages** — that duplicates filters already expressed on `/explore` and `/list`, splits analytics, and invites divergent APIs. Legacy `/map` and `/activities` → redirect only ([`NAVIGATION.md`](./NAVIGATION.md)). **Mobile bottom nav:** five tabs (Trips · Places · People · Chat · Plans) — Trips/Venues use **map + list projections**, not a sixth “List” tab; use `mobileFiveTabHomePath()` instead of ad hoc `/list` links in chrome.

**When a new path is justified:** marketing/SEO landings that **deep-link into** `explorePath({ … })` with the same filter params; partner embeds; or a **new bounded context** with its own read API (document in Tier-1 before shipping).

**Three maps (do not conflate):** (1) **Explore** — public discovery; (2) **Journey map** — `/profile/history/map` (consumer), `GET /me/journey-map` + `POST/PATCH/DELETE /me/map-pins`; (3) **Publishing workspace** — tenant tools under `/publishing/*`. See [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §3.1 and §4.1.

IA detail (pills, topics): [`NAVIGATION.md`](./NAVIGATION.md) · `src/list/`.

---

## 5. HTTP API canon (member vs host)

| Scope | Prefix | Header | Examples |
|-------|--------|--------|----------|
| Public read | `/activities`, `/explore/map` (`sources=availability` for Looking for), `/places` | — | Browse; crew map slice = `availability-fixed-map-items.ts` |
| Member | `/me/*` | Bearer | `availability`, `status`, profile |
| Publishing workspace (tenant scope) | `/publishing/*` | Bearer + `x-organisation-id` | `activities`, **`/publishing/requests`** (activity join queue) |
| Person public | `/users/:id` | optional | Public profile |

**Kebab-case plurals** on URLs: `availability` (crew registry), not `intents` or `demand`.

**Client modules:** `src/api/domains/*.ts` — canonical method names (`getOrganisationProfile`, `getMemberStatus`, `getPublicPlaces`). No retired alias layer on `api` (see `apiClientSurfaceGuard.test.ts`).

### 5.1 API vs UI (read-models)

| Layer | Names | Wire payload |
|-------|--------|----------------|
| **HTTP `/me/*`** | Entity or **capability** (`coordination-attention`, `profile-stats`, `status`) | Facts: ids, counts, enums — **not** tab copy (`Needs you`, `Plan`) |
| **shared-types** | `MemberCoordinationAttention*`, `MemberProfileStatsDTO` | No English `label` or consumer `path` on list rows |
| **SPA** | `PlanNeedsYouStrip`, `coordinationAttentionPresentation.ts` | Labels + `surfacePaths` / `planHostedSchedulePath` |

**Aggregates:** One bounded read-model per hot screen is allowed (e.g. coordination attention for Plan). Kinds must map to existing entities (`activity_requests`, `friend_requests`, `activity_invites`, `notifications`). Enforced: `api-surface-route-naming.test.ts`, `coordination-attention-contract.test.ts`.

---

## 6. Type & file naming (new code)

| Prefer | Deprecated alias | Notes |
|--------|------------------|-------|
| `Place`, `getPublicPlaces` | Location (in UI) | `LocationDTO` = wire DTO |
| `getOrganisationProfile`, `ShopOrganisation*`, `organisation-console/` (Pro storefront onboarding) | Merchant* (client), HostOrganization* | **Not** activity CRUD/roster — see `MEMBER_MODEL` § Organisation in filenames |
| `listHostActivities`, `createHostActivity`, `publishHostActivity`, `ActivityParticipantsPanel`, `ActivityManageSheet` | `*OrganisationActivity*`, `OrganisationActivityCheckInPanel`, `listOrganisationActivities` | Guards: `apiClientSurfaceGuard`, `organisationNamingGuard` |
| `OPERATOR_CONSOLE_LINKS`, `src/pages/publishing/*`, `src/console/*` | `HOST_CONSOLE_LINKS` (alias), `pages/OrganisationActivities` | Publishing console at `/publishing/*` |
| `getMemberStatus` | `getMemberHostStatus`, `getMyOrganisationStatus` | Tier + nested `publish` |
| `PersonPublicProfile` | `UserPublicProfile` | Public card |
| `buildHostActivityPublishPayload`, `buildHostActivityMenuItems` | `buildOrganisationActivity*` | Single publish contract (`activityPublishPayload.ts`) |
| `registerHostActivityRequestRoutes` | `*JoinRequest*` (host) | Activity join queue only |
| `registerHostActivityRoutes` | `registerHostTenantActivityRoutes` | Host **Activity** CRUD/publish/history (`/host/activities/*`) |
| `registerHostActivityParticipantRoutes` | — | Roster, check-in, revoke, host rating on same paths |
| `ActivityParticipationStatus` | `ActivityCheckInPanel` (member shim) | Joiner read-only attendance — not host roster |

**Demand vs activity join:** always qualify — “activity join request” vs “demand join request” ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Naming vocabulary).

**Explore map pins:** `MapPinKind` / `DiscoveryCardKind` (`components/ui/mapPinTypes.ts`, `discovery/discoveryCardModel.ts`) — keep in sync; prefer shared-types for new pin metadata.

**Discovery UI methodology:** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) **§6.1** (L0 wire → L1 card VM → L2 map peek → L3 detail). **Mount routing** is `ExploreMapStage`: activity, geography (place and facility), or catalog (shop and area). **Looking-for / seeking** uses the same activity peek stack (`ActivityMapPeekHost` → `ActivityPeekCard`); no intent-only peek fork in FE (`seekingPeekUnificationGuard`).

**Discovery UI file names (entity-first — Oct 2026):**

| Prefer (new) | Legacy alias | Notes |
|--------------|--------------|-------|
| `MapPeekShell`, `MapPeekOverlay` | `ExploreMapPeekCard`, `ExploreMapPeekPosition` | Pin **summary** chrome — not “explore” architecture |
| `ActivityPeekCard`, `ActivityMapPeekHost`, `ActivityPeekStandardFooter`, `ActivityPeekStrips` | `ExploreItemSheet`, `ExploreActivityMapPeekActions`, `ExploreActivityPeekStrips` | Hosted + **seeking** activity pins; footer matches the activity page |
| `PlacePeekCard`, `PlacePeekBody`, `PlacePeekActions`, `FacilityPeekActions` | `ExplorePlacePeek*` | Place pins plan a trip; facility pins open directions and the facility page |
| `CatalogPeekCard`, `CatalogMapPeekHost`, `ShopPeekActions` | `ExploreShopPeekActions` | Shop and area pins |
| `PlaceMapPeekHost` | `ExplorePlaceMapPreview` | Map **mount** for venue (`Place`) pins — not activity organizer |
| `PeekDetailLink`, `mapPeekSlots` | `ExplorePeekDetailLink`, `ExploreItemPeekParts` | Peek → detail + source router |
| `DestinationPeekActions`, `DestinationPeekBody` | `ExploreDestinationPeekActions` | **Area** hub **page** chrome — Area is not a map pin |
| `PlacePeekActions`, `PlacePeekBody` | `PlacePeekActions`, `ExplorePlacePeek*` | **Place** on Spots (`source: 'venue'`) |
| `ActivityPeekLinkedTransport` | `ExploreLinkedRidesharePeekIndication` | Activity peek transport strip |
| `DiscoveryCardModel`, `buildDiscoveryCardModel`, `buildDiscoveryCardViewModelCard` | `DiscoveryCardModel`, `buildDiscoveryCardModel` (re-export stub) | Read model for pins + list |

**`/explore` route** and folder `src/explore/` = **discovery map surface** (historical package path). **Do not** prefix new **entity** components with `Explore` — use activity / place / pin / map projection vocabulary. Map-only chrome (`ExploreMapStage`, filter pills) may keep surface prefix until renamed in a dedicated pass.

---

## 7. Routing hygiene rules (enforced in CI)

1. **No consumer links** to `/become-host` — use `PRO_MEMBERSHIP_PATH` (`hostMemberGuard.test.ts`).
2. **No new links** to `/activities` or bare `/trips` — use `PLAN_PATH` or `PROFILE_HISTORY_PATH` (`routingHygiene.test.ts`).
3. **No raw `/explore?…`** outside explore routing module + small allowlist (`routingHygiene.test.ts`).
4. **No `isHostRole(`** for product gates — `canPublish` / `publish.canAccessPublishingWorkspace` (`hostMemberGuard.test.ts`).
5. **No banned `api.*` retired** calls in app code (`apiClientSurfaceGuard.test.ts`).

---

## 8. Hygiene pass checklist (humans / agents)

When renaming or adding routes:

1. Add or use a builder in `routingCatalog` / `entity-path` / `explore/routing.ts`.
2. Update [`NAVIGATION.md`](./NAVIGATION.md) legacy table if adding a redirect.
3. Grep: `become-host`, `/activities`, `isHostRole`, `getMyOrganisationStatus`, `participant-intents/.*/fulfill` (removed — use `link-activity`).
4. Run `npm run verify:domain`.

---

## 9. Known intentional duplicates (do not “fix” without migration)

| Duplicate | Why |
|-----------|-----|
| `LocationDTO` vs Place | Mongo `locations` + historical API |
| `tenant` vs Organisation | `x-organisation-id` header (`tenantId` in storage) |
| `UserRole` vs `HostStatusDTO` | Auth shell vs product capabilities |
| Retired SPA bookmark redirects | Removed GW-7 — `canonicalizeNotificationBookmarkPath` + nginx 301s; no duplicate client rewrite tables |
| `ProProfileApplicationFlow` | Pro guide/agency/shop application wizard (not community Host / publish) |
| `/activities` bookmark pathname | Plan hub query rewrite via `canonicalizeNotificationBookmarkPath` — no SPA route |

---

## 10. Call-site contracts (routing & API client)

**Do not add new `*Routing.ts` files** without updating this section and `systemCoherenceGuard.test.ts`.

| Need | Import |
|------|--------|
| Path constants, entity URLs | `src/config/routingCatalog.ts` (`messagesToUserPath`, `messagesGroupPath`, `myRequestDetailPath`) |
| Retired console/message path literals (normalize only) | `src/config/inboundRoutePaths.ts` · `src/config/inboundBookmarkPaths.ts` |
| Explore query (`compose=`, panels) | `explorePath()` — `src/explore/routing.ts` |
| Notification deep link | `inferNotificationPath()` — `src/utils/notificationRouting.ts` only |
| Post-auth / legacy dashboard | `authRouting.ts` (shrink over time) |

| Context | FE module | Canonical calls |
|---------|-----------|-----------------|
| Host tier / publish gate | `memberApi` | `getMemberStatus()` |
| Map / Find | `exploreApi`, `availabilityApi` | explore map; `/me/availability` |
| Buddies / groups / follow | `buddiesApi`, `groupsApi` | `/me/friends`, `/me/groups`, `/me/following` |
| Wishlist / entity follow / reviews | `wishlistApi`, `entityFollowApi`, `reviewsApi` | `/me/wishlist`, `/me/entity-follows`, `/reviews` |
| Tenant console | `organisationApi` | organisation profile, team, join queue |
| Badges | `badgesApi` | `getMemberBadges()` |

**API client:** `api` merges `src/api/domains/*` only (legacy alias layer removed Oct 2026). **Base URL:** `VITE_API_BASE_URL` → `/api` (unversioned). **Notification deep links:** `apps/api/src/lib/member-routes.ts` ↔ `src/config/surfacePaths.ts` (`member-routes-alignment.test.ts`). **Resolvers** (`resolve*`) belong in `apps/api/src/services/*` only.

---

## 11. Notification meta (`NotificationMeta`)

Shared shape: `packages/shared-types` → `NotificationMeta`.

| Field | Use |
|-------|-----|
| `kind` | Required — stable string (existing kinds: `join_request_*`, `connection_buddy_*`, `badge`, `goal_*`, …; prefer `domain.action` for **new** kinds) |
| `actorUserId` | Who acted — profile link + actor label (always a **user** id) |
| `activityId`, `groupId`, `requestId`, `intentId` | Entity pointers |
| `path` | Optional; prefer catalog constants; FE rewrites legacy wallet paths |

**Do not add:** `actorUserId`. Friend request DTO may still use `fromUserId` / `toUserId`; notifications use `actorUserId` for routing. Chat DMs: `kind: 'message'` + `actorUserId` (legacy `senderId` still read by FE).

---

## 12. Frontend module vocabulary (product ↔ `src/`)

Use this when naming files, hooks, and utils — **one product word per concept**. Detail: [`CREATE_FLOW.md`](./CREATE_FLOW.md), [`DOMAIN.md`](./DOMAIN.md) § entities.

| Product (UI copy) | API / wire | Preferred FE symbol / folder | Do not use for new code |
|-------------------|------------|------------------------------|-------------------------|
| **Find crew** (FAB) | `PUT /me/availability` (`member_availability`) | `CreateAvailabilityFixedFlow.tsx` (rename TBD), `intentFixedFlowEngine.ts` → availability publish | `CreateDemandFlow.tsx`, `/me/seeking-posts`, new `activityMode: seeking` writes |
| **Availability pin** (public map) | `member_availability` fixed slot | Map id **`availability:{userId}:{slotId}`**; wire **`source: availability`**; peek **`AvailabilityPeekActions`** (profile + message; optional **Offer rideshare** when `canOfferTransport`). Assembler: `discovery-catalog-builder.ts` + `buildAvailabilityFixedMapItems`. | `activityMode: seeking` catalog pins; `demand:` ids; join on peek |
| **Follow** (venue / host brand / shop alerts) | `entity_follows` | `EntityFollowDTO`, `GET/POST /me/entity-follows` | Wishlist UI, “favorites” |
| **Follow** (people) | `user_follows` | `MemberFollowControls`, `/me/following/:userId` | Buddies are **friends**; accepting a buddy **auto-follows** both ways |
| **Wishlist** (private saves) | `user_wishlist` | `WishlistItemDTO`, `GET/POST /me/wishlist` | “Favorite”, demand bookmarks, saving people/shops to wishlist |
| **Goal** (time + count) | `user_goals` | `MemberGoalDTO`, `GET/POST /me/goals` | Wishlist rows, visited map pins as goal progress |
| **Host** (FAB) | `activities` publish | `hostingFlowEngine`, `hostingFlows/*`, `create/hosting`, `hostingActivityPublish` | `organizeFlow.ts`, `createOrganize/`, `CreateActivityFlow` shims |
| **Plan** (tab) | joined/hosted/self plans | `src/plan/PlanPage.tsx`, `src/plan/planRouting.ts`, `components/plan/*`; history chrome: `components/profile-history/*`, `components/journey/*` (journey map only on profile) | `/activities` hub naming, trips-era tabs on `/plan` |
| **Member discovery roster** | map + directory compose | `availabilityOnMap[]` (`availabilityTitle`, `exploreItemId`) on `GET /discover/crew` | Wire field `lookingFor`, `demandTitle`, `seekingOnMap` |
| **Journey map** (`/profile/history/map`) | `GET /me/journey-map`, `POST/PATCH/DELETE /me/map-pins`, `JourneyMapEntryDTO` | `memberJourneyMapApi`, `src/member-plan/journeyMap*` | `GET /me/trips/map`, `outdoorMap*` |
| **Explore map** | `GET /explore/map` (guest catalog) + `GET /me/discover/overlay` (signed-in peek) | `src/explore/*`, `exploreMapPinModel`, `applyExploreMapOverlay` | `journeyMap*` (wrong surface); mixing viewer engagement into the public map cache |
| **Destination** (curated **name**, not a pin) | `GET /destinations`, `GET /destinations/:slug` | `destinations-store`, `hostingPublishDestination.ts`, `/destination/:slug`, explore `?destination=` | `source: area` map pin; `areaLabel` as a third geo concept; assigning destination from meeting-pin polygons |
| **Place / venue** | `locations` | `place*`, `venue` panel, `Place` in UI | `location` in new routes/components |
| **Friends** | buddies API | `BUDDIES_PATH`, `buddy*` stores only on API | `actorUserId`, “buddy entity” |
| **Publishing console** | `/publishing/*`, tenant | `src/pages/publishing/*`, `src/console/*`, `useMemberStatus`, `useConsoleHubData`, `tenantActivityClientApi` | `tenant` in consumer UI strings (wire: `x-organisation-id`) |

**Three maps (do not conflate):** (1) **Explore** — public discovery (`source`: activity · place · facility · shop); (2) **Journey map** — `/profile/history/map` + `GET /me/journey-map`; (3) **Place catalog** — Place / Facility / shop layers on Explore. **Destination** is a name (`?destination=` / `/destination/:slug`), not a map.

**`src/utils/` policy:** cross-surface helpers only (`authRedirect`, `notificationRouting`, `authReturnContext`, `routingCatalog` consumers). Domain logic belongs in `src/explore/`, `src/member-plan/`, `src/member/` (`organisationPaths.ts`), `src/content/workspaceVocabulary.ts`, `src/components/<domain>/` — not new `utils/<domain>*.ts`.

### 12.1 Geography — Destination hub, Place (site) catalog, Activity (authoritative)

**Program MIG-DESTINATION-GEO-2026** ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.5): **AdminGeo** (`geoRef`, auto) → **Destination** (curated `destinationId`, `GET /api/destinations`) → **Place (site)** / **Facility** (`onSiteId` on facility) → **Activity** via `locationId`. Wire **`destinationId`** / **`resolveDestinationId`**; inbound bookmark `/area/*` → `/destination/*` only.

**Hierarchy (target):** **Country / state / region** (from map geography) → **Destination** (admin-curated name — **not a map pin**) → **Place (site)** / **Facility** (coords) → **Activity** (geography only through a place).

**One Destination, many children (catalog `destinationId`):**

| Child on the hub | `PlaceKind` / wire | Explore **Spots** map pins today | Area lens rollup / hub |
|------------------|-------------------|----------------------------------|-------------------------|
| Trails | `hiking` (`activityType: hiking`) | Yes (`source: place`, hiking) | `trailSpots` |
| Camps / camp spots | `camping` | Yes | `campSpots` |
| Outdoor spots (“Others” Add) | `outdoor_other` (`event` + `outdoor-other` tag) | Yes (`placeKind: outdoor_other`) | Grouped on `/destination/:slug` preview |
| Shops (member Add) | `shop` + `community-shop` tag | Yes — **Shops** lens, `catalogProfileExposure: peek` (map peek only) | Area hub + rollups |
| Shops (merchant / Pro tenant) | `shop:` tenant rows | Yes — **Shops** lens, `catalogProfileExposure: full` → `/shop/…` | Merchant profile + reviews |
| Individual Pro / tour agencies | `tenants` + `/member/:userId` · `/agency` | **No map pin** — discover via **hosted activities** + person or agency URL (`catalogProfileExposure: full`) | Area hub `#operators` rail = Pro hosts with outings in this area (not tenant lat/lng) |
| Facilities (toilet, parking, gas, water, viewpoint, picnic, …) | `facilities` collection · `facilityKind` | Yes (`source: facility`, `id: facility:{id}`, coords for navigation) | `facilities` in `areaLensStats`; list on area hub `#places`. Peek still shares Place chrome until a facility peek ships. |
| Hosted outings · Find crew (fixed) | **Activity** · **`member_availability`** | **Activities** lens · **`source: availability`** pins | Legacy `activityMode: seeking` on map |

**Assignment rules (write path — do not invert):**

| Entity | Who sets `destinationId` | Rule |
|--------|------------------------|------|
| **Destination** | Admin `/admin/destinations` | Curated **name** + optional center/bounds as camera hint for the hub page — **no explore map pin**. Geography labels (country, state, region) come from the map, not from Destination. |
| **Place** | Admin `/admin/places` or member **Add** (`curatedDestination` then pin) | **`locations.destinationId` required** on submit (`POST /me/places`) |
| **Hosted activity** | Host publish | **No `activity.destinationId` on write.** `activity.locationId` → catalog **place** with **`place.destinationId`**. `validateHostingPlaceDestination` / publish gate. Meeting / going-from pin does **not** define destination. |
| **Find crew (fixed map slot)** | Find FAB | **`member_availability`** slot with time/place; optional **`destinationId`** on slot — not an activity row. |
| **Availability** | Plan / profile | Member picks **`destinationId`** (optional region fallback) — not an activity. |

**Explore map lenses (orthogonal to tagging):**

| Lens (`pinKind`) | What you see | Not this |
|------------------|--------------|----------|
| **activities** | One pin per hosted/seeking outing | Area labels |
| **places** (“Spots”) | Catalog trail/camp Place pins with coords | Destination is a filter (`?destination=`), not a pin. Facility pins are also on the map (`source: facility`); lens grouping vs Spots is still open. |
| **locations** (legacy URL) | Alias of **places** | Former synthetic Area hub pins — do not restore |
| **shops** | Shop layer (catalog + tenant-backed pins) | — |

**Discovery filters:** `?destination={slug}` keeps rows whose projected **`destinationSlug`** / **`destinationId`** match. Destination is a name on those rows — not a pin.

#### 12.1.1 Explore UI — Place · Facility · Destination (Destination is a name, not a pin)

| Concept | Product meaning | Wire / storage | Map peek UI |
|---------|-----------------|----------------|-------------|
| **Place** | Catalog trail, camp, outdoor spot | `GET /places/:id`; map `source: place` (`id` still `venue:{id}` until id prefix migrates) | **`PlacePeekCard`** + `PlacePeekBody` |
| **Facility** | Registered amenity with coords (toilet, parking, gas, …) so people can navigate on the map | `GET /facilities/:id`; map `source: facility`, `id: facility:{id}` | Shares Place peek chrome until a dedicated facility peek ships |
| **Destination** | Admin-curated name grouping Places/Facilities; hub page `/destination/:slug` | `areas` store; **`destinationId` / `destinationSlug` on pin rows** — **no** `source: area` pin | Hub page + “Destination · {name}” on Place peek. Peek modules under `peek/destination/` are for the hub page, not explore pins. |
| **`venue` / `catalog_place`** | Legacy map `source` aliases | Normalize to `place` (`isPlaceMapSource`) | Same as Place |
| **`place.destinationId`** | Links a **Place** to its **Destination** hub | `locations.destinationId` → `destinationSlug` / `destinationName` on Place rows | **Destination · {name}** on **Place** peek |

**Naming rules (FE):** One shared **`MapPeekShell`**; entity parts **`{Entity}Peek*`** under `peek/{activity|place|area|shop}/`. Do **not** add `Explore*Peek*` modules. Do **not** emit `source: 'area'` on `GET /explore/map`. Helpers: `isPlaceMapSource`, `isFacilityMapSource`, `isGeographyMapSource`.

**Pro account storefronts (one user, optional tenant per subtype)** — each has a **public profile URL**; map and People discovery differ by subtype:

| Subtype | Profile URL | Map pin? | How members find them |
|---------|-------------|----------|------------------------|
| **Professional** (`pro_guide`) | `/member/:userId` | **No** | **People** browse (member directory) **or** host row on activity peek/detail |
| **Shop** (`shop` tenant) | `/shop/:id` | **Yes** (Shops lens) | Map pin + shop profile |
| **Tour agency** (`agency`) | `/agency/:slug` | **No** | **Host / operator row** on activity peek and `/activity/:id` only (brand name → agency profile) |
| **Buddy / community host** | `/member/:userId` | Via activities only | People + activity host row |

Wire: `publishingProfileKind` on `ActivityDTO`; paths via `resolveActivityPublisherProfilePath` (`packages/shared-types/src/activity-publisher-display.ts`). **Explore copy:** headlines always use `resolveActivityHeadlinePersonName` (human); peek/list publisher row uses `resolveActivityPublisherRowPrimaryName` (person vs operator brand); section noun `exploreActivityPublisherSectionNoun` — all in `packages/shared-types/src/activity-actor-display.ts`. **`ActivityDTO.hostName`** is the on-ground **person**, not tenant brand. **Do not** emit `source: agency` explore map rows. List/peek/detail read a denormalized **`tenantLogoUrl`** plus compact **`guides[]` / `acceptedGuideCount`** on `ActivityDTO` (explore map nested activity — no extra profile fetch). Agency/shop assign extra guides without consent; community/pro-guide extras stay `pending` until they accept (`activity_guide_invite`). Public pages omit pending guides. Peek shows a **count** when more than one accepted guide; full `/activity/:id` lists accepted guides with `/member/:id` links.

**Code anchors:** `packages/shared-types/src/place-kind.ts` · `apps/api/src/lib/explore-map-destination-lens.ts` · `apps/api/src/lib/explore-map.ts` (`attachExploreItemArea`) · `src/explore/hostingPublishDestination.ts` · `GET /destinations/:slug` preview · [`DOMAIN.md`](./DOMAIN.md) § Geography.

**Known read-path gap (do not confuse with write contract):** legacy or tenant-only shop pins may lack `destinationId` on the explore payload until linked/backfilled; **new** catalog places and gated publishes must have **`place.destinationId`**.

#### 12.1.2 Geo tree drill (geo hub — alongside curated Area)

| Layer | Storage | Consumer URL | Role |
|-------|---------|--------------|------|
| Country → state → area → **destination** (`geo_nodes` L4 `kind: venue`) | `geoRef` on map pins | **`/geo/n/:id`** (`GeoHubView`) | Rollup browse: places, outings, facilities under the node |
| Curated **Destination guide** | `areas` | **`/destination/:slug`** | Editorial hub — parallel to geo area, not a replacement |
| Catalog **place** row | `locations` | **`/place/:id`** | Shareable entity; hub rows may group children via `parentPlaceId` |
| Event outdoor site | `locations` (`event`) | **`/venue/:id`** | Not the same as geo L4 **venue** (destination name in `geoRef`) |

**L2 list/peek location tail:** `resolveDiscoveryBrowseGeoHubPath` — tap **geo L4** when `geoRef.venueId` is set, else **curated area** when `areaSlug` is set. Full breadcrumbs stay on hub + detail pages, not on thumbnails.

**Canonical hub browse:** `/geo/n/{venueNodeId}` for destination marketing; deep links remain `/activity/:id`, `/place/:id`, `/facility/:id`.

---

## 13. Structural module naming (bounded context — not synonym swaps)

**Problem:** Early code prefixed symbols with **product surfaces** (`Host`, `Explore`, `Plan`, `Browse`, `Trip`) or **renamed synonyms** (`Host` → `Organizer` → `Operator`) in component filenames. That duplicates context already carried by **routes**, **headers**, or **props**, and breaks reuse (e.g. a “message” control used on activity detail, shop profile, and member cards).

**Rule:** Name **modules** by **bounded context** ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §3). Name **props** with neutral ids (`memberUserId`, `activityId`). Put **role words** in **copy** (`messageLabel`, `workspaceVocabulary`), not in shared component filenames.

**Mental model (canonical):** One **Activity** entity; **member capabilities** (`canPublish`, profile complete, tenants they may represent); **per-activity viewer access** (join, manage roster, crew surfaces). Do **not** invent a second product noun (**operator**, **host**) in TypeScript for things that are already scoped by **`tenantId`**, **`x-organisation-id`**, or **activity id**.

| Layer | Question | Name in code (target) |
|-------|----------|------------------------|
| Entity | What is this outing? | **Activity** — DTOs, `src/activity/*`, `components/activity/*` |
| Member-wide gates | May this user publish / open the publishing workspace? | **`useMemberStatus`** · **`GET /me/status`** (`publish` nested) — not `/me/publish-*` or “operator status” in UI |
| Tenant-scoped HTTP | List/publish/manage for **this tenant** | **`GET /publishing/activities`** (mount prefix only until SN-4); client **`listActivities(tenantId)`**, **`getActivityJoinRequests(tenantId)`** — not `*OperatorActivity*` / `*HostActivity*` on every symbol |
| This activity, this viewer | May they see Buddies / approve joiners? | **`viewerAccess`**, entitlements on activity detail wire |

**Freeze (Oct 2026):** Do **not** add new `Operator*` identifiers (hooks, client functions, component names) except **route/page shells** already named (`src/pages/publishing/*`, lazy `Operator*` pages). Migrate **toward** activity + publishing-access vocabulary per [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.8 **SN-3**.

### 13.1 Anti-patterns (do not repeat)

| Mistake | Example | Do instead |
|---------|---------|------------|
| **Synonym rename** | `HostMessageButton` → `OrganizerMessageButton` | `MessageMemberButton` in `src/components/chat/` |
| **Surface prefix on shared UI** | `ExploreFooButton` used outside explore | `FooButton` in the owning context, or `explore/*` only |
| **Role in filename when route/header already scopes** | `cancelHostActivityById`, `listOperatorActivities` | `cancelActivity(tenantId, id)` in **tenant activity client**; scope = `tenantId` + `/publishing/*` |
| **Fake persona in API names** | `useOperatorStatus`, `/me/operator-status` as canonical | **`useMemberStatus`** + **`GET /me/status`**; publish under **`status.publish`** |
| **Marketing word as global prefix** | `Plan*` hooks in `src/utils` | `src/member-plan/*`, `src/components/plan/*` |
| **Second inbox route** | `/host/messages` | `/messages` only (`COMMUNICATION.md`) |

### 13.2 When a prefix is still correct

| Prefix / name | OK because |
|---------------|------------|
| **`/publishing/*` HTTP mount** (canonical) | Stable tenant publishing routes; **not** a license to prefix every TS symbol with `Operator` ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.8 SN-4 drops `/host` mount). |
| **`src/pages/publishing/*`** | Console **surface** route folder; pages inside still operate on **activities**. Object names (`Overview.tsx`), not `OperatorOverview.tsx`. |
| **`src/pages/admin/*`** | Ops **surface** route folder (`/admin`). Object names (`Organisations.tsx`, `Members.tsx`); do **not** prefix every file `Admin*`. |
| **Legacy shims** | `useOperatorStatus`, `usePublishingAccess`, `/me/host-status`, `/me/operator-status`, flat-only `HostStatusDTO` — **deprecated**; no new call sites. |
| Remaining `Explore*` map chrome under `src/explore/ui` | Shell files until a dedicated pass. **Do not add** new `Explore*` files — folder is the namespace. Entity lists/follows/people live in `crew-discovery` / `discovery`. |
| `Plan*` under `src/components/plan`, `src/member-plan` | Member schedule surface (`/plan`). |
| `List*` under `src/list/**` | Full-screen list explorer (`/list`). |
| Wire `hostUserId`, `HostStatusDTO` | Storage/API until dual-read migration ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.8 P4–P5). |

### 13.2.1 Target tenant activity client (SN-3)

One facade (e.g. `src/hooks/tenantActivityClientApi.ts` — name TBD at implementation) exported from a single module; **ban** new imports of `hostActivityClientApi`. Preferred symbols:

| Concern | Target (tenant-scoped) | Wire (unchanged) |
|---------|------------------------|------------------|
| List tenant outings | `listActivities(tenantId)` | `GET /publishing/activities` |
| Join queue | `getActivityJoinRequests(tenantId, { activityId? })` | `GET /publishing/requests` |
| Decide request | `decideActivityJoinRequest(tenantId, requestId, status, hostNote?)` | `PATCH /publishing/requests/:id` (`hostNote`) |
| Roster | `getActivityParticipants(tenantId, activityId)` | `GET /publishing/activities/:id/participants` |
| Lifecycle | `publishActivity`, `cancelActivity`, `updateActivity`, `duplicateActivity` | `/publishing/activities/:id` … |

**Member capabilities** (not activity-scoped): **`useMemberStatus`** → `GET /me/status` with **`profileComplete`** + **`publish`** (`canPublish`, `canAccessPublishingWorkspace`, `ownedProfiles`, …) — no duplicate flat publish fields on the wire.

### 13.3 Communication slice (canonical)

| Need | Symbol | Notes |
|------|--------|--------|
| Open DM with a member | `MessageMemberButton` | `memberUserId`, optional `activityId`, `messageLabel` for a11y |
| Deprecated | `HostMessageButton`, `OrganizerMessageButton` | Shims only — `moduleNamingGuard.test.ts` |
| Inbox route | `MESSAGES_PATH`, `messagesToUserPath` | One inbox; no host shell variant |

### 13.4 Phased program (implementation)

Tracked in [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.8 **P5** and [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) **C21** / **S11**. Order: **policy + guards** → **folder moves with shims** → **client API normalize** → **wire dual-read** → **drop legacy mounts**.

**Guards:** `src/config/moduleNamingGuard.test.ts`, `hostMemberGuard`, `publishingConsoleHookGuard`, `planHubInboundGuard`, `workspaceProductLanguageGuard`.

### 13.5 Naming backlog (NC-*)

| ID | Target |
|----|--------|
| NC-B | Normalize notification `meta` — **mostly done**; paths via `apps/api/src/lib/member-routes.ts` |
| NC-C | Surface paths via `routingCatalog` — **in progress** |
| NC-D | Remove `legacyApi` spread — **done** |
| NC-E | Optional dot-style notification `kind` migration |
| NC-F | `outdoorMap*` → `journeyMap*` **done**; explore helpers under `src/explore/` **done**; shrink `src/utils/` domain files (§12) |
| NC-G | Demand vs wishlist — **done** |
| NC-H | **Structural naming P5** — activity-centric client + **`useMemberStatus`**; `/publishing` HTTP; optional `Organisation*` file renames (storage `tenantId` unchanged) |

**Verify:** `npm run verify:system` · `moduleNamingGuard.test.ts` · `apps/api/tests/naming-coherence.test.ts`

---

## 14. External map navigation (pinned coordinates)

Any **place, venue, activity meeting point, shop, parking pin**, or other consumer surface with `latitude` / `longitude` (or map preview) must use one pipeline:

| Intent | UI | Module |
|--------|-----|--------|
| **Navigate** (Google / Waze / Apple, remembered preference) | `DirectionsControl` or `PlaceDirectionLinks` | `src/components/ui/DirectionsControl.tsx` · `src/utils/mapLinks.ts` · `src/utils/preferredNavigationApp.ts` |
| **View pin** (read-only, Google search) | `ViewOnMapLink` | `src/components/ui/ViewOnMapLink.tsx` → `buildGoogleMapsSearchUrl` |
| **In-app map tile** (Leaflet preview, no drive links on canvas) | `MeetingPointMap`, `MapPlacePicker`, explore map | No raw `google.com/maps` / `waze.com` literals in feature code |

**Explore peek:** use `discoveryCardShowPeekBodyDirections` so footer + inline directions are not duplicated (`src/discovery/discoveryCardModel.ts`).

**Guard:** `src/config/mapNavigationGuard.test.ts` (included in `npm run verify:domain`).

---

## 15. Viewer access & detail exposure (authorization model)

**Purpose:** One **standardized access-control system** for “who may see full entity detail vs map peek vs sign-in prompt.” Separate from **member capabilities** (`canPublish`, publishing workspace) and from **join CTAs** (`participationMode`, `joinRequestUi`).

**Related:** [`CREATE_FLOW.md`](./CREATE_FLOW.md) (discovery + participation fields) · [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) (capabilities ≠ viewer access) · [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §7 **C16** · [`API_ROUTING.md`](./API_ROUTING.md) (activity detail route)

**Cursor (agents):** `.cursor/rules/viewer-access.mdc`

---

### 15.1 Access layers (do not conflate)

| Layer | Question | Canonical source | Never use for |
|-------|----------|------------------|---------------|
| **0. Identity** | Is there a signed-in member? | `req.auth` / `viewerUserId` | Host tier, Pro, roster |
| **1. Platform role** | Admin / merchant / tenant job on JWT? | `UserRole`, `PLATFORM_ADMIN` bypass | Consumer Host / publish gates |
| **2. Member capability** | May this account **act** (Host / publish, publishing workspace, paid publish)? | `MemberStatusDTO` / `publish`, **`member-status.ts` only** | Reading someone else's activity |
| **3. Entity discovery** | Is this row on the explore map vs link-only? | `ActivityJoinMode` | RSVP vs approval |
| **4. Participation** | How do you join the roster? | `ParticipationMode`, demand requests | Detail payload depth |
| **5. Social viewer access** | Relationship to **this** entity (host, participant, …)? | `*-viewer-access.ts` resolvers | `canPublish`, Pro SKU |
| **6. Detail exposure** | What payload depth for this surface? | `DetailExposure`, `viewerAccess` on API | Ad-hoc FE `if (!user)` |
| **7. Entitlements (future)** | Paid / Pro / premium unlock on top? | **TBD** `entitlements` service | Replacing roster rules |

**Today:** `computeActivityDetailExposure` implements **layer 6 for activities** from **layers 3 + 5** only. That is the correct *slice* for map peek / join-to-see-detail — not the whole access system.

**UI copy:** `joinMode: open` means **listed on map**, not “open to view full detail.” Product labels: *Listed on map* / *Link-only plan* in organize audience step ([`CREATE_FLOW.md`](./CREATE_FLOW.md) § audience / join mode).

---

### 15.2 Canonical resolvers (server — single write path)

| Entity | Resolver | Tests | HTTP surfaces |
|--------|----------|-------|----------------|
| **Activity** | `apps/api/src/services/activity-viewer-access.ts` → `buildActivityViewerAccess` (`resolveActivityViewerAccess` alias) | `apps/api/tests/activity-viewer-access.test.ts` | `GET /activities/:id`, future redaction on `GET /explore/map` items |
| **Member profile** | `resolveProfileViewerAccess` + `computeProfileDetailExposure` (`profile-viewer-access.ts`) | `profile-viewer-access.test.ts`, shared-types | `GET /member/:userId/profile` → `{ data, viewerAccess }`; guests `sign_in` only |
| **Place (catalog)** | Public read today — no roster | — | `GET /places/:id` |
| **Shop / operator** | **TBD** — policy in §15.4 row “shop profile” | — | Shop public pages |
| **Member availability** (Find crew) | `member-availability-store`, explore availability pins | `memberAvailabilityLineageGuard`, map assembler skips retired seeking activities | `PUT /me/availability`; map `source: availability` — peek via `AvailabilityPeekActions` |

**Rule:** Routes call the resolver; they do **not** embed parallel `if (!user)` trees. Frontend **must not** invent roster/detail policy (see §15.6 interim drift).

**Access context (input to activity resolver — Phase 2):**

```ts
type ActivityAccessSurface =
  | 'explore_map'      // peek card projection
  | 'activity_route'   // /activity/:id (share link, notification)
  | 'publishing_workspace'
  | 'notification_link';
```

Same activity may resolve differently by `surface` (e.g. link-only private plan vs cold map open).

---

### 15.3 Wire contract (target — implement in phases)

**Enums** (to live in `packages/shared-types` when Phase 2 ships):

| Symbol | Values | Meaning |
|--------|--------|---------|
| `DetailExposure` | `full` \| `redacted` \| `none` | Payload depth returned to client |
| `ViewerGateReason` | `sign_in` \| `join_required` \| `invite_only` \| `null` | What the UI should prompt (not authorization by itself) |
| `ActivityViewerAccessLevel` | `public`, `denied`, `host`, `participant`, `join_request`, … | Audit / analytics; already in API service |

**Activity detail response (target shape):**

```ts
{
  data: ActivityDetailDTO | ActivityRedactedDTO | ActivityPrivateStubDTO;
  viewerAccess: {
    exposure: DetailExposure;
    level: ActivityViewerAccessLevel;
    gateReason: ViewerGateReason;
    canOpenDetailPage: boolean;  // FE route + title link
    canAccessCrewSurfaces: boolean; // meeting precision + group roster/chat (not consumer tab labels)
  };
}
```

**Legacy:** `ActivityDetailDTO.visibilityState: 'full' | 'private'` maps to exposure until clients migrate (`full` → `full`, `private` stub → `none`).

**Explore map item (target — optional field on activity/demand pins):**

```ts
viewerAccess: {
  canOpenDetailPage: boolean;
  gateReason: ViewerGateReason;
  mapPeekActions?: ActivityMapPeekAction[]; // explore map activity pins only
  mapPeekStrips?: ActivityEngagementStripsDTO; // peek Participants + Logistics zones (`pendingJoinInviteCount` for host/crew invite chip)
};
```

Computed server-side via **`resolveActivityEngagementPolicy`** → `intents` (+ `projectActivityMapPeekActions` after entitlements) on explore map; activity detail returns `policy.presentation` on `GET /activities/:id`. Client maps wire ids; do not re-derive role matrices in React (`request_join`, `pending_join`, crew/DM invite ids). **Wire vocabulary:** use **rideshare** in `ActivityMapPeekActionId` and domain fields (`link_rideshare`, `offer_rideshare`, `rideshareEnabled`, `linkedRideshareActivityId`) — not `carpool` (UI copy may still say “carpool” where product prefers plain language).

---

### 15.4 Policy matrix (product contract — lock before Phase 2 code)

**Status:** **VA-2–VA-7 shipped** for activities, demand, shops, and public venues on `GET /explore/map`. Private activity `link_holder` on detail route may still differ from open-map policy — see notes column.

| Discovery (`joinMode`) | Viewer | Surface | Exposure (TARGET) | `gateReason` | Notes |
|------------------------|--------|---------|-------------------|--------------|--------|
| `open` | anonymous | map peek | listed pin; detail CTA = `guest_gate` | `sign_in` | **LIVE** — guests do not open `/activity/:id` |
| `open` | anonymous | `/activity/:id` | `none` | `sign_in` | **LIVE** — sign-in card only; no tabs / crew |
| `open` | member, not on roster | map + `/activity/:id` | `redacted` | `join_required` | **LIVE** — marketing detail; no crew surfaces |
| `open` | confirmed participant / host / staff | any | `full` | `null` | Roster on crew |
| `open` | pending / waitlisted request | detail | `redacted` | `null` | May open page; no meeting/roster/chat (`canAccessCrewSurfaces: false`) |
| `open` | host / tenant staff | any | `full` | `null` | **LIVE** |
| `private` | anyone | map / Browse / lists | hidden | — | **LIVE** — never public-discoverable |
| `private` | anonymous | `/activity/:id` | `none` | `invite_only` | **LIVE** — lock stub, no outing title |
| `private` | signed-in, not invited | `/activity/:id` | `none` | `invite_only` | **LIVE** — host/invitee/group/roster only |
| `private` | invited friend / group member / pending request | `/activity/:id` | `redacted` | `null` | **LIVE** — may open; no crew until on roster |
| `private` | participant / host | any | `full` | `null` | **LIVE** |
| **Demand** | anonymous | map peek | `redacted` | `sign_in` | **TARGET** — align with activity peek rules |
| **Demand** | approved joiner | map / future detail | `full` | `null` | Intent request queue |
| **Place** | anyone | detail pages | `full` | `null` | Public catalog |
| **Shop** | guest | map peek + detail | `redacted` | `sign_in` | **LIVE** — shop map viewer access resolver; FE uses `viewerAccess` |
| **Shop** | signed-in member | detail | `full` | `null` | **LIVE** |

**Participation axis (unchanged):** `participationMode` only affects **how** you join (`I'm going` vs `Request to join`) and `joinRequestUi` — not map discovery. Demand never has `participationMode` ([`CREATE_FLOW.md`](./CREATE_FLOW.md)).

**Engagement CTAs (peek footer + detail footers + strips):** Same viewer state → same affordances on map peek and `/activity/:id`. Full state matrix (guest, Pro, joined, host): `activity-detail-cta-matrix.test.ts` · `mapDetailEngagementParity.test.ts` · §15 below.

**Consumer detail tabs (UI only):** **Plan · Place · Buddies · Transport** — not wire field names. Tab content maps to existing DTO slices (`description` / `meetingPoint` / `participants` / `rideshare*`). **`canAccessCrewSurfaces`** gates Place body + Buddies roster/chat surfaces; Transport **reach-by** remains visible without crew; linked rideshare summary may be public per peek policy.

---

### 15.5 Guest presentation layer (signed-out UX only)

**Not security.** Used when `gateReason === 'sign_in'`.

| Module | Role |
|--------|------|
| `src/content/guestBrowseGateCopy.ts` | `GuestBrowseGateIntent` → title/body |
| `src/content/guestJoinCopy.ts` | Join-sheet variants (`join-activity`) |
| `ExploreGuestSignInCard` / `ExploreGuestJoinSheet` | UI |
| `openGuestSheet()` in `useActivityJoinFlow` | Trigger from peek CTAs |

| Intent | When |
|--------|------|
| `peek-details` | Guest tapped detail-adjacent surface on explore |
| `join-activity` | Guest tapped join / gated plan trip |
| `plan-hub` / `explore-people-browse` / `explore-social` | Signed-in **Plan** hub (`/plan`) / **browse people panel** on map (`view=people`; legacy `view=social`, `view=going`) — **not** public map list or `/list` |

**Rule:** Authorization outcome comes from **§15.2**; guest copy only explains **why to sign in**.

When `gateReason === 'join_required'`, use join/footer CTAs — **not** `guestBrowseGateCopy`.

---

### 15.6 Frontend mapping (target — thin layer)

**Modules:** `src/access/mapViewerAccessToUi.ts`, `src/access/resolvePeekDetailAccess.ts`

| `viewerAccess` | Peek title / detail CTA | Route guard |
|----------------|-------------------------|-------------|
| `canOpenDetailPage` + link | `<Link to={path}>` | render full page |
| `gateReason: sign_in` | button → `openGuestSheet` + `guestBrowseGateCopy('peek-details')` | gate card |
| `gateReason: join_required` | non-link title; footer join | gate card or inline hint |
| `exposure: none` | same as private stub | lock screen |

**Join UI only:** `src/utils/joinRequestUi.ts` — pending / confirmed for **buttons**, not for detail policy.

---

### 15.7 Interim drift (do not extend — migrate off)

| Location | Problem | Phase to remove |
|----------|---------|-----------------|
Peek/detail UI: `src/access/resolvePeekDetailAccess.ts` + `mapViewerAccessToUi.ts` only — no parallel policy modules. Activity detail uses **`viewerAccess.exposure`** on the response envelope (not `visibilityState` on `data`).

---

### 15.8 Implementation phases (execute in order)

| Phase | Outcome | Touch |
|-------|---------|--------|
| **VA-0** | This section + **C16** register + agent rule | Docs only ✅ |
| **VA-1** | Product sign-off on shop guest + any `surface` nuances | Product / eng (partial ✅ open/private matrix) |
| **VA-2** | `computeActivityDetailExposure` + API resolver | `shared-types`, `activity-viewer-access.ts` ✅ |
| **VA-3** | `GET /activities/:id` → `viewerAccess` + redacted/full/none | `registerPublicActivityRoutes.ts` ✅ |
| **VA-4** | Public map guest `viewerAccess`; signed-in peek via `GET /me/discover/overlay` | `explore-map-viewer-access.ts` + overlay read (COH-08) ✅ |
| **VA-5** | `mapViewerAccessToUi`; peek + `ActivityDetail` consume wire; unify guest lock copy | `mapViewerAccessToUi.ts`, `ActivityDetail.tsx` ✅ |
| **VA-6** | Single FE peek resolver (`resolvePeekDetailAccess`) | `src/access/resolvePeekDetailAccess.ts` ✅ |
| **VA-7** | Shop profile row in §15.4 + resolver | `catalog-viewer-access.ts` + map enrich ✅ |

**Verify each phase:** `npm run verify:system:quick` minimum; API phases require `activity-viewer-access.test.ts` green before FE relies on fields.

**Do not** ship VA-5 before VA-3 — otherwise UI and API disagree (current risk).

---

### 15.9 Checklist (any PR touching peek, detail, or join)

1. Which **axis** (§15.1)? If detail/peek → **D**, not A or C alone.
2. Updated **API tests** if policy changed?
3. No new policy in React — only `mapViewerAccessToUi` + API fields (except during VA-0–VA-2 drift window).
4. Guest strings from `guestBrowseGateCopy` / `guestJoinCopy` when `sign_in` only.
5. Tier-1: this section + [`CREATE_FLOW.md`](./CREATE_FLOW.md) if discovery/participation wording changes.
6. `npm run verify:system:quick`.

---

### 15.10 Future-proof structure (Pro, tiers, admin)

Use a **pipeline** per request — do not grow one god-function or scatter checks in React.

```text
ViewerRequestContext
  → platform overrides (admin, support)
  → entity resolver (activity | profile | place | shop)
       → relationship level (host, participant, denied, …)
       → social exposure policy (computeActivityDetailExposure for activities)
       → entitlement policy (future: pro_detail, premium_place, …)
  → ViewerAccessDTO + redacted | full payload
```

**`ViewerRequestContext` (target type — introduce when adding Pro/detail SKUs):**

| Field | Purpose |
|-------|---------|
| `viewerUserId` | `null` = guest |
| `platformRole` | Coarse JWT role (`UserRole`) — shell routes, admin |
| `hostStatus` | Optional snapshot from **`GET /me/status`** — **capabilities only**, loaded server-side for mutations; avoid shipping whole DTO on every public read |
| `surface` | `explore_map`, `activity_route`, `publishing_workspace`, … |
| `tenantScope` | `x-organisation-id` when acting as business host |

**Where each concern lives:**

| Concern | Layer | Example |
|---------|-------|---------|
| Guest vs signed-in | 0 | `gateReason: sign_in` |
| Platform admin sees all | 1 | Early bypass in resolver (already `platform_admin` level) |
| Buddy vs agency **can publish** | 2 | `canPublish`, `canHostPaidActivities` — Host FAB, `POST /host/activities` |
| Community / pro / business **labels** | 2 | `hostTiers`, `profileRoleLabel` — profile chrome only |
| Full activity because you're on the crew | 5–6 | `participant` → `exposure: full` |
| Full trail guide PDF because Pro | **7** | `gateReason: upgrade_required` + link to `PRO_MEMBERSHIP_PATH` — **not** `join_required` |
| Host sees own outing in console | 5 | `level: host` on entity, not `canPublish` |

**Extending `ViewerGateReason` (when needed):** add `upgrade_required`, `pro_membership`, `admin_only` — map in `mapViewerAccessToUi` to the right CTA (Pro page vs sign-in vs join).

**Anti-patterns:**

- Checking `canPublish` or `hostTiers.professional` to show **another member's** activity detail.
- New `explorePeekDetailAccess`-style modules per feature — add a resolver stage or entitlement rule + test.
- Using `UserRole === TENANT_GUIDE` for product gates — use `HostStatusDTO` ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md)).

**Code placement (steady state):**

| Piece | Location |
|-------|----------|
| Capability tiers | `apps/api/src/services/member-status.ts` |
| Activity social access | `activity-viewer-access.ts` + `computeActivityDetailExposure` |
| Activity detail pipeline | `compose-activity-viewer-access.ts` (loads buddy entitlement context) → social then `applyActivityViewEntitlements` |
| Profile social access | `profile-viewer-access.ts` |
| Member audience ladder | `packages/shared-types/src/member-access.ts` — `MemberAudience`, `hostPublishEntitlementDenial` |
| Future entitlements | `apps/api/src/services/member-entitlements.ts` — composes **after** social exposure |
| Wire DTO | `packages/shared-types` — `ActivityViewerAccessDTO`, later `EntitlementDenial[]` if needed |
| Guest copy | `guestBrowseGateCopy` — **presentation** for `sign_in` only |

**Refactor note:** When Pro-gated detail ships, **wrap** `resolveActivityViewerAccess` with `applyActivityViewEntitlements` — do not fold Pro into `computeActivityDetailExposure`.

---

### 15.11 Naming vocabulary (wire vs pipeline vs UI)

**Problem:** `resolve*` + sentence-long helpers (`activityViewerEntitlementsCanViewFullBuddyRoster`) read like React policy and hide the HTTP contract.

| Layer | Lead with | Examples | Do not |
|-------|-----------|----------|--------|
| **HTTP / wire** | Route + DTO field | `GET /activities/:id` → `viewerAccess.entitlements.canViewFullFriendRoster`; `GET /me/status` → `publish.canPublish` | New public `resolve*` in `src/` that recomputes access |
| **Shared policy** | `compute*` / `build*` on inputs → DTO | `computeActivityDetailExposure`, `buildActivityPresentationDTO`, `computeActivityMapPeekActions`, `computeActivityViewerEntitlements` | Export `activityViewerEntitlementsCan*` — use DTO booleans in UI |
| **API composition** | One composer per surface | `composeActivityViewerAccess` for activity detail + map enrich; buddy/host context loaded **inside** route/composer, not a second public service name | Scatter `resolveActivityView*` loaders imported from routes |
| **FE presentation** | `map*` / `*Presentation` / `*ToUi` | `mapViewerAccessToUi`, `resolvePeekDetailAccess`, wire `presentation` + `mapPeekActions` → components (shim during Phase 4: `activityDetailPresentation.ts`, `activityPeekEngagement.ts`) | `computeActivityDetailExposure` in `src/`; crew gates from `isHostUser` when `viewerAccess` is present |

**Repository / store names** (`listActiveTenantMembershipsByUser`, `findTenantMembershipContext`) are **data access** — not viewer-access vocabulary; rename only with a dedicated tenant-membership pass (out of §15 scope).

**Phased cleanup:** `memberSurfacesAcceptance` · `memberBrowseRowModel` — see [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.3.
