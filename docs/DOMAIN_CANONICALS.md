# Domain objects, canonical names & routing

**Purpose:** One vocabulary for **entities**, **wire/storage names**, **TypeScript symbols**, **public URLs**, and **HTTP paths**. Use this for naming and routing hygiene passes — not ad-hoc synonyms per PR.

**Related:** [`DOMAIN.md`](./DOMAIN.md) (glossary depth) · [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) (§ Naming vocabulary) · [`API_ROUTING.md`](./API_ROUTING.md) (HTTP) · [`NAVIGATION.md`](./NAVIGATION.md) (surface contract) · [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) (bounded contexts)

**Code entry:** `src/config/routingCatalog.ts` (paths — **import this in pages/components/utils**) · `src/config/platform.ts` (map config, feature flags, chrome helpers) · `packages/shared-types/src/entity-path.ts` (`EntityRef`)

**Align script:** `node scripts/align-routing-imports.mjs` (repeatable after adding path constants to the catalog).

**Checks:** `npm run verify:domain`

---

## 1. Canonical entities (product objects)

There are **five public entity kinds** on the wire (`EntityKind` / `EntityRef`):

| Kind | Product name | Mongo / wire | Never add |
|------|--------------|--------------|-----------|
| `place` | **Place** | `locations`, `LocationDTO` | Second “Venue” entity |
| `activity` | **Activity** (outing / plan) | `activities`, `ActivityDTO` | `Trip`, `TripDTO`, `Event` row |
| `organisation` | **Host storefront** (guide / agency / partner tenant) — wire name `organisation`; see §1.5 | `tenants`, `/operator/:slug` (partner route TBD) | A second “organizer” entity table |
| `shop` | **Shop** (outdoor retail brand + catalog) | `merchant_profiles` + SHOP `tenants` | “Merchant”, “Partner” for shops |
| `person` | **Person** / member | `users` (profile fields) | “User” in consumer copy |

**Demand (Find)** is not a sixth entity kind on URLs — it is a **`participant_intent`** row surfaced on the map; deep links use explore pin/query (`exploreDemandMapItemPath`), not `/demand/:id`.

**Trips** is a **UI hub** (`/trips`) for relationships to activities and saves — not a domain type.

**Campaigns** (future) are not a seventh entity kind — they are **surfaces** that promote Activities and/or link to host storefronts (agencies, partners, shops) in “What’s happening” feeds. See §1.2.

---

### 1.1 Words that must not be confused

| Term | Layer | Meaning | Do not use for |
|------|--------|---------|----------------|
| **Organize** | Product verb | FAB path: publish an **Activity**, run **Find** (demand), or **Add** a **Place** | Writing a message |
| **Create** | Product verb (OK) | Same intent as Organize in casual copy (“create a plan”) | Replacing **Organize** in FAB labels without reason |
| **Compose** | **Wire / code only** | Explore query `?compose=organize:*` \| `find:*` \| `add:*` (`compose.ts`, `composeFlowCatalog.ts`) | User-facing buttons, push copy, help text — reserved for **message compose**, email compose, post draft (future) |
| **Host** | Product role | Anyone who **publishes** (buddy → pro guide → agency → shop owner → partner) | The Mongo `tenants` row name in UI |
| **Organisation** | Code + wire | Tenant scope: `Organisation*`, `x-organisation-id`, `EntityKind: organisation` | Solo guide or shop in **consumer** copy — say **guide**, **agency**, **shop**, **partner** |
| **Organizer** | Legacy wire | `organizerId`, `organizerDetails` on old payloads | New product nouns — prefer **host** (activity) or **tenant** (storage) |
| **Partner** | Product kind | Hotel / campaign / brand **host storefront** — not a shop, not a tour agency | Outdoor gear **shop**; do not call shops “partners” in UI |
| **Agency** | Product kind | **Tour operator** — join trips remotely; storefront is **not** “visit this pin to join” | Gear **shop**; map **Place** venue |
| **Shop** | Product kind | **Outdoor retail** — directions, hours, picks; may have a **map pin** (Place) + `/shop/:id` | Tour **agency**; hotel **partner** |

