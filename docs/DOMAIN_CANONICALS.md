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
| `organisation` | **Organisation** (guide/agency tenant) | `tenants`, operator profile | “Organizer” table |
| `shop` | **Shop** | `merchant_profiles` + SHOP `tenants` | “Merchant” as product noun |
| `person` | **Person** / member | `users` (profile fields) | “User” in consumer copy |

**Demand (Find)** is not a sixth entity kind on URLs — it is a **`participant_intent`** row surfaced on the map; deep links use explore pin/query (`exploreDemandMapItemPath`), not `/demand/:id`.

**Trips** is a **UI hub** (`/trips`) for relationships to activities and saves — not a domain type.

---

## 2. Three naming layers (always specify which you mean)

| Layer | Use for | Examples |
|-------|---------|----------|
| **Product / UI** | Copy, nav labels | Place, Activity, Organise, Friends, Pro Membership |
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
| Compose FAB | `compose=organize:*` \| `find:*` \| `add:*` | `/host/activities/new` for consumers |
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
