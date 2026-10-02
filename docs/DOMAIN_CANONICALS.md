# Domain objects, canonical names & routing

**Purpose:** One vocabulary for **entities**, **wire/storage names**, **TypeScript symbols**, **public URLs**, and **HTTP paths**. Use this for naming and routing hygiene passes — not ad-hoc synonyms per PR.

**Related:** [`DOMAIN.md`](./DOMAIN.md) (glossary depth) · [`NAMING_HOST_MEMBER.md`](./NAMING_HOST_MEMBER.md) (host vs join) · [`API_ROUTING.md`](./API_ROUTING.md) (HTTP) · [`NAVIGATION.md`](./NAVIGATION.md) (surface contract) · [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) (bounded contexts)

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
| Community (desktop) | `/community` | `COMMUNITY_PATH` — not product home (`/explore` is) |
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

Shim `src/utils/exploreRouting.ts` is **deprecated** — explore code imports `src/explore/routing.ts` only (enforced by `exploreModuleBoundary.test.ts`).

---

## 5. HTTP API canon (member vs host)

| Scope | Prefix | Header | Examples |
|-------|--------|--------|----------|
| Public read | `/activities`, `/explore/map`, `/places` | — | Browse |
| Member | `/me/*` | Bearer | `participant-intents`, `host-status`, profile |
| Tenant console | `/host/*` | Bearer + `x-organisation-id` | `activities`, **`/host/requests`** (activity join queue) |
| Person public | `/users/:id` | optional | Public profile |

**Kebab-case plurals** on URLs: `participant-intents`, not `intents` or `demand`.

**Client modules:** `src/api/domains/*.ts` — canonical method names (`getOrganisationProfile`, `getMemberHostStatus`, `getPublicPlaces`). **`legacyApi`** aliases are frozen; do not add (see `apiLegacyGuard.test.ts`).

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

**Demand vs activity join:** always qualify — “activity join request” vs “demand join request” ([`NAMING_HOST_MEMBER.md`](./NAMING_HOST_MEMBER.md)).

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