**Member profile “public”** does **not** mean guests. Setting `profileVisibility: public` allows other **signed-in members** to open the **public card** on `/member/:id`. **Guests** get sign-in prompt only (API policy in P3). See [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Profile visibility.

Full glossary depth: [`DOMAIN.md`](./DOMAIN.md) · FAB spec: [`CREATE_FLOW.md`](./CREATE_FLOW.md).

---

### 1.2 Map discovery: **Where** vs **Who**

Explore and campaigns answer two questions. Do not merge them in copy or DTOs.

| Lens | Question | Map / feed examples | Entity kinds |
|------|----------|---------------------|--------------|
| **Where** | What **place** or **pin** is here? | Trails, camps, venues, **shop pin**, future **partner pin** (hotel) | `place`, shop as **Place** + `shop` storefront |
| **Who** | **Who** is going / hosting / open to connect? | Activities, demand, Explore **going panel** (copy: “Who’s going?”), member cards | `activity`, `person`, **buddy**, **member-discovery** — not `whosGoing` in API/code |

An **Activity** is **Who + When** (often anchored to **Where** via `locationId`). A **tour agency** is **Who** (brand + trips) without requiring a visit pin to participate. A **shop** is primarily **Where** (get directions) plus optional e-commerce on `/shop/:id`.

---

### 1.3 Host storefront kinds (`PublishingProfileKind` — target wire)

One **person** account; zero or more **storefronts** (tenant-backed public brands). Orthogonal to `EntityKind` (§1.5).

| Kind | Product | Map pin? | Join / book model | Public URL (today) |
|------|---------|----------|-------------------|-------------------|
| `community` | Buddy host (no brand page) | Via activities/demand only | Organize on map | `/member/:userId` only |
| `pro_guide` | Pro individual guide | Optional | Activity join / request | `/operator/:slug` |
| `agency` | Tour agency | **No** — not “go to this pin to join” | Activities + paid trips | `/operator/:slug` |
| `shop` | Outdoor shop | **Yes** (Place pin) + online catalog | Directions, featured picks; not trip inventory | `/shop/:id` |
| `ecommerce` | Business Pro — online retail | Optional pin | Catalog / campaigns; not a tour agency | `/shop/:id` or brand URL (TBD) |
| `hospitality` | Business Pro — hotels, venues | Often **yes** | Stays + linked campaigns (future) | TBD |
| `partner` | **Partner** Pro path (top-level) | Often **yes** (campaign pin) | Campaigns + linked Activities (future) | `/partner/:slug` (planned); may alias `/operator` interim |

**Shops ≠ agencies ≠ partners ≠ e-commerce** — separate Pro applications and map rules. Code today: `hostProfileType` `individual` \| `agency` \| `shop`; extend with business **subtype** on Pro Business path ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Pro membership ladder).

---

### 1.4 Shop listing lifecycle (Where + storefront)

| Stage | Who | Product behavior |
|-------|-----|------------------|
| **Catalog / admin** | Platform admin | Shop **Place** + public `/shop/:id` for discovery; no owner console |
| **Claimed** | Business via **Pro Membership** | Ownership verified; moves toward managed tenant |
| **Managed** | Pro shop tenant | Owner console, team, featured picks, profile edit |

**Agencies** and **pro guides** skip the “map pin catalog” path — they are **Who**-led storefronts. **Partners** may combine pin + campaign surfaces (§1.2).

---

### 1.5 `EntityKind` (URLs) vs `PublishingProfileKind` (brand type)

| `EntityKind` | Role on the wire | Paired with |
|--------------|------------------|-------------|
| `place` | Navigable POI | `PlaceKind` (`hiking`, `shop` pin, …) |
| `activity` | Scheduled outing | Host tenant + participation |
| `person` | Member card | `profileVisibility` + profile `viewerAccess` (§15) |
| `shop` | Shop **storefront** + commerce DTO | `PublishingProfileKind: shop` |
| `organisation` | Host **storefront** slug (guide/agency/partner on `/operator` today) | `PublishingProfileKind`: `pro_guide` \| `agency` \| `partner` |

**Do not** rename `EntityKind.organisation` in a drive-by PR. Add `PublishingProfileKind` in `shared-types` and resolve from `tenants` + `host_applications`. Consumer copy: **host profile** / **guide** / **agency** / **shop** / **partner** — not “organisation” or “operator.”

---

## 2. Three naming layers (always specify which you mean)

| Layer | Use for | Examples |
|-------|---------|----------|
| **Product / UI** | Copy, nav labels | Place, Activity, **Organize** (FAB), Friends, Pro Membership — not **Compose** for FAB |
| **Code (preferred)** | New TS symbols, files | `PlaceDTO` semantics, `Organisation*`, `getMemberHostStatus`, `PersonPublicProfile` |
| **Wire / storage** | HTTP paths, Mongo | `/locations`, `LocationDTO`, `activity_requests`, `x-organisation-id` |

**Rule:** Product says **Place**; API may still say `/locations` and `LocationDTO` until a deliberate migration. Do **not** introduce new `Location*` **product** names in UI.

---

## 3. Public URL canon (browser paths)

Built only via **`routingCatalog`** or `@uaetrail/shared-types` `entity-path` helpers:

| Entity | Pattern | Builder |
|--------|---------|---------|
| Place (hike) | `/trail/:id` | `placeDetailPath('hiking', id)` |
| Place (camp) | `/camp/:id` | `placeDetailPath('camping', id)` |
| Place (event venue) | `/event/:id` | `placeDetailPath('event', id)` |
| Activity | `/activity/:id` | `activityDetailPath(id)` |
| Organisation | `/operator/:slug` | `organisationProfilePath(slug)` |
| Person | `/member/:userId` | `memberProfilePath(userId)` |
| Shop | `/shop/:id` | `shopPublicPath({ id })` |
| Browse | `/explore` (+ query) | `explorePath()` in `src/explore/routing.ts` |
| Personal hub | `/trips`, `/profile` | `TRIPS_PATH`, `PROFILE_PATH` |
| Member badges | `/profile/badges` | `PROFILE_BADGES_PATH` — achievements only (no Trail Points) |
| Legacy rewards wallet | `/trail-points`, `/my-rewards`, `/rewards` | Redirect to `PROFILE_BADGES_PATH` |
| Legacy community feed | `/community` | `COMMUNITY_PATH` → `/explore` redirect only (feed removed) |
| Legacy membership marketing | `/membership` | `MEMBERSHIP_MARKETING_PATH` → explore redirect |
| Pro / business | `/profile/pro-membership` | `PRO_MEMBERSHIP_PATH`, `proMembershipPath()` |
| Host console | `/host/*` | `HOST_CONSOLE_LINKS` in `src/constants/index.ts` |

**Parse inbound links:** `parseEntityRefFromPathname(pathname)` → `EntityRef`.

**Legacy redirects only** (do not link in new UI): `/map`, `/discovery`, `/activities` → `/trips` or explore, `/become-host` → Pro Membership, `/merchant/:id`, `/organizer/*` → `/host/*`. Table: [`NAVIGATION.md`](./NAVIGATION.md) § Legacy redirects.

---

## 4. Explore URL canon

| Concern | Canonical | Avoid |
|---------|-----------|--------|
| Map home | `EXPLORE_MAP_PATH` (`/explore`) | `/map`, bare `/shop` |
| FAB deep link (wire) | `compose=organize:*` \| `find:*` \| `add:*` — param name **legacy**; product = **Organize · Find · Add** | User-facing “Compose”; `/host/activities/new` for consumers |
| Panel/filter query | `explorePath({ panel, filter, … })` | Raw `` `/explore?${...}` `` outside `explore/routing.ts` |
| Demand pin | `exploreDemandMapItemPath` (shared-types) | `/demand/:id` |

Explore URL builders live in `src/explore/routing.ts` (re-exported from `config/routingCatalog`); the old `utils/exploreRouting` shim is **removed** (`exploreModuleBoundary.test.ts`).

---

## 5. HTTP API canon (member vs host)

| Scope | Prefix | Header | Examples |
|-------|--------|--------|----------|
| Public read | `/activities`, `/explore/map`, `/places` | — | Browse |
| Member | `/me/*` | Bearer | `participant-intents`, `host-status`, profile |
| Tenant console | `/host/*` | Bearer + `x-organisation-id` | `activities`, **`/host/requests`** (activity join queue) |
| Person public | `/users/:id` | optional | Public profile |

**Kebab-case plurals** on URLs: `participant-intents`, not `intents` or `demand`.

**Client modules:** `src/api/domains/*.ts` — canonical method names (`getOrganisationProfile`, `getMemberHostStatus`, `getPublicPlaces`). No legacy alias layer on `api` (see `apiLegacyGuard.test.ts`).

---

## 6. Type & file naming (new code)

| Prefer | Deprecated alias | Notes |
|--------|------------------|-------|
| `Place`, `getPublicPlaces` | Location (in UI) | `LocationDTO` = wire DTO |
| `Organisation*`, `HOST_CONSOLE_LINKS` | HostOrganization*, `ORGANISATION_CONSOLE_LINKS` | Folder `organisation-console/` |
| `getMemberHostStatus` | `getMyOrganisationStatus` | Tier flags |
| `PersonPublicProfile` | `UserPublicProfile` | Public card |
| `ShopOrganisation*` | Merchant* (client) | Mongo `merchant_profiles` |
| `buildOrganisationActivityPublishPayload` | `buildHostActivityPublishPayload` | Single publish contract |
| `registerHostActivityRequestRoutes` | `*JoinRequest*` (host) | Activity queue only |

**Demand vs activity join:** always qualify — “activity join request” vs “demand join request” ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Naming vocabulary).

**Explore map pins:** `MapPinKind` / `ExploreCardKind` (`components/ui/mapPinTypes.ts`, `explore/exploreCardModel.ts`) — keep in sync; prefer shared-types for new pin metadata.

---

## 7. Routing hygiene rules (enforced in CI)

1. **No consumer links** to `/become-host` — use `PRO_MEMBERSHIP_PATH` (`hostMemberGuard.test.ts`).
2. **No new links** to `/activities` for the trips hub — use `TRIPS_PATH` (`/trips`) (`routingHygiene.test.ts`).
3. **No raw `/explore?…`** outside explore routing module + small allowlist (`routingHygiene.test.ts`).
4. **No `isHostRole(`** for product gates — `canPublish` / `canAccessHostConsole` (`hostMemberGuard.test.ts`).
5. **No banned `api.*` legacy** calls in app code (`apiLegacyGuard.test.ts`).

---

## 8. Hygiene pass checklist (humans / agents)

When renaming or adding routes:

1. Add or use a builder in `routingCatalog` / `entity-path` / `explore/routing.ts`.
2. Update [`NAVIGATION.md`](./NAVIGATION.md) legacy table if adding a redirect.
3. Grep: `become-host`, `/activities`, `isHostRole`, `getMyOrganisationStatus`, `fulfillParticipantIntent`.
4. Run `npm run verify:domain`.

---

## 9. Known intentional duplicates (do not “fix” without migration)

| Duplicate | Why |
|-----------|-----|
| `LocationDTO` vs Place | Mongo `locations` + historical API |
| `tenant` vs Organisation | `x-tenant-id` header |
| `UserRole` vs `HostStatusDTO` | Auth shell vs product capabilities |
| `BecomeHost.tsx` filename | Route component; redirects to Pro Membership |
| `/activities` route | Redirects to `/trips` in `App.tsx` |

---

## 10. Call-site contracts (routing & API client)

**Do not add new `*Routing.ts` files** without updating this section and `systemCoherenceGuard.test.ts`.

| Need | Import |
|------|--------|
| Path constants, entity URLs | `src/config/routingCatalog.ts` (`messagesToUserPath`, `messagesGroupPath`, `myRequestDetailPath`) |
| Explore query (`compose=`, panels) | `explorePath()` — `src/explore/routing.ts` |
| Notification deep link | `inferNotificationPath()` — `src/utils/notificationRouting.ts` only |
| Post-auth / legacy dashboard | `authRouting.ts` (shrink over time) |

| Context | FE module | Canonical calls |
|---------|-----------|-----------------|
| Host tier / publish gate | `memberApi` | `getMemberHostStatus()` |
| Map / demand | `exploreApi` | explore map, participant-intents |
| Buddies / groups / follow | `socialApi` | `/me/buddies`, … |
| Tenant console | `organisationApi` | organisation profile, team, join queue |
| Badges | `badgesApi` | `getMemberBadges()` |

**API client:** `api` merges `src/api/domains/*` only (legacy alias layer removed Oct 2026). **Notification deep links:** `apps/api/src/lib/member-routes.ts` ↔ `src/config/surfacePaths.ts` (`member-routes-alignment.test.ts`). **Resolvers** (`resolve*`) belong in `apps/api/src/services/*` only.

---

## 11. Notification meta (`NotificationMeta`)

Shared shape: `packages/shared-types` → `NotificationMeta`.

| Field | Use |
|-------|-----|
| `kind` | Required — stable string (existing kinds: `join_request_*`, `connection_buddy_*`, `badge`, `goal_*`, …; prefer `domain.action` for **new** kinds) |
| `actorUserId` | Who acted — profile link + actor label (always a **user** id) |
| `activityId`, `groupId`, `requestId`, `intentId` | Entity pointers |
| `path` | Optional; prefer catalog constants; FE rewrites legacy wallet paths |

**Do not add:** `buddyUserId`. Buddy request DTO may still use `fromUserId` / `toUserId`; notifications use `actorUserId` for routing. Chat DMs: `kind: 'message'` + `actorUserId` (legacy `senderId` still read by FE).

---

## 12. Frontend module vocabulary (product ↔ `src/`)

Use this when naming files, hooks, and utils — **one product word per concept**. Detail: [`CREATE_FLOW.md`](./CREATE_FLOW.md), [`DOMAIN.md`](./DOMAIN.md) § entities.

| Product (UI copy) | API / wire | Preferred FE symbol / folder | Do not use for new code |
|-------------------|------------|------------------------------|-------------------------|
| **Find** (FAB) | `participant_intents` | `participantIntent*`, `demandFlow.ts`, explore `source: 'demand'` | “wishlist”, “lookingFor” in filenames |
| **Demand pin** (public map) | same | `ExploreCardSource` `'demand'`, `participantIntentId` on DTOs | Mixing with personal save |
| **Saved map & alerts** (profile/trips) | `user_favorites` (+ watch fields) | `favoriteIsPersonalWishlist`, trips `wishlist` segment | “demand” in wishlist UI |
| **Demand bookmark** (legacy favorite row) | `favorite.participantIntentId` | `favoriteIsDemandBookmark` (`favoriteDemandBookmark.ts`) | Treating as wishlist |
| **Organize** (FAB) | `activities` publish | `organizeFlow*`, `organizeActivityPublish` | `hostActivity` in consumer explore |
| **Trips** (tab) | joined/hosted/self + favorites | `src/trips/tripsRouting.ts`, `components/trips/*` | `/activities` hub naming |
| **My trips map** (`/trips/map`) | `GET /me/trips/map`, `JourneyMapEntryDTO` (`OutdoorMapEntryDTO` deprecated alias) | `journeyMap*` (`src/trips/journeyMap*`, `JourneyMap*` components) | `outdoorMap*` (removed from FE) |
| **Explore map** | `GET /explore/map` | `src/explore/*`, `exploreMapPinModel` | `journeyMap*` (wrong surface) |
| **Place / venue** | `locations` | `place*`, `venue` panel, `Place` in UI | `location` in new routes/components |
| **Friends** | buddies API | `BUDDIES_PATH`, `buddy*` stores only on API | `buddyUserId`, “buddy entity” |
| **Host console** | `/host/*`, tenant | `organisation*`, `OrganisationConsole*` | `tenant` in consumer UI strings |

**Three maps (do not conflate):** (1) **Explore** — public discovery; (2) **Journey map** — personal history + wishlist pins on `/trips/map`; (3) **Place catalog** — venues/shops layers on Explore.

**`src/utils/` policy:** cross-surface helpers only (`authRedirect`, `notificationRouting`, `authReturnContext`, `routingCatalog` consumers). Domain logic belongs in `src/explore/`, `src/trips/`, `src/member/` (`organisationPaths.ts`), `src/host/` (`hostCopy.ts`), `src/components/<domain>/` — not new `utils/demand*.ts` / `utils/outdoor*.ts`.

---

## 13. Naming / alignment backlog (code — not new docs)

Track progress here and in [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §7 (`C11`–`C15`). **Do not create a new markdown file per audit.**

| ID | Target |
|----|--------|
| NC-B | Normalize notification `meta` — **mostly done**; paths via `apps/api/src/lib/member-routes.ts` |
| NC-C | Surface paths via `routingCatalog` — **in progress** (consumer + host + admin `adminSurfacePaths.ts` + `organisationManagePath` via catalog) |
| NC-D | Remove `legacyApi` spread — **done** |
| NC-E | Optional dot-style notification `kind` migration |
| NC-F | **Frontend naming** — `outdoorMap*` → `journeyMap*` **done** (FE); explore pin types unified via shared-types **done**; explore helpers moved to `src/explore/` **done**; remaining `src/utils/` domain files (§12) |
| NC-G | **Demand vs wishlist** — `favoriteDemandBookmark.ts` **done**; removed `favoriteIsLookingForWatch` |

**Verify:** `npm run verify:system` · `apps/api/tests/naming-coherence.test.ts`

---

## 14. External map navigation (pinned coordinates)

Any **place, venue, activity meeting point, shop, parking pin**, or other consumer surface with `latitude` / `longitude` (or map preview) must use one pipeline:

| Intent | UI | Module |
|--------|-----|--------|
| **Navigate** (Google / Waze / Apple, remembered preference) | `DirectionsControl` or `PlaceDirectionLinks` | `src/components/ui/DirectionsControl.tsx` · `src/utils/mapLinks.ts` · `src/utils/preferredNavigationApp.ts` |
| **View pin** (read-only, Google search) | `ViewOnMapLink` | `src/components/ui/ViewOnMapLink.tsx` → `buildGoogleMapsSearchUrl` |
| **In-app map tile** (Leaflet preview, no drive links on canvas) | `MeetingPointMap`, `MapPlacePicker`, explore map | No raw `google.com/maps` / `waze.com` literals in feature code |

**Explore peek:** use `exploreCardShowPeekBodyDirections` so footer + inline directions are not duplicated (`src/explore/exploreCardModel.ts`).

**Guard:** `src/config/mapNavigationGuard.test.ts` (included in `npm run verify:domain`).

---

## 15. Viewer access & detail exposure (authorization model)

**Purpose:** One **standardized access-control system** for “who may see full entity detail vs map peek vs sign-in prompt.” Separate from **member capabilities** (`canPublish`, host console) and from **join CTAs** (`participationMode`, `joinRequestUi`).

**Related:** [`CREATE_FLOW.md`](./CREATE_FLOW.md) (discovery + participation fields) · [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) (capabilities ≠ viewer access) · [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §7 **C16** · [`API_ROUTING.md`](./API_ROUTING.md) (activity detail route)

**Cursor (agents):** `.cursor/rules/viewer-access.mdc`

---

### 15.1 Access layers (do not conflate)

| Layer | Question | Canonical source | Never use for |
|-------|----------|------------------|---------------|
| **0. Identity** | Is there a signed-in member? | `req.auth` / `viewerUserId` | Host tier, Pro, roster |
| **1. Platform role** | Admin / merchant / tenant job on JWT? | `UserRole`, `PLATFORM_ADMIN` bypass | Consumer Organize gates |
| **2. Member capability** | May this account **act** (Organize, host console, paid publish)? | `HostStatusDTO`, **`member-host-status.ts` only** | Reading someone else's activity |
| **3. Entity discovery** | Is this row on the explore map vs link-only? | `ActivityJoinMode` | RSVP vs approval |
| **4. Participation** | How do you join the roster? | `ParticipationMode`, demand requests | Detail payload depth |
| **5. Social viewer access** | Relationship to **this** entity (host, participant, …)? | `*-viewer-access.ts` resolvers | `canPublish`, Pro SKU |
| **6. Detail exposure** | What payload depth for this surface? | `DetailExposure`, `viewerAccess` on API | Ad-hoc FE `if (!user)` |
| **7. Entitlements (future)** | Paid / Pro / premium unlock on top? | **TBD** `entitlements` service | Replacing roster rules |

**Today:** `computeActivityDetailExposure` implements **layer 6 for activities** from **layers 3 + 5** only. That is the correct *slice* for map peek / join-to-see-detail — not the whole access system.

**UI copy:** `joinMode: open` means **listed on map**, not “open to view full detail.” Product labels: *Listed on map* / *Link-only plan* in organize audience step ([`CREATE_FLOW.md`](./CREATE_FLOW.md), [`PRIVATE-ORGANIZE-PLANS`](./experiment/flows/PRIVATE-ORGANIZE-PLANS.md)).

---

### 15.2 Canonical resolvers (server — single write path)

| Entity | Resolver | Tests | HTTP surfaces |
|--------|----------|-------|----------------|
| **Activity** | `apps/api/src/services/activity-viewer-access.ts` → `resolveActivityViewerAccess` | `apps/api/tests/activity-viewer-access.test.ts` | `GET /activities/:id`, future redaction on `GET /explore/map` items |
| **Member profile** | `resolveProfileViewerAccess` + `computeProfileDetailExposure` (`profile-viewer-access.ts`) | `profile-viewer-access.test.ts`, shared-types | `GET /users/:id/public-profile` → `{ data, viewerAccess }`; guests `sign_in` only |
| **Place (catalog)** | Public read today — no roster | — | `GET /places/:id` |
| **Shop / operator** | **TBD** — policy in §15.4 row “commerce” | — | Shop public pages |
| **Demand (intent)** | **TBD** — `resolveDemandViewerAccess` or intent detail API | — | Map peek; no `/demand/:id` URL |

**Rule:** Routes call the resolver; they do **not** embed parallel `if (!user)` trees. Frontend **must not** invent roster/detail policy (see §15.6 interim drift).

**Access context (input to activity resolver — Phase 2):**

```ts
type ActivityAccessSurface =
  | 'explore_map'      // peek card projection
  | 'activity_route'   // /activity/:id (share link, notification)
  | 'host_console'
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
  };
}
```

**Legacy:** `ActivityDetailDTO.visibilityState: 'full' | 'private'` maps to exposure until clients migrate (`full` → `full`, `private` stub → `none`).

**Explore map item (target — optional field on activity/demand pins):**

```ts
viewerAccess: { canOpenDetailPage: boolean; gateReason: ViewerGateReason };
```

Computed server-side with `surface: 'explore_map'` so peek titles do not re-derive join state.

---

### 15.4 Policy matrix (product contract — lock before Phase 2 code)

**Status:** **VA-2–VA-7 shipped** for activities, demand, shops, and public venues on `GET /explore/map`. Private activity `link_holder` on detail route may still differ from open-map policy — see notes column.

| Discovery (`joinMode`) | Viewer | Surface | Exposure (TARGET) | `gateReason` | Notes |
|------------------------|--------|---------|-------------------|--------------|--------|
| `open` | anonymous | map + `/activity/:id` | `redacted` | `sign_in` | **TARGET** — today **LIVE** API returns **full** for guests |
| `open` | member, not on roster | map + `/activity/:id` | `redacted` | `join_required` | **TARGET** |
| `open` | participant or active request¹ | any | `full` | `null` | Align with participation resolver |
| `open` | host / tenant staff | any | `full` | `null` | **LIVE** |
| `private` | anonymous | `/activity/:id` | `none` | `sign_in` | **LIVE** (`visibilityState: private` stub) |
| `private` | signed-in, not roster | `/activity/:id` | `redacted` | `join_required` | **LIVE** — `link_holder` → redacted preview + join CTA |
| `private` | participant / host | any | `full` | `null` | **LIVE** |
| **Demand** | anonymous | map peek | `redacted` | `sign_in` | **TARGET** — align with activity peek rules |
| **Demand** | approved joiner | map / future detail | `full` | `null` | Intent request queue |
| **Place** | anyone | detail pages | `full` | `null` | Public catalog |
| **Shop** | guest | map peek + detail | `redacted` | `sign_in` | **LIVE** — `resolveCommerceMapViewerAccess`; FE uses `viewerAccess` |
| **Shop** | signed-in member | detail | `full` | `null` | **LIVE** |

¹ **Active request** for private activities today includes **waitlisted** (`join_request` level) — see API tests.

**Participation axis (unchanged):** `participationMode` only affects **how** you join (`I'm going` vs `Request to join`) and `joinRequestUi` — not map discovery. Demand never has `participationMode` ([`CREATE_FLOW.md`](./CREATE_FLOW.md)).

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
| `explore-browse` / `explore-going` | Browse list / Explore going panel (`view=going`) |

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
| **VA-4** | `GET /explore/map` activity/demand items include `viewerAccess` hints | `explore-map-viewer-access.ts` (post-cache enrich) ✅ |
| **VA-5** | `mapViewerAccessToUi`; peek + `ActivityDetail` consume wire; unify guest lock copy | `mapViewerAccessToUi.ts`, `ActivityDetail.tsx` ✅ |
| **VA-6** | Single FE peek resolver (`resolvePeekDetailAccess`) | `src/access/resolvePeekDetailAccess.ts` ✅ |
| **VA-7** | Shop/commerce row in §15.4 + resolver | `catalog-viewer-access.ts` + map enrich ✅ |

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
| `hostStatus` | Optional snapshot from `GET /me/host-status` — **capabilities only**, loaded server-side for mutations; avoid shipping whole DTO on every public read |
| `surface` | `explore_map`, `activity_route`, `host_console`, … |
| `tenantScope` | `x-organisation-id` when acting as business host |

**Where each concern lives:**

| Concern | Layer | Example |
|---------|-------|---------|
| Guest vs signed-in | 0 | `gateReason: sign_in` |
| Platform admin sees all | 1 | Early bypass in resolver (already `platform_admin` level) |
| Buddy vs agency **can publish** | 2 | `canPublish`, `canHostPaidActivities` — Organize FAB, `POST /host/activities` |
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
| Capability tiers | `apps/api/src/services/member-host-status.ts` |
| Activity social access | `activity-viewer-access.ts` + `computeActivityDetailExposure` |
| Activity detail pipeline | `compose-activity-viewer-access.ts` → social then `applyActivityViewEntitlements` |
| Profile social access | `profile-viewer-access.ts` |
| Member audience ladder | `packages/shared-types/src/member-access.ts` — `MemberAudience`, `organizeEntitlementDenial` |
| Future entitlements | `apps/api/src/services/member-entitlements.ts` — composes **after** social exposure |
| Wire DTO | `packages/shared-types` — `ActivityViewerAccessDTO`, later `EntitlementDenial[]` if needed |
| Guest copy | `guestBrowseGateCopy` — **presentation** for `sign_in` only |

**Refactor note:** When Pro-gated detail ships, **wrap** `resolveActivityViewerAccess` with `applyEntitlementsToActivityView(...)` — do not fold Pro into `computeActivityDetailExposure`.
